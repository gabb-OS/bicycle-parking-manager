import { Component, effect, input, OnDestroy, OnInit } from '@angular/core';
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
import { ParkingAreasGeoJSON } from '@core/types/parking-area';
import { ParkingEventsGeoJSON } from '@core/types/parking-event';
import { getCapacityColor } from './utils/utils';

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
   * Input signal for parking areas GeoJSON data.
   * Receives data from parent component.
   */
  parkingAreas = input<ParkingAreasGeoJSON | null>(null);

  /**
   * Input signal for parking events GeoJSON data.
   * Receives data from parent component.
   */
  parkingEvents = input<ParkingEventsGeoJSON | null>(null);

  constructor() {
    // Effect to update parking areas layer when input changes
    effect(() => {
      const areas = this.parkingAreas();
      if (areas && this.parkingAreasLayer) {
        const features = new GeoJSON().readFeatures(areas, {
          dataProjection: 'EPSG:4326',
          featureProjection: 'EPSG:3857'
        });
        this.parkingAreasLayer.getSource()?.clear();
        this.parkingAreasLayer.getSource()?.addFeatures(features);
      }
    });

    // Effect to update parking events layer when input changes
    effect(() => {
      const events = this.parkingEvents();
      if (events && this.parkingEventsLayer) {
        const features = new GeoJSON().readFeatures(events, {
          dataProjection: 'EPSG:4326',
          featureProjection: 'EPSG:3857'
        });
        this.parkingEventsLayer.getSource()?.clear();
        this.parkingEventsLayer.getSource()?.addFeatures(features);
      }
    });
  }

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
    const color = getCapacityColor(residualCapacity, maxCapacity);
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
   * Creates the OpenLayers Map instance with base OSM layer and two vector layers.
   * Data updates are handled reactively via effects that respond to input signal changes.
   */
  ngOnInit() {
    this.map = new Map({
      target: 'map',
      view: this.view,
      layers: [this.osmLayer, this.parkingAreasLayer, this.parkingEventsLayer]
    });
  }

  /**
   * Component cleanup lifecycle hook.
   */
  ngOnDestroy(): void {
    // Effects are automatically cleaned up by Angular
  }
}
