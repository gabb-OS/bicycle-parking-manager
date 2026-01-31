import uuid
import numpy as np
from sklearn.cluster import DBSCAN
from shapely.geometry import MultiPoint, shape
from geoalchemy2.shape import to_shape
from geoalchemy2.elements import WKTElement
from flaskr.extensions import db
from flaskr.models.events import ParkingEvent, EventType
from flaskr.models.parking_areas import ParkingArea

class ClusteringService:
    
    EPSILON_METERS = 10
    EPSILON_RADIANS = EPSILON_METERS / 6371000  # ~3.14e-6
    
    # MIN_SAMPLES: The number of samples (or total weight) in a neighborhood for a point to be considered as a core point.
    MIN_SAMPLES = 3

    @staticmethod
    def perform_clustering():
        # 1. Fetch "Orphan" Parking Events (No associated Parking Area)
        # We fetch ALL orphans (both PARK and LEAVE) to capture all parking sessions
        # A completed session (LEAVE) still represents a valid parking location
        orphan_events = ParkingEvent.query.filter(
            ParkingEvent.parking_area_id == None
        ).all()

        if not orphan_events:
            return {"message": "No orphan events found to cluster.", "new_areas": 0}

        # 2. Prepare Data for DBSCAN
        # Extract coordinates (Lat, Lon) from GeoAlchemy objects
        coords = []
        event_map = [] # To map index back to event object

        for event in orphan_events:
            # location_point is a WKBElement, convert to Shapely
            point = to_shape(event.location_point)
            # Store as [lat, lon] or [x, y]. 
            # Note: DBSCAN uses Euclidean distance by default. For small areas, degrees are okay.
            # For high precision, you would project to meters, but degrees are fine for this prototype.
            coords.append([point.x, point.y]) 
            event_map.append(event)

        if len(coords) < ClusteringService.MIN_SAMPLES:
            return {"message": "Not enough data points to form a cluster.", "new_areas": 0}

        # 3. Run DBSCAN
        # Convert eps from meters to radians (Earth radius ≈ 6371000 meters)

        # Coordinates in [latitude, longitude] order and converted to radians
        coords_radians = np.radians([[lat, lon] for lon, lat in coords])

        # We use 'haversine' metric for geographic coordinates
        clustering = DBSCAN(
            eps=ClusteringService.EPSILON_RADIANS, 
            min_samples=ClusteringService.MIN_SAMPLES, 
            metric='haversine'
        ).fit(coords_radians)
        
        labels = clustering.labels_
        unique_labels = set(labels)
        
        new_areas_count = 0

        # 4. Process Clusters
        for label in unique_labels:
            if label == -1:
                # Label -1 means "Noise" (outliers), these points remain orphans
                continue

            # Get all events belonging to this specific cluster
            cluster_indices = [i for i, x in enumerate(labels) if x == label]
            cluster_events = [event_map[i] for i in cluster_indices]
            cluster_points = [coords[i] for i in cluster_indices]

            # 5. Create Convex Hull (Polygon)
            # MultiPoint creates a collection, convex_hull wraps them in a polygon
            shapely_multipoint = MultiPoint(cluster_points)
            shapely_hull = shapely_multipoint.convex_hull

            # If the points form a line or single point, buffer it slightly to make it a Polygon
            if shapely_hull.geom_type in ['Point', 'LineString']:
                shapely_hull = shapely_hull.buffer(0.0001) # Small buffer to create area

            # Convert to WKT for Database
            wkt_geom = WKTElement(shapely_hull.wkt, srid=4326)

            # 6. Create New Parking Area in DB
            new_area_name = f"Auto-Cluster-{uuid.uuid4().hex[:8]}"
            
            # Estimate capacity based on points count (or set a default)
            estimated_capacity = len(cluster_events) + 5 

            new_area = ParkingArea(
                name=new_area_name,
                location_area=wkt_geom,
                max_capacity=estimated_capacity,
                residual_capacity=estimated_capacity # Initially empty? Or should we count the current events?
            )
            
            db.session.add(new_area)
            db.session.flush() # Flush to get the new_area.id before commit

            # 7. Update the Events to belong to this new Area
            # This ensures they aren't processed again next time
            for event in cluster_events:
                event.parking_area_id = new_area.id
                # Optional: If the event is still active (no end_time), decrement residual capacity
                if event.end_time is None:
                    if new_area.residual_capacity > 0:
                        new_area.residual_capacity -= 1

            new_areas_count += 1

        db.session.commit()
        
        return {
            "message": "Clustering completed successfully.", 
            "total_orphans_processed": len(orphan_events),
            "new_areas_created": new_areas_count
        }