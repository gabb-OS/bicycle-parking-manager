import { Feature, FeatureCollection, Polygon } from 'geojson';

// Properties interface for parking area features
export interface ParkingAreaProperties {
  id: number;
  name: string;
  max_capacity: number;
  residual_capacity: number;
}

// Interface for parking area object from API
export interface ParkingArea {
  id: number;
  name: string;
  location_area: Polygon;
  max_capacity: number;
  residual_capacity: number;
  occupancy_percentage: number;
}

// Type aliases using standard GeoJSON types
export type ParkingAreaFeature = Feature<Polygon, ParkingAreaProperties>;
export type ParkingAreasGeoJSON = FeatureCollection<Polygon, ParkingAreaProperties>;
