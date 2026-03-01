from datetime import datetime
from flask import Blueprint, jsonify, request
from geoalchemy2 import WKTElement, functions as geo_func
from flaskr.extensions import db
from flaskr.models.events import ParkingEvent, EventType
from flaskr.models.parking_areas import ParkingArea
from flaskr.models.users import User
from flaskr.guards.firebase_guard import firebase_guard

events_bp = Blueprint('events', __name__, url_prefix='/events')


# ----------------------------------------------------------------------
#                           PARKING EVENTS - CREATE
# ----------------------------------------------------------------------

@events_bp.route("/park", methods=["POST"])
@firebase_guard
def start_parking(token):
    data = request.get_json()

    email = token.get('email')
    user = User.get_by_email(email)
    
    required_fields = ['longitude', 'latitude', 'timestamp']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400

    # Expects an ISO_LOCAL_DATE_TIME (ISO-8601) - e.g., "2026-01-05T15:48:45"
    try:
        current_timestamp = datetime.fromisoformat(data['timestamp'])
    except ValueError:
        return jsonify({"error": "Invalid timestamp format"}), 400

    # Returns area by point, if area exists
    longitude = data['longitude']
    latitude = data['latitude']
    location_point = WKTElement(f'POINT({longitude} {latitude})', srid=4326)
    
    parking_area = ParkingArea.get_by_locationpoint(location_point)
    parking_area_id = None
    area_name = "Parcheggio libero"

    privacy_mode = data.get("privacy_mode", "none")

    if parking_area:
        parking_area_id = parking_area.id
        area_name = parking_area.name

        # Check which Geoprivacy mode is required
        # If field does not exists, no privacy is applied
        if privacy_mode == "centroid":
            location_point = ParkingArea.get_centroid_by_area(parking_area)
        elif privacy_mode == "random":
            location_point = ParkingArea.get_random_point_in_area(parking_area)

        if not parking_area.park_bicycle():
            return jsonify({"error": "Parking area is full"}), 400
            
    else:
        if privacy_mode == "random":
            randomization_level = data.get("randomization_level", "none")
            location_point = ParkingArea.get_random_point_in_circle(location_point, randomization_level)

    event = ParkingEvent(
        type=EventType.PARK,
        location_point=location_point,
        user_id=user.id,
        parking_area_id=parking_area_id,
        start_time=current_timestamp
    )
    
    db.session.add(event)
    db.session.commit()

    return jsonify({
        "message": "Parking started successfully",
        "parking_area": area_name,
        "event_id": event.id 
    }), 201


@events_bp.route("/leave", methods=["PATCH"])
@firebase_guard
def leave_parking(token):
    data = request.get_json()
    
    email = token.get('email')
    user = User.get_by_email(email)
    
    required_fields = ['longitude', 'latitude', 'timestamp', 'event_id']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400

    # Expects an ISO_LOCAL_DATE_TIME (ISO-8601) - e.g., "2026-01-05T15:48:45"
    try:
        current_timestamp = datetime.fromisoformat(data['timestamp'])
    except ValueError:
        return jsonify({"error": "Invalid timestamp format"}), 400

    location_point = WKTElement(f'POINT({data["longitude"]} {data["latitude"]})', srid=4326)
    parking_area = ParkingArea.get_by_locationpoint(location_point)
    
    # Looking for latest active park event for user.id user AND that is at least MAX_DISTANCE_METERS close to actual user location
    existing_event = ParkingEvent.get_active_park_event(
        user.id, 
        data['event_id'],
        current_timestamp
    )

    if existing_event is None:
        return jsonify({"error": f"No active parking session found for this user"}), 404

    # MAX_DISTANCE_METERS must be larger than the Cloacking Random Privacy setting HIGH/LOW for tolerate privacy distance offset
    # Right now HIGH = 100 meters, LOW = 50 meters
    MAX_DISTANCE_METERS = 300
    distance_meters = db.session.scalar(
        geo_func.ST_DistanceSphere(existing_event.location_point, location_point)
    )
    if distance_meters > MAX_DISTANCE_METERS:
        return jsonify({
            "error": f"You are too far from the parking spot ({int(distance_meters)}m). You must be within {MAX_DISTANCE_METERS}m to leave."
        }), 400

    
    if parking_area:
        if not parking_area.leave_parking():
            return jsonify({"error": "Parking area capacity error (already empty)"}), 400
    
    # Closing park event
    existing_event.type = EventType.LEAVE
    existing_event.end_time = current_timestamp
    
    db.session.commit()

    duration = (existing_event.end_time - existing_event.start_time).total_seconds()
    area_name = parking_area.name if parking_area else "Free Parking"

    return jsonify({
        "message": "Parking session ended successfully",
        "parking_area": area_name,
        "duration_seconds": duration
    }), 200

# ----------------------------------------------------------------------
#                           PARKING EVENTS - READ
# ----------------------------------------------------------------------

# Get all parking events
@events_bp.route("/", methods=["GET"])
def get_all_events():
    events = ParkingEvent.get_all()
    return jsonify([event.to_dict() for event in events])


# Get single event by ID
@events_bp.route("/<int:event_id>", methods=["GET"])
def get_event_by_id(event_id):
    event = ParkingEvent.get_by_id(event_id)
    if event is None:
        return jsonify({"error": "Event not found"}), 404
    return jsonify(event.to_dict())


# Get all user 'parking events' (from the App)
@events_bp.route("/user/personalevents", methods=["GET"])
@firebase_guard
def get_user_parking_events(token):
    email = token.get('email')
    user = User.get_by_email(email)
    # Left join that returns user personal events also with relative parking area
    results = db.session.query(ParkingEvent, ParkingArea.name) \
        .outerjoin(ParkingArea, ParkingEvent.parking_area_id == ParkingArea.id) \
        .filter(ParkingEvent.user_id == user.id) \
        .all()
    
    # We want to return parking area name per each returned record
    events_with_names = []
    for event, area_name in results:
        event.parking_area_name = area_name if area_name else "Parcheggio libero"
        events_with_names.append(event.to_dict_with_parkingname())
    
    return jsonify(events_with_names)


# ----------------------------------------------------------------------
#                           PARKING EVENTS - GEOJSON
# ----------------------------------------------------------------------

# Get all events as GeoJSON FeatureCollection
@events_bp.route("/geojson", methods=["GET"])
def get_all_events_geojson():
    events = ParkingEvent.get_all()
    return jsonify({
        "type": "FeatureCollection",
        "features": [event.to_geojson_feature() for event in events]
    })