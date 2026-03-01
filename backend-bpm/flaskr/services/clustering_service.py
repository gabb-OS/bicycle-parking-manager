import uuid
import numpy as np
from sklearn.cluster import DBSCAN
from shapely.geometry import MultiPoint, shape
from geoalchemy2.shape import to_shape
from geoalchemy2.elements import WKTElement
from geoalchemy2 import functions as geo_func
from flaskr.extensions import db
from flaskr.models.events import ParkingEvent, EventType
from flaskr.models.parking_areas import ParkingArea

class ClusteringService:
    
    EPSILON_METERS = 10
    EPSILON_RADIANS = EPSILON_METERS / 6371000  # Earth radius in meters
    
    # MIN_SAMPLES: The number of samples (or total weight) in a neighborhood for a point to be considered as a core point.
    MIN_SAMPLES = 3

    @staticmethod
    def perform_clustering():
        # Fetch "Orphan" Parking Events (No associated Parking Area)
        # We only fetch PARK events to cluster parking locations
        orphan_events = ParkingEvent.query.filter(
            ParkingEvent.parking_area_id == None,
            ParkingEvent.type == EventType.PARK
        ).all()

        if not orphan_events:
            return {"message": "No orphan events found to cluster.", "new_areas": 0}

        # Prepare Data for DBSCAN
        # Extract coordinates (Lat, Lon) from GeoAlchemy objects
        coords = []
        event_map = [] # To map index back to event object

        for event in orphan_events:
            # location_point is a WKBElement, convert to Shapely
            point = to_shape(event.location_point)
            # Store as [lat, lon] or [x, y]. 
            coords.append([point.x, point.y]) 
            event_map.append(event)

        if len(coords) < ClusteringService.MIN_SAMPLES:
            return {"message": "Not enough data points to form a cluster.", "new_areas": 0}

        # Run DBSCAN
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
        merged_areas_count = 0

        # Process Clusters
        for label in unique_labels:
            if label == -1:
                # Label -1 means "Noise" (outliers), these points remain orphans
                continue

            # Get all events belonging to this specific cluster
            cluster_indices = [i for i, x in enumerate(labels) if x == label]
            cluster_events = [event_map[i] for i in cluster_indices]
            cluster_points = [coords[i] for i in cluster_indices]

            # Create Convex Hull (Polygon) with padding
            # MultiPoint creates a collection, convex_hull wraps them in a polygon
            shapely_multipoint = MultiPoint(cluster_points)
            shapely_hull = shapely_multipoint.convex_hull

            # Buffer to create padding around the parking area
            # 0.00001 degrees ≈ 1 meters padding
            # join_style=2 (mitre) keeps sharp polygon corners instead of rounding them
            BUFFER_DEGREES = 0.00001
            shapely_hull = shapely_hull.buffer(BUFFER_DEGREES, join_style=2)

            # Convert to WKT for Database
            wkt_geom = WKTElement(shapely_hull.wkt, srid=4326)

            # Estimate capacity based on points count
            area_events = len(cluster_events)
            # Count active parking sessions (PARK type = still parked)
            active_parks = sum(1 for e in cluster_events if e.type == EventType.PARK)

            #Check if this polygon intersects with any existing ParkingArea
            intersecting_area = ParkingArea.query.filter(
                geo_func.ST_Intersects(ParkingArea.location_area, wkt_geom)
            ).first()

            if intersecting_area:
                # Merge: Union the new polygon with existing one
                merged_geom = db.session.scalar(
                    geo_func.ST_Union(intersecting_area.location_area, wkt_geom)
                )
                # Update the existing area with the merged geometry and new capacity 
                # updating the location_area with the merged geometry (e.g POLYGON((...)))
                intersecting_area.location_area = WKTElement(
                    db.session.scalar(geo_func.ST_AsText(merged_geom)), 
                    srid=4326
                )
                
                # Update capacity
                intersecting_area.max_capacity += area_events
                intersecting_area.residual_capacity += (area_events - active_parks)
                
                target_area = intersecting_area
                merged_areas_count += 1
            else:
                # No overlap: Create new ParkingArea
                new_area_name = f"Auto-Cluster-{uuid.uuid4().hex[:8]}"
                
                new_area = ParkingArea(
                    name=new_area_name,
                    location_area=wkt_geom,
                    max_capacity=area_events,
                    residual_capacity=area_events - active_parks
                )
                
                db.session.add(new_area)
                db.session.flush()
                
                target_area = new_area
                new_areas_count += 1

            # 7. Update the Events to belong to this Area
            for event in cluster_events:
                event.parking_area_id = target_area.id

        db.session.commit()
        
        return {
            "message": "Clustering completed successfully.", 
            "merged_areas": merged_areas_count,
            "total_orphans_processed": len(orphan_events),
            "new_areas_created": new_areas_count
        }