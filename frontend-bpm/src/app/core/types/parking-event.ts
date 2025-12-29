import { Feature, FeatureCollection, Point } from 'geojson';

export interface ParkingEvent {
  id: number;
  user_id: number;
  parking_area_id: number;
  location_point: Point;
  type: 'park' | 'leave';
  start_time: string;
  end_time: string;
}

// Properties interface for parking event features
export interface ParkingEventProperties {
  id: number;
  user_id: number;
  parking_area_id: number;
  type: 'park' | 'leave';
  start_time: string;
  end_time: string;
}

export type ParkingEventFeature = Feature<Point, ParkingEventProperties>;
export type ParkingEventsGeoJSON = FeatureCollection<Point, ParkingEventProperties>;
