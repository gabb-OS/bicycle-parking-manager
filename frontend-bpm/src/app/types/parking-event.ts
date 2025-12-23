import { Feature, FeatureCollection, Point } from 'geojson';

// Properties interface for parking event features
export interface ParkingEventProperties {
  id: number;
  user_id: number;
  parking_area_id: number;
  type: 'park' | 'leave';
  start_time: string;
  end_time: string;
}

// Type aliases using standard GeoJSON types
export type ParkingEventFeature = Feature<Point, ParkingEventProperties>;
export type ParkingEventsGeoJSON = FeatureCollection<Point, ParkingEventProperties>;
