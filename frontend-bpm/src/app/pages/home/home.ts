import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { MapComponent } from '@components/map/map';
import { Filtersbar } from "@components/filtersbar/filtersbar";
import { LineChartComponent } from '@components/line-chart/line-chart';
import { ParkinAreasService } from '@core/services/parking-areas.service';
import { ParkingEventsService } from '@core/services/parking-events.service';
import { ParkingArea, ParkingAreasGeoJSON } from '@core/types/parking-area';
import { ParkingEvent, ParkingEventsGeoJSON } from '@core/types/parking-event';
import { FiltersValue } from '@core/types/filters';
import { ChartData } from '@core/types/chart-data';
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

  // Signal to hold the list of all parking events (non-GeoJSON)
  parkingEventsList = signal<ParkingEvent[] | null>(null);

  // Signal to hold the current applied filters
  appliedFilters = signal<FiltersValue | null>(null);

  // Signal to hold the chart data for the line chart
  chartData = signal<ChartData | null>(null);

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

    // Subscribe to parking events list updates
    this.parkingEventsService.parkingEvents$
      .pipe(takeUntil(this.destroy$))
      .subscribe((events) => this.parkingEventsList.set(events));

    // Trigger initial data fetch
    this.parkingAreasService.getParkingAreasGEOJSON().pipe(take(1)).subscribe();
    this.parkingAreasService.getParkingAreas().pipe(take(1)).subscribe();
    this.parkingEventsService.getParkingEventsGEOJSON().pipe(take(1)).subscribe();
    this.parkingEventsService.getParkingEvents().pipe(take(1)).subscribe();
  }

  /**
   * Handles the filters applied event from the filtersbar component.
   * Updates the appliedFilters signal and computes chart data.
   *
   * @param filters - The filter values emitted by the filtersbar
   */
  onFiltersApplied(filters: FiltersValue): void {
    this.appliedFilters.set(filters);
    this.computeChartData(filters);
    console.log('Filters applied:', filters);
  }

  /**
   * Handles the filters reset event from the filtersbar component.
   * Clears the appliedFilters signal and chart data.
   */
  onFiltersReset(): void {
    this.appliedFilters.set(null);
    this.chartData.set(null);
    console.log('Filters reset');
  }

  /**
   * Computes the chart data based on the applied filters.
   * Filters parking events by area and time range, then aggregates by time intervals.
   *
   * @param filters - The filter values to apply
   */
  private computeChartData(filters: FiltersValue): void {
    const events = this.parkingEventsList();
    const areas = this.parkingAreasList();

    if (!events || !areas || !filters.zone || !filters.startDate || !filters.endDate) {
      this.chartData.set(null);
      return;
    }

    const selectedArea = areas.find(area => area.id === filters.zone);
    const areaName = selectedArea?.name ?? 'Area sconosciuta';

    // Parse date range
    const startDate = new Date(filters.startDate);
    const endDate = new Date(filters.endDate);
    // Set end date to end of day
    endDate.setHours(23, 59, 59, 999);

    // Filter events by parking area and time range
    const filteredEvents = events.filter(event => {
      const eventStart = new Date(event.start_time);
      const eventEnd = new Date(event.end_time);
      return event.parking_area_id === filters.zone &&
             eventStart >= startDate &&
             eventEnd <= endDate;
    });

    // Generate time intervals (evenly split the time range)
    const intervals = this.generateTimeIntervals(startDate, endDate);

    // Count events per interval
    const values = intervals.map(interval => {
      return filteredEvents.filter(event => {
        const eventStart = new Date(event.start_time);
        return eventStart >= interval.start && eventStart < interval.end;
      }).length;
    });

    const labels = intervals.map(interval => interval.label);

    this.chartData.set({
      labels,
      values,
      areaName
    });

    console.log('Chart data computed:', this.chartData());
  }

  /**
   * Generates evenly distributed time intervals for the chart.
   * Automatically determines the best interval size based on the date range.
   *
   * @param startDate - Start of the time range
   * @param endDate - End of the time range
   * @returns Array of time intervals with labels
   */
  private generateTimeIntervals(startDate: Date, endDate: Date): { start: Date; end: Date; label: string }[] {
    const intervals: { start: Date; end: Date; label: string }[] = [];
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    let intervalMs: number;
    let formatLabel: (date: Date) => string;

    if (diffDays <= 1) {
      // Less than 1 day: hourly intervals
      intervalMs = 1000 * 60 * 60; // 1 hour
      formatLabel = (date: Date) => date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays <= 7) {
      // 1-7 days: 6-hour intervals
      intervalMs = 1000 * 60 * 60 * 6; // 6 hours
      formatLabel = (date: Date) => date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }) + ' ' +
                                     date.toLocaleTimeString('it-IT', { hour: '2-digit' });
    } else if (diffDays <= 31) {
      // 1 week to 1 month: daily intervals
      intervalMs = 1000 * 60 * 60 * 24; // 1 day
      formatLabel = (date: Date) => date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
    } else {
      // More than 1 month: weekly intervals
      intervalMs = 1000 * 60 * 60 * 24 * 7; // 1 week
      formatLabel = (date: Date) => date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
    }

    let current = new Date(startDate);
    while (current < endDate) {
      const intervalEnd = new Date(Math.min(current.getTime() + intervalMs, endDate.getTime()));
      intervals.push({
        start: new Date(current),
        end: intervalEnd,
        label: formatLabel(current)
      });
      current = intervalEnd;
    }

    return intervals;
  }

  /**
   * Cleans up subscriptions on component destruction to prevent memory leaks.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
