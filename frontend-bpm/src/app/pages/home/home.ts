import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { MapComponent } from '@components/map/map';
import { Filtersbar } from "@components/filtersbar/filtersbar";
import { LineChartComponent } from '@components/line-chart/line-chart';
import { ParkinAreasService } from '@core/services/parking-areas.service';
import { ParkingEventsService } from '@core/services/parking-events.service';
import { ParkingArea, ParkingAreasGeoJSON } from '@core/types/parking-area';
import { ParkingEventsGeoJSON } from '@core/types/parking-event';
import { FiltersValue } from '@core/types/filters';
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

  // Signal to hold the list of parking areas for the filtersbar dropdown
  parkingAreasList = signal<ParkingArea[] | null>(null);

  // Signal to hold the current applied filters
  appliedFilters = signal<FiltersValue | null>(null);

  ngOnInit(): void {
    // Subscribe to parking areas updates
    this.parkingAreasService.parkingAreasGeoJSON$
      .pipe(takeUntil(this.destroy$))
      .subscribe((areas) => this.parkingAreas.set(areas));

    // Subscribe to parking areas list updates for the filtersbar
    this.parkingAreasService.parkingAreas$
      .pipe(takeUntil(this.destroy$))
      .subscribe((areas) => this.parkingAreasList.set(areas));

    // Subscribe to parking events updates
    this.parkingEventsService.parkingEventsGeoJSON$
      .pipe(takeUntil(this.destroy$))
      .subscribe((events) => this.parkingEvents.set(events));

    // Trigger initial data fetch
    this.parkingAreasService.getParkingAreasGEOJSON().pipe(take(1)).subscribe();
    this.parkingAreasService.getParkingAreas().pipe(take(1)).subscribe();
    this.parkingEventsService.getParkingEventsGEOJSON().pipe(take(1)).subscribe();
  }

  /**
   * Handles the filters applied event from the filtersbar component.
   * Updates the appliedFilters signal with the new filter values.
   *
   * @param filters - The filter values emitted by the filtersbar
   */
  onFiltersApplied(filters: FiltersValue): void {
    this.appliedFilters.set(filters);
    console.log('Filters applied:', filters);
  }

  /**
   * Handles the filters reset event from the filtersbar component.
   * Clears the appliedFilters signal.
   */
  onFiltersReset(): void {
    this.appliedFilters.set(null);
    console.log('Filters reset');
  }

  /**
   * Cleans up subscriptions on component destruction to prevent memory leaks.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
