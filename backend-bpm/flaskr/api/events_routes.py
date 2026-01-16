from datetime import datetime
from flask import Blueprint, jsonify, request
from geoalchemy2 import WKTElement
from flaskr.extensions import db
from flaskr.models.events import ParkingEvent, EventType
from flaskr.models.parking_areas import ParkingArea
from flaskr.models.users import User
from flaskr.guards.firebase_guard import firebase_guard

events_bp = Blueprint('events', __name__, url_prefix='/events')


# ----------------------------------------------------------------------
#                           PARKING EVENTS - CREATE
# ----------------------------------------------------------------------
# Signal a 'parking event' (from the App)
# Incoming request payload must contain:
#  - user_id
#  - longitude, latitude (gps coordinates)
#  - type ("park" or "leave")
#  - timestamp
@events_bp.route("/parking", methods=["POST"])
@firebase_guard
def parking_event(token):
    data = request.get_json()

    # Get correct user     
    email = token.get('email')
    user = User.get_by_email(email)
    
    # Validate required fields
    required_fields = ['longitude', 'latitude', 'type', 'timestamp']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400
    
    # Validate event type
    try:
        event_type = EventType(data['type'])
    except ValueError:
        return jsonify({"error": "Invalid event type. Must be 'park' or 'leave'"}), 400
    
    # Expexts an ISO_LOCAL_DATE_TIME (ISO-8601) - e.g., "2026-01-05T15:48:45"
    try:
        current_timestamp = datetime.fromisoformat(data['timestamp'])
    except ValueError:
        return jsonify({"error": "Invalid timestamp format"}), 400
    
    # Create point geometry from coordinates
    longitude = data['longitude']
    latitude = data['latitude']
    location_point = WKTElement(f'POINT({longitude} {latitude})', srid=4326)
    parking_area = ParkingArea.get_by_locationpoint(location_point)
    
    if parking_area is None:
        return jsonify({"error": "Location is not within any parking area"}), 400
    
    # Update parking area capacity based on event type
    if event_type == EventType.PARK:
        if not parking_area.park_bicycle():
            return jsonify({"error": "Parking area is full"}), 400

        event = ParkingEvent(
            type=event_type,
            location_point=location_point,
            user_id=user.id,
            parking_area_id=parking_area.id,
            start_time=current_timestamp
        )
        db.session.add(event)

    else:  # LEAVE        
        # Find active PARK event for this user/area with a prior start_time
        existing_event = ParkingEvent.get_active_park_event(
            user.id, 
            parking_area.id, 
            current_timestamp
        )

        if existing_event is None:
            return jsonify({"error": "No corresponding active park event found"}), 400
        
        if not parking_area.leave_parking():
            return jsonify({"error": "Parking area is already empty"}), 400
        
        # Modify the existing event to: type is now LEAVE and updating end_time
        existing_event.type = EventType.LEAVE
        existing_event.end_time = current_timestamp
        event = existing_event

    db.session.commit()
    
    return jsonify({
        "message": f"Bicycle {event_type.value} event recorded successfully",
        "parking_area": parking_area.name
    }), 201


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
        event.parking_area_name = area_name if area_name else "Area non specificata"
        events_with_names.append(event.to_dict_with_parkingname())
    
    return jsonify(events_with_names)
   

# Get all events for a specific parking area
@events_bp.route("/area/<int:area_id>", methods=["GET"])
def get_area_events(area_id):
    events = ParkingEvent.get_by_parking_area(area_id)
    return jsonify([event.to_dict() for event in events])


# Get events by type (park/leave)
@events_bp.route("/type/<string:event_type>", methods=["GET"])
def get_events_by_type(event_type):
    try:
        ev_type = EventType(event_type)
    except ValueError:
        return jsonify({"error": "Invalid event type. Must be 'park' or 'leave'"}), 400
    
    events = ParkingEvent.get_by_type(ev_type)
    return jsonify([event.to_dict() for event in events])


# Get recent events
@events_bp.route("/recent", methods=["GET"])
def get_recent_events():
    limit = request.args.get('limit', 10, type=int)
    events = ParkingEvent.get_recent(limit)
    return jsonify([event.to_dict() for event in events])


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


# Get user events as GeoJSON FeatureCollection
@events_bp.route("/user/<int:user_id>/geojson", methods=["GET"])
def get_user_events_geojson(user_id):
    events = ParkingEvent.get_by_user(user_id)
    return jsonify({
        "type": "FeatureCollection",
        "features": [event.to_geojson_feature() for event in events]
    })