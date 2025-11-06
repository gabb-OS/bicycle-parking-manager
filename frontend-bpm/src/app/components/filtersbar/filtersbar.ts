import { Component } from '@angular/core';
import { NgbDatepicker, NgbDropdownModule } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-filtersbar',
  imports: [NgbDropdownModule],
  templateUrl: './filtersbar.html',
  styleUrl: './filtersbar.css',
})
export class Filtersbar {
  // label shown on the dropdown button
  selectedZone = 'Area di Parcheggio';

  // called when a dropdown item is selected
  protected select(zone: string) {
    this.selectedZone = zone;
  }
}
