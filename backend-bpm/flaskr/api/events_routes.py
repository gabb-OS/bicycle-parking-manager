from flask import Blueprint, jsonify, request
from geoalchemy2 import WKTElement
from geoalchemy2 import functions as geo_func
from flaskr.extensions import db
from flaskr.models.events import ParkingEvent, EventType
from flaskr.models.parking_areas import ParkingArea

events_bp = Blueprint('events', __name__, url_prefix='/events')


# ----------------------------------------------------------------------
#                           PARKING EVENTS - CREATE
# ----------------------------------------------------------------------
# Signal a 'parking event' (from the App)
# Incoming request payload must contain:
#  - user_id
#  - longitude, latitude (gps coordinates)
#  - type ("park" or "leave")
#  - timestamp (optional)
@events_bp.route("/parking", methods=["POST"])
def parking_event():
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['user_id', 'longitude', 'latitude', 'type']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400
    
    # Validate event type
    try:
        event_type = EventType(data['type'])
    except ValueError:
        return jsonify({"error": "Invalid event type. Must be 'park' or 'leave'"}), 400
    
    # Create point geometry from coordinates
    longitude = data['longitude']
    latitude = data['latitude']
    location_point = WKTElement(f'POINT({longitude} {latitude})', srid=4326)
    
    # Find the parking area that contains this point
    parking_area = ParkingArea.query.filter(
        geo_func.ST_Contains(ParkingArea.location_area, location_point)
    ).first()
    
    if parking_area is None:
        return jsonify({"error": "Location is not within any parking area"}), 400
    
    # Update parking area capacity based on event type
    if event_type == EventType.PARK:
        if not parking_area.park_bicycle():
            return jsonify({"error": "Parking area is full"}), 400
    else:  # LEAVE
        if not parking_area.leave_parking():
            return jsonify({"error": "Parking area is already empty"}), 400
    
    # Create the event
    event = ParkingEvent(
        type=event_type,
        location_point=location_point,
        user_id=data['user_id'],
        parking_area_id=parking_area.id,
        start_time=data.get('start_time')  # Optional, defaults to now
    )
    
    db.session.add(event)
    db.session.commit()
    
    return jsonify({
        "message": f"Bicycle {event_type.value} event recorded successfully",
        "event": event.to_dict(),
        "parking_area": parking_area.to_dict()
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
@events_bp.route("/user/<int:user_id>", methods=["GET"])
def get_user_parking_events(user_id):
    events = ParkingEvent.get_by_user(user_id)
    return jsonify([event.to_dict() for event in events])


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