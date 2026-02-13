from flask import Blueprint, jsonify, request
from sqlalchemy import func
from flaskr.extensions import db
from flaskr.models.parking_areas import ParkingArea
from flaskr.services.clustering_service import ClusteringService

areas_bp = Blueprint('areas', __name__, url_prefix='/areas')

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

@areas_bp.route("/cluster/run", methods=["POST"])
def trigger_clustering():
    """Manually triggers the parking area clustering algorithm."""
    try:
        result = ClusteringService.perform_clustering()
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
