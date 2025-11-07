import { Component } from '@angular/core';
import { NgbDatepicker, NgbDropdownModule } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-filtersbar',
  imports: [NgbDropdownModule],
  templateUrl: './filtersbar.html',
  styleUrl: './filtersbar.css',
})
export class Filtersbar {
  selectedZone = '';

  protected select(zone: string) {
    this.selectedZone = zone;
    console.log('Selected zone:', this.selectedZone);
  }
}
