import { Component } from '@angular/core';
import { MapComponent } from '../../components/map/map';
import { Filtersbar } from "../../components/filtersbar/filtersbar";
import { LineChartComponent } from '../../components/line-chart/line-chart';

@Component({
  selector: 'app-home',
  imports: [MapComponent, Filtersbar, LineChartComponent],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {

}
