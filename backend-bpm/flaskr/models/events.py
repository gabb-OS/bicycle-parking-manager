from datetime import datetime
from flaskr.extensions import db
from geoalchemy2 import Geometry
from geoalchemy2.shape import to_shape
import json
import enum


class EventType(enum.Enum):
    PARK = "park"
    LEAVE = "leave"


class ParkingEvent(db.Model):
    __tablename__ = 'parking_events'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    type = db.Column(db.Enum(EventType), nullable=False)
    location_point = db.Column(Geometry(geometry_type='POINT', srid=4326), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    parking_area_id = db.Column(db.Integer, db.ForeignKey('parking_areas.id'), nullable=False)

    # Relationships
    user = db.relationship('User', backref=db.backref('parking_events', lazy='dynamic'))
    parking_area = db.relationship('ParkingArea', backref=db.backref('parking_events', lazy='dynamic'))

    def __init__(self, type, location_point, user_id, parking_area_id, timestamp=None):
        self.type = type
        self.location_point = location_point
        self.user_id = user_id
        self.parking_area_id = parking_area_id
        self.timestamp = timestamp if timestamp is not None else datetime.utcnow()

    def get_location_geojson(self):
        """Converts the geometry to GeoJSON dict."""
        if self.location_point is not None:
            shape = to_shape(self.location_point)
            return json.loads(json.dumps(shape.__geo_interface__))
        return None

    @staticmethod
    def get_by_id(event_id):
        return ParkingEvent.query.get(event_id)

    @staticmethod
    def get_all():
        return ParkingEvent.query.all()

    @staticmethod
    def get_by_user(user_id):
        return ParkingEvent.query.filter(ParkingEvent.user_id == user_id).all()

    @staticmethod
    def get_by_parking_area(parking_area_id):
        return ParkingEvent.query.filter(ParkingEvent.parking_area_id == parking_area_id).all()

    @staticmethod
    def get_by_type(event_type):
        return ParkingEvent.query.filter(ParkingEvent.type == event_type).all()

    @staticmethod
    def get_recent(limit=10):
        return ParkingEvent.query.order_by(ParkingEvent.timestamp.desc()).limit(limit).all()

    def to_dict(self):
        """Converts the object to a dictionary for JSON responses."""
        return {
            "id": self.id,
            "timestamp": self.timestamp.isoformat(),
            "type": self.type.value,
            "location_point": self.get_location_geojson(),
            "user_id": self.user_id,
            "parking_area_id": self.parking_area_id
        }

    def to_geojson_feature(self):
        """Converts the object to a GeoJSON Feature."""
        return {
            "type": "Feature",
            "geometry": self.get_location_geojson(),
            "properties": {
                "id": self.id,
                "timestamp": self.timestamp.isoformat(),
                "type": self.type.value,
                "user_id": self.user_id,
                "parking_area_id": self.parking_area_id
            }
        }

    def __repr__(self):
        return f"<ParkingEvent {self.id} - {self.type.value} at {self.timestamp}>"