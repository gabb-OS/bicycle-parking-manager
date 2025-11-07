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
          'type': 'Point',
          'coordinates': [11.342977, 44.494139]
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
    center: fromLonLat([11.3387500, 44.4938100]),
    zoom: 14
  });

  private osmLayer = new TileLayer({
    source: new OSM({
    })
  });

  private testGeoJSONLayer = new VectorLayer({
    source: new VectorSource({
      features: new GeoJSON().readFeatures(this.bicycleParkingData, {
        featureProjection: 'EPSG:3857'
      })
    }),
    style: new Style({
      image: new Icon({
        src: 'assets/mapIcons/museum_icon.png',
        scale: 0.05
      })
    })
  });

  ngOnInit() {
    this.map = new Map({
      target: 'map',
      view: this.view,
      layers: [this.osmLayer, this.testGeoJSONLayer]
    });
  }
}
