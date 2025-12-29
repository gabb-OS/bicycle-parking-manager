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
import { ParkingChartUtils } from '@core/utils/parking-chart.utils';
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

  // Signal to hold the currently selected parking area ID for map highlighting
  selectedAreaId = signal<number | null>(null);

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
   * Updates the appliedFilters signal, selected area, and computes chart data.
   *
   * @param filters - The filter values emitted by the filtersbar
   */
  onFiltersApplied(filters: FiltersValue): void {
    this.appliedFilters.set(filters);
    this.selectedAreaId.set(filters.zone);
    this.computeChartData(filters);
  }

  /**
   * Handles the filters reset event from the filtersbar component.
   * Clears the appliedFilters signal, selected area, and chart data.
   */
  onFiltersReset(): void {
    this.appliedFilters.set(null);
    this.selectedAreaId.set(null);
    this.chartData.set(null);
  }

  /**
   * Computes the chart data based on the applied filters.
   * Uses ParkingChartUtils to transform events into chart-ready data.
   * Automatically selects appropriate chart type based on date range:
   * - Single day (≤24 hours): Step chart with 30-minute intervals
   * - Multi-day (>24 hours): Bar chart with daily aggregation
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

    const startDate = new Date(filters.startDate);
    const endDate = new Date(filters.endDate);
    // Set end date to end of day
    endDate.setHours(23, 59, 59, 999);

    const areaEvents = ParkingChartUtils.filterEventsByArea(events, filters.zone);

    const filteredEvents = ParkingChartUtils.filterEventsByTimeRange(areaEvents, startDate, endDate);

    const processedData = ParkingChartUtils.processEvents(
      filteredEvents,
      startDate,
      endDate,
      areaName
    );

    this.chartData.set({
      labels: processedData.labels,
      values: processedData.values,
      areaName: processedData.areaName,
      chartType: processedData.chartType,
      tooltipFormat: processedData.tooltipFormat
    });

  }

  /**
   * Cleans up subscriptions on component destruction to prevent memory leaks.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
