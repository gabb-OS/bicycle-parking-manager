from flaskr.extensions import db
from geoalchemy2 import Geometry
from geoalchemy2 import functions as geo_func
from geoalchemy2.shape import to_shape
import json


class ParkingArea(db.Model):
    __tablename__ = 'parking_areas'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), unique=True, nullable=False)
    location_area = db.Column(Geometry(geometry_type='POLYGON', srid=4326), nullable=False)
    max_capacity = db.Column(db.Integer, nullable=False)
    residual_capacity = db.Column(db.Integer, nullable=False)

    def __init__(self, name, location_area, max_capacity, residual_capacity=None):
        self.name = name
        self.location_area = location_area
        self.max_capacity = max_capacity
        self.residual_capacity = residual_capacity if residual_capacity is not None else max_capacity

    def park_bicycle(self):
        """Decrements residual capacity when a bicycle is parked."""
        if self.residual_capacity > 0:
            self.residual_capacity -= 1
            db.session.commit()
            return True
        return False

    def leave_parking(self):
        """Increments residual capacity when a bicycle leaves."""
        if self.residual_capacity < self.max_capacity:
            self.residual_capacity += 1
            db.session.commit()
            return True
        return False

    def is_full(self):
        """Check if parking area is full."""
        return self.residual_capacity <= 0

    def get_occupancy_percentage(self):
        """Returns the occupancy percentage."""
        if self.max_capacity == 0:
            return 0
        return ((self.max_capacity - self.residual_capacity) / self.max_capacity) * 100

    def get_geometry_geojson(self):
        """Converts the geometry to GeoJSON dict."""
        if self.location_area is not None:
            shape = to_shape(self.location_area)
            return json.loads(json.dumps(shape.__geo_interface__))
        return None

    @staticmethod
    def get_by_id(parking_id):
        return ParkingArea.query.get(parking_id)

    @staticmethod
    def get_by_name(name):
        return ParkingArea.query.filter(ParkingArea.name == name).first()
    
    @staticmethod
    def get_by_locationpoint(location_point):
        """Returns the parking area that contains a given [lon, lat] point; returns None otherwise"""
        return ParkingArea.query.filter(
            geo_func.ST_Contains(ParkingArea.location_area, location_point)
            ).first()
    
    @staticmethod
    def get_centroid_by_area(parking_area):
        """Returns a centroid-like point for a given area, ensuring that the resulting location lies within the area itself 
        (unlike the standard centroid function, which does not guarantee this)."""
        return geo_func.ST_PointOnSurface(parking_area.location_area)

    @staticmethod
    def get_all():
        return ParkingArea.query.order_by(ParkingArea.name.asc()).all()

    def to_dict(self):
        """Converts the object to a dictionary for JSON responses."""
        return {
            "id": self.id,
            "name": self.name,
            "location_area": self.get_geometry_geojson(),
            "max_capacity": self.max_capacity,
            "residual_capacity": self.residual_capacity,
            "occupancy_percentage": self.get_occupancy_percentage()
        }

    def to_geojson_feature(self):
        """Converts the object to a GeoJSON Feature."""
        return {
            "type": "Feature",
            "geometry": self.get_geometry_geojson(),
            "properties": {
                "id": self.id,
                "name": self.name,
                "max_capacity": self.max_capacity,
                "residual_capacity": self.residual_capacity,
                "occupancy_percentage": self.get_occupancy_percentage()
            }
        }

    def __repr__(self):
        return f"<ParkingArea {self.name}>"