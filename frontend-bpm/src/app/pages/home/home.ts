import { Component } from '@angular/core';
import { MapComponent } from '../../components/map/map';
import { Filtersbar } from "../../components/filtersbar/filtersbar";

@Component({
  selector: 'app-home',
  imports: [MapComponent, Filtersbar],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {

}
