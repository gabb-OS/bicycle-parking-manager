import { Component, OnInit } from '@angular/core';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';

@Component({
  selector: 'app-map',
  imports: [],
  templateUrl: './map.html',
  styleUrl: './map.css',
})
export class MapComponent implements OnInit {
  private map: Map | undefined;

  private view = new View({
    center: fromLonLat([11.3387500, 44.4938100]),
    zoom: 14
  });

  private osmLayer = new TileLayer({
    source: new OSM({
    })
});

  ngOnInit() {
    this.map = new Map({
      target: 'map',
      view: this.view,
      layers: [this.osmLayer]
    });
  }
}
