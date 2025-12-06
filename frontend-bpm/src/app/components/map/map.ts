import { Component, OnInit } from '@angular/core';
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


/*TODO: on marker click, show popup OR open side window*/

@Component({
  selector: 'app-map',
  imports: [],
  templateUrl: './map.html',
  styleUrl: './map.css',
})
export class MapComponent implements OnInit {
private bicycleParkingData = {
    'type': 'FeatureCollection',
    'features': [
      {
        'type': 'Feature',
        'properties': {
          'name': 'Piazza Maggiore Bike Park',
          'capacity': 50,
          'type': 'covered'
        },
        'geometry': {
          'type': 'Polygon',
          'coordinates': [
            [[11.342977, 44.494139], [11.341211, 44.497685], [11.340154, 44.494021]]
          ]
        }
      },
      {
        'type': 'Feature',
        'properties': {
          'name': 'Stazione Centrale Bike Park',
          'capacity': 100,
          'type': 'covered'
        },
        'geometry': {
          'type': 'Point',
          'coordinates': [11.341970, 44.506673]
        }
      }
    ]
  };

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
      src: 'assets/mapIcons/museum_icon.png',
      scale: 0.05
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

  private testGeoJSONLayer = new VectorLayer({
    source: new VectorSource({
      features: new GeoJSON().readFeatures(this.bicycleParkingData, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857'
      })
    }),
    style: this.styleFunction
  });

  ngOnInit() {
    this.map = new Map({
      target: 'map',
      view: this.view,
      layers: [this.osmLayer, this.testGeoJSONLayer]
    });
  }
}
