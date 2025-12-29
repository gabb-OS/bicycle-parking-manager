import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { MapComponent } from '@components/map/map';
import { Filtersbar } from "@components/filtersbar/filtersbar";
import { LineChartComponent } from '@components/line-chart/line-chart';
import { ParkinAreasService } from '@core/services/parking-areas.service';
import { ParkingEventsService } from '@core/services/parking-events.service';
import { ParkingAreasGeoJSON } from '@core/types/parking-area';
import { ParkingEventsGeoJSON } from '@core/types/parking-event';
import { Subject, take, takeUntil } from 'rxjs';

@Component({
  selector: 'app-home',
  imports: [MapComponent, Filtersbar, LineChartComponent],
  templateUrl: './home.html',
  styleUrl: './home.css',
  standalone: true,
})
export class Home implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  constructor(private parkingAreasService: ParkinAreasService,
              private parkingEventsService: ParkingEventsService) {}

  // Signals to hold the GeoJSON data for parking areas and events
  // These signals are updated when new data is fetched from the services
  // and are passed down to the MapComponent as inputs
  parkingAreas = signal<ParkingAreasGeoJSON | null>(null);
  parkingEvents = signal<ParkingEventsGeoJSON | null>(null);

  ngOnInit(): void {
    // Subscribe to parking areas updates
    this.parkingAreasService.parkingAreasGeoJSON$
      .pipe(takeUntil(this.destroy$))
      .subscribe((areas) => this.parkingAreas.set(areas));

    // Subscribe to parking events updates
    this.parkingEventsService.parkingEvents$
      .pipe(takeUntil(this.destroy$))
      .subscribe((events) => this.parkingEvents.set(events));

    // Trigger initial data fetch
    this.parkingAreasService.getParkingAreasGEOJSON().pipe(take(1)).subscribe();
    this.parkingEventsService.getParkingEventsGEOJSON().pipe(take(1)).subscribe();
  }

  /**
   * Cleans up subscriptions on component destruction to prevent memory leaks.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
