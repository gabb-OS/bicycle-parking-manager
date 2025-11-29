from flask import Blueprint

events_bp = Blueprint('events', __name__, url_prefix='/events')


# ----------------------------------------------------------------------
#                           PARKING EVENTS
# ----------------------------------------------------------------------
# Signal a 'parking event' (from the App)
# Incoming request payload must contain:
#  - user id
#  - gps coordinates
#  - timestamp
@events_bp.post("/parking")
def parking_event():
    return {"status": "success"}

# Get all user 'parking events' (from the App)
@events_bp.get("/parking/<userId>")
def get_user_parking_events():
    return {"status": "success"}