import { Component, effect, input, OnDestroy, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import HeatmapLayer from 'ol/layer/Heatmap';
import Cluster from 'ol/source/Cluster';
import GeoJSON from 'ol/format/GeoJSON';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Overlay from 'ol/Overlay';
import { getCenter } from 'ol/extent';
import Style from 'ol/style/Style';
import Icon from 'ol/style/Icon';
import Stroke from 'ol/style/Stroke';
import Fill from 'ol/style/Fill';
import CircleStyle from 'ol/style/Circle';
import Text from 'ol/style/Text';
import { ParkingAreasGeoJSON } from '@core/types/parking-area';
import { ParkingEventsGeoJSON } from '@core/types/parking-event';
import { MapUtils } from '@core/utils/map.utils';

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

@Component({
  selector: 'app-map',
  imports: [],
  templateUrl: './map.html',
  styleUrl: './map.css',
  standalone: true,
})
export class MapComponent implements OnInit, AfterViewInit {
  /**
   * Reference to the tooltip element for hover information.
   */
  @ViewChild('tooltip') tooltipElement!: ElementRef<HTMLDivElement>;

  /**
   * OpenLayers Overlay for displaying tooltip on hover.
   */
  private tooltipOverlay!: Overlay;

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

  /**
   * Input signal for the currently selected parking area ID.
   * When set, the selected area will be highlighted in blue on the map.
   */
  selectedAreaId = input<number | null>(null);

  /**
   * Input signal for heatmap visualization toggle.
   * When true, the map should display a heatmap visualization.
   */
  isHeatmapEnabled = input<boolean>(false);

  /**
   * Input signal for clustering visualization toggle.
   * When true, the map should display parking areas with clustering.
   */
  isClusteringEnabled = input<boolean>(false);

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

    // Effect to update parking events layer and heatmap layer when input changes
    effect(() => {
      const events = this.parkingEvents();
      const isHeatmapEnabled = this.isHeatmapEnabled();
      const isClusteringEnabled = this.isClusteringEnabled();

      if (events) {
        const features = new GeoJSON().readFeatures(events, {
          dataProjection: 'EPSG:4326',
          featureProjection: 'EPSG:3857'
        });

        // Update regular events layer
        // Hide events layer when either heatmap or clustering is active
        if (this.parkingEventsLayer) {
          this.parkingEventsLayer.getSource()?.clear();
          this.parkingEventsLayer.getSource()?.addFeatures(features);
          this.parkingEventsLayer.setVisible(!isHeatmapEnabled && !isClusteringEnabled);
        }

        // Update heatmap layer with the same features
        if (this.heatmapLayer) {
          const heatmapFeatures = new GeoJSON().readFeatures(events, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857'
          });
          this.heatmapLayer.getSource()?.clear();
          this.heatmapLayer.getSource()?.addFeatures(heatmapFeatures);
          this.heatmapLayer.setVisible(isHeatmapEnabled);
        }
      }
    });

    // Effect to refresh parking areas layer styling when selected area changes
    effect(() => {
      const selectedId = this.selectedAreaId();
      // Trigger a style refresh by updating the layer
      if (this.parkingAreasLayer) {
        this.parkingAreasLayer.changed();
      }
    });

    // Effect to handle clustering of parking areas
    effect(() => {
      const areas = this.parkingAreas();
      const isClusteringEnabled = this.isClusteringEnabled();

      if (areas) {
        // Transform Parking Area Polygons to Points (Centroids) with capacity data
        // to be used for clustering
        const pointFeatures = new GeoJSON().readFeatures(areas, {
          dataProjection: 'EPSG:4326',
          featureProjection: 'EPSG:3857'
        }).map((polygonFeature: any) => {
          // Get the geometry (Polygon) and calculate centroid
          const geometry = polygonFeature.getGeometry();
          const extent = geometry.getExtent();
          const center = getCenter(extent);

          // Get capacity data from properties
          const props = polygonFeature.getProperties();
          const residualCapacity = props.residual_capacity || 0;
          const maxCapacity = props.max_capacity || 0;

          // Create a new Point feature at the centroid
          const pointFeature = new Feature(new Point(center));

          // Store capacity data for cluster aggregation
          pointFeature.setProperties({
            residualCapacity: residualCapacity,
            maxCapacity: maxCapacity,
            areaId: props.id,
            name: props.name
          });

          return pointFeature;
        });

        // Update the Cluster Source
        this.clusterSource.getSource()?.clear();
        this.clusterSource.getSource()?.addFeatures(pointFeatures);
      }

      // Toggle visibility based on clustering state
      this.clusterLayer.setVisible(isClusteringEnabled);

      // Hide the original polygon layer when clustering is active
      if (this.parkingAreasLayer) {
        this.parkingAreasLayer.setVisible(!isClusteringEnabled);
      }

      // Hide events layer when either clustering or heatmap is active
      if (this.parkingEventsLayer) {
        const isHeatmapEnabled = this.isHeatmapEnabled();
        this.parkingEventsLayer.setVisible(!isClusteringEnabled && !isHeatmapEnabled);
      }
    });
  }

  private map: Map | undefined;

  private view = new View({
    center: fromLonLat([11.355432, 44.498089]),
    zoom: 17.5
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
   * @param isSelected - Whether the area is currently selected
   * @returns OpenLayers Style object for rendering the polygon
   *
   * @description
   * Generates a Style with both stroke and fill, where:
   * - If selected: Blue color for stroke (80% opacity) and fill (30% opacity)
   * - If not selected: Uses the capacity color at 80% opacity for stroke, 20% for fill
   */
  private createPolygonStyle(residualCapacity: number, maxCapacity: number, isSelected: boolean): Style {
    if (isSelected) {
      return new Style({
        stroke: new Stroke({
          color: MapUtils.SELECTED_AREA_COLOR,
          width: 3,
        }),
        fill: new Fill({
          color: MapUtils.SELECTED_AREA_FILL_COLOR,
        }),
      });
    }

    const color = MapUtils.getCapacityColor(residualCapacity, maxCapacity);
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
   * - Polygon: Uses capacity-based color style (for parking areas), or blue if selected
   *
   * For polygons, extracts residual_capacity and max_capacity properties
   * to determine the appropriate color coding. If the area ID matches
   * the selectedAreaId, it will be highlighted in blue.
   */
  private styleFunction = (feature: any) => {
    const geometryType = feature.getGeometry().getType();
    if (geometryType === 'Point') {
      return this.pointStyle;
    } else if (geometryType === 'Polygon') {
      const properties = feature.getProperties();
      const areaId = properties.id;
      const residualCapacity = properties.residual_capacity ?? 0;
      const maxCapacity = properties.max_capacity ?? 1;
      const isSelected = areaId === this.selectedAreaId();
      return this.createPolygonStyle(residualCapacity, maxCapacity, isSelected);
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
   * Heatmap layer for displaying parking event density.
   * Shows crowded areas based on parking event concentration.
   * Hidden by default, toggled via isHeatmapEnabled input.
   */
  private heatmapLayer = new HeatmapLayer({
    source: new VectorSource(),
    blur: 15,
    radius: 10,
    weight: () => 1,
    visible: false
  });

  /**
   * Cluster source for grouping nearby parking area centroids.
   * Groups features within 40 pixels of each other.
   */
  private clusterSource = new Cluster({
    distance: 40,
    minDistance: 20,
    source: new VectorSource()
  });

  /**
   * Style function for cluster features.
   * Displays the total number of parked bicycles in the cluster.
   *
   * @param feature - The cluster feature containing grouped point features
   * @returns Style object for rendering the cluster
   */
  private clusterStyleFunction = (feature: any): Style => {
    const features = feature.get('features');

    // Sum up the capacities from all areas in this cluster
    let totalResidualCapacity = 0;
    let totalMaxCapacity = 0;
    features.forEach((f: any) => {
      totalResidualCapacity += f.get('residualCapacity') || 0;
      totalMaxCapacity += f.get('maxCapacity') || 0;
    });

    // Calculate total parked bikes for display
    const totalBikes = totalMaxCapacity - totalResidualCapacity;

    // Dynamic radius based on the number of bikes
    const radius = Math.min(15 + Math.sqrt(totalBikes) * 2, 40);

    // Color based on aggregated capacity using the same logic as areas
    const color = MapUtils.getCapacityColor(totalResidualCapacity, totalMaxCapacity, 0.9);

    return new Style({
      image: new CircleStyle({
        radius: radius,
        stroke: new Stroke({
          color: '#fff',
          width: 2
        }),
        fill: new Fill({
          color: color
        })
      }),
      text: new Text({
        text: totalBikes.toString(),
        fill: new Fill({
          color: '#fff'
        }),
        font: 'bold 12px sans-serif'
      })
    });
  };

  /**
   * Vector layer for displaying clustered parking area centroids.
   * Shows the absolute number of parked bicycles per cluster.
   * Hidden by default, toggled via isClusteringEnabled input.
   */
  private clusterLayer = new VectorLayer({
    source: this.clusterSource,
    style: this.clusterStyleFunction,
    visible: false,
    zIndex: 10
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
      layers: [this.osmLayer, this.parkingAreasLayer, this.parkingEventsLayer, this.heatmapLayer, this.clusterLayer]
    });
  }

  /**
   * After view initialization - set up the tooltip overlay and pointer events.
   */
  ngAfterViewInit() {
    // Create the overlay for the tooltip
    this.tooltipOverlay = new Overlay({
      element: this.tooltipElement.nativeElement,
      positioning: 'bottom-center',
      offset: [0, -10],
      stopEvent: false
    });
    this.map?.addOverlay(this.tooltipOverlay);

    // Add pointer move event listener for hover detection
    this.map?.on('pointermove', (event) => {
      const pixel = event.pixel;
      const feature = this.map?.forEachFeatureAtPixel(pixel, (feat, layer) => {
        // Only return features from the parking areas layer
        if (layer === this.parkingAreasLayer) {
          return feat;
        }
        return undefined;
      });

      if (feature) {
        const properties = feature.getProperties();
        const geometryType = feature.getGeometry()?.getType();

        // Only show tooltip for polygon features (parking areas)
        if (geometryType === 'Polygon') {
          const name = properties['name'] || 'Area senza nome';
          const residualCapacity = properties['residual_capacity'] ?? 0;
          const maxCapacity = properties['max_capacity'] ?? 0;
          const occupancy = maxCapacity > 0
            ? Math.round(((maxCapacity - residualCapacity) / maxCapacity) * 100)
            : 0;

          // Update tooltip content
          this.tooltipElement.nativeElement.innerHTML = `
            <strong>${name}</strong><br>
            <span class="tooltip-label">Occupazione:</span> ${occupancy}%<br>
            <span class="tooltip-label">Posti liberi:</span> ${residualCapacity}/${maxCapacity}
          `;

          // Position and show the tooltip
          this.tooltipOverlay.setPosition(event.coordinate);
          this.tooltipElement.nativeElement.style.display = 'block';

          // Change cursor to pointer
          if (this.map) {
            this.map.getTargetElement().style.cursor = 'pointer';
          }
        }
      } else {
        // Hide tooltip when not over a feature
        this.tooltipElement.nativeElement.style.display = 'none';
        if (this.map) {
          this.map.getTargetElement().style.cursor = '';
        }
      }
    });
  }
}
