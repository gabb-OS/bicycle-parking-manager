import { Component, OnDestroy, OnInit } from '@angular/core';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import Style from 'ol/style/Style';
import Icon from 'ol/style/Icon';
import Stroke from 'ol/style/Stroke';
import Fill from 'ol/style/Fill';
import { Subject, take, takeUntil } from 'rxjs';
import { ParkinAreasService } from '@core/services/parking-areas.service';
import { ParkingAreasGeoJSON } from '@core/types/parking-area';
import { ParkingEventsService } from '@core/services/parking-events.service';
import { ParkingEventsGeoJSON } from '@core/types/parking-event';

/**
 * Map component for visualizing bicycle parking areas and events.
 *
 * @description
 * This component integrates OpenLayers to display an interactive map with two main layers:
 * 1. Parking Areas Layer - Shows designated parking zones as colored polygons
 * 2. Parking Events Layer - Shows individual parked bicycles as point markers
 *
 * Service Integration:
 * The component subscribes to two reactive services that manage data flow:
 * - ParkinAreasService.parkingAreas$ - Provides parking area polygons with capacity information
 * - ParkingEventsService.parkingEvents$ - Provides individual parking event points
 *
 * Data Flow:
 * 1. Component initializes and subscribes to both services' Observables
 * 2. Initial data fetch is triggered using take(1) to get current state
 * 3. Services emit GeoJSON data through BehaviorSubjects
 * 4. Component receives updates and converts GeoJSON to OpenLayers features
 * 5. Features are added to their respective layers on the map
 * 6. Map automatically re-renders with the new features
 *
 */

/*TODO: on marker click, show popup OR open side window*/

@Component({
  selector: 'app-map',
  imports: [],
  templateUrl: './map.html',
  styleUrl: './map.css',
  standalone: true,
})
export class MapComponent implements OnInit, OnDestroy {
  /**
   * Subject used for cleaning up subscriptions when the component is destroyed.
   * All subscriptions should use takeUntil(destroy$) to prevent memory leaks.
   */
  private destroy$ = new Subject<void>();

  constructor(
    private parkingAreasService: ParkinAreasService,
    private parkingEventsService: ParkingEventsService
  ) {}

  private map: Map | undefined;

  private view = new View({
    center: fromLonLat([11.355432, 44.498089]),
    zoom: 17
  });

  /**
   * Base tile layer using OpenStreetMap as the map background.
   */
  private osmLayer = new TileLayer({
    source: new OSM({
    })
  });

  /**
   * Style configuration for point geometries (parking events).
   * Displays a bicycle icon at each parking event location.
   */
  private pointStyle = new Style({
    image: new Icon({
      src: 'assets/mapIcons/pedal_bike.png',
      scale: 0.40,
    })
  });

  /**
   * Calculates the color for a parking area based on its occupancy ratio.
   *
   * @param residualCapacity - Number of free parking spots remaining
   * @param maxCapacity - Total number of parking spots in the area
   * @returns RGBA color string representing the occupancy level
   *
   * @description
   * Color coding:
   * - Green (0, 255, 0): Area is mostly empty (high residual capacity)
   * - Yellow-Orange: Area is partially occupied
   * - Red (255, 0, 0): Area is nearly full (low residual capacity)
   * - Gray (128, 128, 128): Invalid capacity (maxCapacity is 0)
   *
   * The color is calculated using linear interpolation between green and red
   * based on the occupancy ratio: (maxCapacity - residualCapacity) / maxCapacity
   */
  private getCapacityColor(residualCapacity: number, maxCapacity: number): string {
    if (maxCapacity === 0) return 'rgba(128, 128, 128, 0.8)'; // Gray for invalid capacity

    const occupancyRatio = 1 - (residualCapacity / maxCapacity);
    const clampedRatio = Math.max(0, Math.min(1, occupancyRatio));

    // Interpolate from green (0, 255, 0) to red (255, 0, 0)
    const red = Math.round(255 * clampedRatio);
    const green = Math.round(255 * (1 - clampedRatio));

    return `rgba(${red}, ${green}, 0, 0.8)`;
  }

  /**
   * Creates a polygon style with color based on parking area capacity.
   *
   * @param residualCapacity - Number of free parking spots remaining
   * @param maxCapacity - Total number of parking spots in the area
   * @returns OpenLayers Style object for rendering the polygon
   *
   * @description
   * Generates a Style with both stroke and fill, where:
   * - Stroke: Uses the capacity color at 80% opacity
   * - Fill: Uses the same color at 20% opacity for better visibility
   */
  private createPolygonStyle(residualCapacity: number, maxCapacity: number): Style {
    const color = this.getCapacityColor(residualCapacity, maxCapacity);
    return new Style({
      stroke: new Stroke({
        color: color,
        width: 2,
      }),
      fill: new Fill({
        color: color.replace('0.8', '0.2'), // Use same color with lower opacity for fill
      }),
    });
  }

  /**
   * Dynamic style function that applies appropriate styling based on geometry type.
   *
   * @param feature - OpenLayers feature to be styled
   * @returns Style object for the feature, or undefined if geometry type is unsupported
   *
   * @description
   * Applies different styles based on feature geometry:
   * - Point: Uses bicycle icon style (for parking events)
   * - Polygon: Uses capacity-based color style (for parking areas)
   *
   * For polygons, extracts residual_capacity and max_capacity properties
   * to determine the appropriate color coding.
   */
  private styleFunction = (feature: any) => {
    const geometryType = feature.getGeometry().getType();
    if (geometryType === 'Point') {
      return this.pointStyle;
    } else if (geometryType === 'Polygon') {
      const properties = feature.getProperties();
      const residualCapacity = properties.residual_capacity ?? 0;
      const maxCapacity = properties.max_capacity ?? 1;
      return this.createPolygonStyle(residualCapacity, maxCapacity);
    }
    console.error('Unsupported geometry type:', geometryType);
    return undefined;
  };

  /**
   * Vector layer for displaying parking areas as polygons.
   * Uses the styleFunction to apply capacity-based color coding.
   */
  private parkingAreasLayer = new VectorLayer({
    source: new VectorSource(),
    style: this.styleFunction
  });

  /**
   * Vector layer for displaying parking events as point markers.
   * Uses the styleFunction to apply bicycle icon styling.
   */
  private parkingEventsLayer = new VectorLayer({
    source: new VectorSource(),
    style: this.styleFunction
  });

  /**
   * Component initialization lifecycle hook.
   *
   * @description
   * Performs the following initialization steps:
   *
   * 1. Creates OpenLayers Map instance with base OSM layer and two vector layers
   * 2. Sets up reactive subscriptions to both parking services
   * 3. Triggers initial data fetch from both services
   *
   * Subscription Flow:
   * - Subscribes to parkingAreasService.parkingAreas$ Observable
   * - Subscribes to parkingEventsService.parkingEvents$ Observable
   * - Both use takeUntil(destroy$) for automatic cleanup on component destruction
   *
   * Data Processing:
   * When data is received from either service:
   * 1. Converts GeoJSON data to OpenLayers features using the GeoJSON format reader
   * 2. Handles coordinate transformation from EPSG:4326 to EPSG:3857
   * 3. Clears existing features from the layer
   * 4. Adds new features to the layer
   * 5. Map automatically re-renders with updated features
   *
   * Initial Data Fetch:
   * Uses take(1) to fetch initial data without keeping the HTTP subscription open.
   * The data is broadcast through the services' BehaviorSubjects to all subscribers.
   */
  ngOnInit() {
    this.map = new Map({
      target: 'map',
      view: this.view,
      layers: [this.osmLayer, this.parkingAreasLayer, this.parkingEventsLayer]
    });

    // Subscribe to parking areas updates from the service
    // Automatically receives new data whenever parkingAreasService emits updates
    this.parkingAreasService.parkingAreas$
      .pipe(takeUntil(this.destroy$))
      .subscribe((parkingAreas: ParkingAreasGeoJSON | null) => {
        console.log('Received parking areas update:', parkingAreas);
        if (parkingAreas) {
          // Convert GeoJSON to OpenLayers features with coordinate transformation
          const features = new GeoJSON().readFeatures(parkingAreas, {
            dataProjection: 'EPSG:4326',    // Input: WGS84 (lat/lon)
            featureProjection: 'EPSG:3857' // Output: Web Mercator (map projection)
          });
          // Update layer with new features
          this.parkingAreasLayer.getSource()?.clear();
          this.parkingAreasLayer.getSource()?.addFeatures(features);
        }
      });

    // Subscribe to parking events updates from the service
    // Automatically receives new data whenever parkingEventsService emits updates
    this.parkingEventsService.parkingEvents$
      .pipe(takeUntil(this.destroy$))
      .subscribe((parkingEvents: ParkingEventsGeoJSON | null) => {
        console.log('Received parking events update:', parkingEvents);
        if (parkingEvents) {
          // Convert GeoJSON to OpenLayers features with coordinate transformation
          const features = new GeoJSON().readFeatures(parkingEvents, {
            dataProjection: 'EPSG:4326',    // Input: WGS84 (lat/lon)
            featureProjection: 'EPSG:3857' // Output: Web Mercator (map projection)
          });
          // Update layer with new features
          this.parkingEventsLayer.getSource()?.clear();
          this.parkingEventsLayer.getSource()?.addFeatures(features);
        }
      });

    // Trigger initial data fetch for both services
    // take(1) ensures the HTTP subscription completes after receiving the response
    // The services' BehaviorSubjects broadcast the data to all subscribers
    this.parkingAreasService.getParkingAreasGEOJSON().pipe(take(1)).subscribe();
    this.parkingEventsService.getParkingEventsGEOJSON().pipe(take(1)).subscribe();
  }

  /**
   * Component cleanup lifecycle hook.
   *
   * @description
   * Properly unsubscribes from all reactive subscriptions to prevent memory leaks.
   * Emits a value through destroy$ which triggers takeUntil() to complete all subscriptions.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
