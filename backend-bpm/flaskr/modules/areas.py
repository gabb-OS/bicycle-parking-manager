from flask import Blueprint

areas_bp = Blueprint('Areas', __name__, url_prefix='/areas')

@areas_bp.route("/test", methods=["GET"])
def say_hello():
    return "Hello!"

# ----------------------------------------------------------------------
#                           PARKING AREAS
# ----------------------------------------------------------------------
# Returns poligons of all the parking areas, for a certain date, with:
#   - residualCapacity
#   - maxCapacity
# If no timestamp is given, current residualCapacity is returned
@areas_bp.route("/capacity/<end_timestamp>", methods=["GET"])
def get_parking_areas_capacity():
    return {"areas": []}

# Return poligons of parking areas, for a certain time interval
@areas_bp.route("/<start_timestamp>/<end_timestamp>", methods=["GET"])
def get_past_parking_areas():
    return {"areas": []}

# Return single parking area residualCapacity, aggregated for a certain time interval
# !! For simplicity now we can consider a default 'monthly' aggregation
# "areas/capacity/<id>/<aggrType>"
@areas_bp.get("/capacity/<areaId>", methods=["GET"])
def get_parking_areas_capacity_history():
    return {"areas": []}
