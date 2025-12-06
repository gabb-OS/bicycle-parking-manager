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
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "id": 1001,
        "name": "Filippo Re - Dip. Fisiologia",
        "maxCapacity": 50,
        "residualCapacity": 50
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              11.355749,
              44.499046
            ],
            [
              11.355684,
              44.498491
            ],
            [
              11.355781,
              44.498503
            ],
            [
              11.355749,
              44.499046
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": 1002,
        "name": "Irnerio - Dip. Farmacia",
        "maxCapacity": 40,
        "residualCapacity": 40
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              11.354767,
              44.499027
            ],
            [
              11.354703,
              44.498874
            ],
            [
              11.355067,
              44.498767
            ],
            [
              11.355148,
              44.498939
            ],
            [
              11.354767,
              44.499027
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": 1003,
        "name": "Filippo Re - Dip. Farmacia",
        "maxCapacity": 10,
        "residualCapacity": 10
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              11.355025,
              44.49936
            ],
            [
              11.354982,
              44.499276
            ],
            [
              11.355169,
              44.49923
            ],
            [
              11.355218,
              44.499321
            ],
            [
              11.355025,
              44.49936
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": 1004,
        "name": "Irnerio - Dip. Fisica",
        "maxCapacity": 20,
        "residualCapacity": 20
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              11.353539,
              44.499329
            ],
            [
              11.353485,
              44.499237
            ],
            [
              11.353791,
              44.499161
            ],
            [
              11.353844,
              44.499253
            ],
            [
              11.353539,
              44.499329
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": 1005,
        "name": "Puntoni",
        "maxCapacity": 10,
        "residualCapacity": 10
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              11.353233,
              44.497603
            ],
            [
              11.353201,
              44.497519
            ],
            [
              11.353335,
              44.497389
            ],
            [
              11.353469,
              44.497473
            ],
            [
              11.353372,
              44.497523
            ],
            [
              11.353421,
              44.497588
            ],
            [
              11.353233,
              44.497603
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": 1006,
        "name": "Scaravilli - Dip. Economia",
        "maxCapacity": 20,
        "residualCapacity": 20
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              11.351999,
              44.497072
            ],
            [
              11.35209,
              44.496938
            ],
            [
              11.352471,
              44.497068
            ],
            [
              11.351999,
              44.497072
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": 1007,
        "name": "Berti Pichat",
        "maxCapacity": 60,
        "residualCapacity": 60
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              11.357251,
              44.501108
            ],
            [
              11.356773,
              44.500871
            ],
            [
              11.356768,
              44.500779
            ],
            [
              11.357208,
              44.50076
            ],
            [
              11.357251,
              44.501108
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": 1008,
        "name": "Mura Anteo Zamboni - Dip. Informatica",
        "maxCapacity": 20,
        "residualCapacity": 20
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              11.356264,
              44.497366
            ],
            [
              11.356285,
              44.497091
            ],
            [
              11.356393,
              44.497098
            ],
            [
              11.356376,
              44.49737
            ],
            [
              11.356264,
              44.497366
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": 1009,
        "name": "San Giacomo",
        "maxCapacity": 5,
        "residualCapacity": 5
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              11.356307,
              44.496371
            ],
            [
              11.35614,
              44.496291
            ],
            [
              11.356258,
              44.496257
            ],
            [
              11.356328,
              44.496287
            ],
            [
              11.356307,
              44.496371
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": 1010,
        "name": "Mura Anteo Zamboni - Dip. Biochimica",
        "maxCapacity": 20,
        "residualCapacity": 20
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              11.355996,
              44.496861
            ],
            [
              11.35628,
              44.496773
            ],
            [
              11.356269,
              44.496869
            ],
            [
              11.355996,
              44.496861
            ]
          ]
        ]
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
