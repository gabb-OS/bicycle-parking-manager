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
import { ParkinAreasService } from '../../core/services/parking-areas.service';
import { ParkingAreasGeoJSON } from '../../core/types/parking-area';
import { ParkingEventsService } from '../../core/services/parking-events.service';
import { ParkingEventsGeoJSON } from '../../core/types/parking-event';


/*TODO: on marker click, show popup OR open side window*/

@Component({
  selector: 'app-map',
  imports: [],
  templateUrl: './map.html',
  styleUrl: './map.css',
  standalone: true,
})
export class MapComponent implements OnInit, OnDestroy {
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

  private osmLayer = new TileLayer({
    source: new OSM({
    })
  });

  // Style for geometry: Point
  private pointStyle = new Style({
    image: new Icon({
      src: 'assets/mapIcons/pedal_bike.png',
      scale: 0.40,
    })
  });

  // Style for geometry: Polygon
  private polygonStyle = new Style({
    stroke: new Stroke({
      color: 'rgba(255, 0, 0, 0.8)',
      width: 2,
    }),
    fill: new Fill({
      color: 'rgba(78, 16, 16, 0.2)',
    }),
  });

  // Select style function
  private styleFunction = (feature: any) => {
    const geometryType = feature.getGeometry().getType();
    if (geometryType === 'Point') {
      return this.pointStyle;
    } else if (geometryType === 'Polygon') {
      return this.polygonStyle;
    }
    console.error('Unsupported geometry type:', geometryType);
    return undefined;
  };

  private parkingAreasLayer = new VectorLayer({
    source: new VectorSource(),
    style: this.styleFunction
  });

  private parkingEventsLayer = new VectorLayer({
    source: new VectorSource(),
    style: this.styleFunction
  });

  ngOnInit() {
    this.map = new Map({
      target: 'map',
      view: this.view,
      layers: [this.osmLayer, this.parkingAreasLayer, this.parkingEventsLayer]
    });

    // Subscribe to parking areas updates
    this.parkingAreasService.parkingAreas$
      .pipe(takeUntil(this.destroy$))
      .subscribe((parkingAreas: ParkingAreasGeoJSON | null) => {
        console.log('Received parking areas update:', parkingAreas);
        if (parkingAreas) {
          const features = new GeoJSON().readFeatures(parkingAreas, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857'
          });
          this.parkingAreasLayer.getSource()?.clear();
          this.parkingAreasLayer.getSource()?.addFeatures(features);
        }
      });

    // Subscribe to parking events updates
    this.parkingEventsService.parkingEvents$
      .pipe(takeUntil(this.destroy$))
      .subscribe((parkingEvents: ParkingEventsGeoJSON | null) => {
        console.log('Received parking events update:', parkingEvents);
        if (parkingEvents) {
          const features = new GeoJSON().readFeatures(parkingEvents, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857'
          });
          this.parkingEventsLayer.getSource()?.clear();
          this.parkingEventsLayer.getSource()?.addFeatures(features);
        }
      });

    // Trigger initial fetch
    this.parkingAreasService.getParkingAreasGEOJSON().pipe(take(1)).subscribe();
    this.parkingEventsService.getParkingEventsGEOJSON().pipe(take(1)).subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
