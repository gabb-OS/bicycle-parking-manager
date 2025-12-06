import { Component } from '@angular/core';

@Component({
  selector: 'app-filtersbar',
  imports: [],
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
