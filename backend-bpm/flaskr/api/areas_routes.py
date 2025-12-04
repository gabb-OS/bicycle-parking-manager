from flask import Blueprint, jsonify, request
from sqlalchemy import func
from flaskr.extensions import db
from flaskr.models.parking_areas import ParkingArea

areas_bp = Blueprint('areas', __name__, url_prefix='/areas')

@areas_bp.route("/test", methods=["GET"])
def say_hello():
    return "Hello!"


# ----------------------------------------------------------------------
#                           PARKING AREAS - BASIC CRUD
# ----------------------------------------------------------------------

# Get all parking areas
@areas_bp.route("/", methods=["GET"])
def get_all_areas():
    areas = ParkingArea.get_all()
    return jsonify([area.to_dict() for area in areas])


# Get single parking area by ID
@areas_bp.route("/<int:area_id>", methods=["GET"])
def get_area_by_id(area_id):
    area = ParkingArea.get_by_id(area_id)
    if area is None:
        return jsonify({"error": "Parking area not found"}), 404
    return jsonify(area.to_dict())


# Get single parking area by name
@areas_bp.route("/name/<string:name>", methods=["GET"])
def get_area_by_name(name):
    area = ParkingArea.get_by_name(name)
    if area is None:
        return jsonify({"error": "Parking area not found"}), 404
    return jsonify(area.to_dict())


# Get all parking areas as GeoJSON FeatureCollection
@areas_bp.route("/geojson", methods=["GET"])
def get_all_areas_geojson():
    areas = ParkingArea.get_all()
    return jsonify({
        "type": "FeatureCollection",
        "features": [area.to_geojson_feature() for area in areas]
    })


# Get single parking area as GeoJSON Feature
@areas_bp.route("/<int:area_id>/geojson", methods=["GET"])
def get_area_geojson(area_id):
    area = ParkingArea.get_by_id(area_id)
    if area is None:
        return jsonify({"error": "Parking area not found"}), 404
    return jsonify(area.to_geojson_feature())


# ----------------------------------------------------------------------
#                           PARKING OPERATIONS
# ----------------------------------------------------------------------

# Park a bicycle in an area
@areas_bp.route("/<int:area_id>/park", methods=["POST"])
def park_bicycle(area_id):
    area = ParkingArea.get_by_id(area_id)
    if area is None:
        return jsonify({"error": "Parking area not found"}), 404
    
    if area.park_bicycle():
        return jsonify({
            "message": "Bicycle parked successfully",
            "area": area.to_dict()
        })
    return jsonify({"error": "Parking area is full"}), 400


# Remove a bicycle from an area
@areas_bp.route("/<int:area_id>/leave", methods=["POST"])
def leave_parking(area_id):
    area = ParkingArea.get_by_id(area_id)
    if area is None:
        return jsonify({"error": "Parking area not found"}), 404
    
    if area.leave_parking():
        return jsonify({
            "message": "Bicycle removed successfully",
            "area": area.to_dict()
        })
    return jsonify({"error": "Parking area is already empty"}), 400


# ----------------------------------------------------------------------
#                           CAPACITY INFO
# ----------------------------------------------------------------------

# Get areas with available spots
@areas_bp.route("/available", methods=["GET"])
def get_available_areas():
    areas = ParkingArea.query.filter(ParkingArea.residual_capacity > 0).all()
    return jsonify([area.to_dict() for area in areas])


# Get full parking areas
@areas_bp.route("/full", methods=["GET"])
def get_full_areas():
    areas = ParkingArea.query.filter(ParkingArea.residual_capacity <= 0).all()
    return jsonify([area.to_dict() for area in areas])


# Get capacity summary
@areas_bp.route("/summary", methods=["GET"])
def get_capacity_summary():
    total_max = db.session.query(func.sum(ParkingArea.max_capacity)).scalar() or 0
    total_residual = db.session.query(func.sum(ParkingArea.residual_capacity)).scalar() or 0
    total_areas = ParkingArea.query.count()
    
    return jsonify({
        "total_areas": total_areas,
        "total_max_capacity": total_max,
        "total_residual_capacity": total_residual,
        "total_occupied": total_max - total_residual,
        "overall_occupancy_percentage": ((total_max - total_residual) / total_max * 100) if total_max > 0 else 0
    })
