import {
  differenceInHours,
  differenceInMinutes,
  format,
  addMinutes,
  addDays,
  startOfDay,
  endOfDay,
  setHours,
  setMinutes,
  isWithinInterval,
  parseISO
} from 'date-fns';
import { ParkingEvent } from '@core/types/parking-event';

/**
 * Represents the processed chart data ready for ECharts rendering.
 */
export interface ProcessedChartData {
  labels: string[];
  values: number[];
  areaName: string;
  chartType: 'step' | 'line' | 'bar';
  tooltipFormat: string;
}

/**
 * Represents a time point with its calculated occupancy.
 */
interface OccupancyPoint {
  timestamp: Date;
  label: string;
  occupancy: number;
}

/**
 * Configuration for different chart scenarios.
 */
export type ChartScenario = 'single-day' | 'multi-day';

/**
 * Utility class for transforming parking event data into ECharts-compatible format.
 *
 * This class handles two main scenarios:
 * - Single Day (High Resolution): 30-minute intervals with step chart
 * - Multi-Day (Aggregated): Daily data points with bar/line chart
 *
 * @example
 * ```typescript
 * const data = ParkingChartUtils.processEvents(events, startDate, endDate, 'Area 1');
 * ```
 */
export class ParkingChartUtils {
  /**
   * The threshold in hours to determine single-day vs multi-day scenario.
   * If the range is <= 24 hours, it's treated as single-day.
   */
  private static readonly SINGLE_DAY_THRESHOLD_HOURS = 24;

  /**
   * Interval in minutes for single-day high-resolution data.
   */
  private static readonly SINGLE_DAY_INTERVAL_MINUTES = 30;

  /**
   * Processes parking events and generates chart-ready data.
   *
   * @param events - Array of parking events to process
   * @param startDate - Start of the date range
   * @param endDate - End of the date range
   * @param areaName - Name of the parking area for chart title
   * @returns ProcessedChartData ready for ECharts rendering
   */
  static processEvents(
    events: ParkingEvent[],
    startDate: Date,
    endDate: Date,
    areaName: string
  ): ProcessedChartData {
    const scenario = this.determineScenario(startDate, endDate);

    if (scenario === 'single-day') {
      return this.processSingleDay(events, startDate, endDate, areaName);
    } else {
      return this.processMultiDay(events, startDate, endDate, areaName);
    }
  }

  /**
   * Determines the chart scenario based on the date range duration.
   *
   * @param startDate - Start of the date range
   * @param endDate - End of the date range
   * @returns The scenario type: 'single-day' or 'multi-day'
   */
  static determineScenario(startDate: Date, endDate: Date): ChartScenario {
    const hours = differenceInHours(endDate, startDate);
    return hours <= this.SINGLE_DAY_THRESHOLD_HOURS ? 'single-day' : 'multi-day';
  }

  /**
   * Processes events for a single-day view with high-resolution intervals.
   * Generates data points every 30 minutes using a step chart visualization.
   *
   * @param events - Array of parking events
   * @param startDate - Start of the date range
   * @param endDate - End of the date range
   * @param areaName - Name of the parking area
   * @returns ProcessedChartData configured for step chart
   */
  private static processSingleDay(
    events: ParkingEvent[],
    startDate: Date,
    endDate: Date,
    areaName: string
  ): ProcessedChartData {
    const points = this.generateSingleDayPoints(events, startDate, endDate);

    return {
      labels: points.map(p => p.label),
      values: points.map(p => p.occupancy),
      areaName,
      chartType: 'step',
      tooltipFormat: 'HH:mm'
    };
  }

  /**
   * Processes events for a multi-day view with daily aggregation.
   * Generates one data point per day showing occupancy at noon or max occupancy.
   *
   * @param events - Array of parking events
   * @param startDate - Start of the date range
   * @param endDate - End of the date range
   * @param areaName - Name of the parking area
   * @returns ProcessedChartData configured for bar/line chart
   */
  private static processMultiDay(
    events: ParkingEvent[],
    startDate: Date,
    endDate: Date,
    areaName: string
  ): ProcessedChartData {
    const points = this.generateDailyPoints(events, startDate, endDate);

    return {
      labels: points.map(p => p.label),
      values: points.map(p => p.occupancy),
      areaName,
      chartType: 'bar',
      tooltipFormat: 'dd/MM/yyyy'
    };
  }

  /**
   * Generates one-day occupancy points at 30-minute intervals.
   *
   * @param events - Array of parking events
   * @param startDate - Start of the date range
   * @param endDate - End of the date range
   * @returns Array of OccupancyPoint with 30-minute granularity
   */
  private static generateSingleDayPoints(
    events: ParkingEvent[],
    startDate: Date,
    endDate: Date
  ): OccupancyPoint[] {
    const points: OccupancyPoint[] = [];
    let currentTime = new Date(startDate);

    while (currentTime <= endDate) {
      const occupancy = this.calculateOccupancyAtTime(events, currentTime);

      points.push({
        timestamp: new Date(currentTime),
        label: format(currentTime, 'HH:mm'),
        occupancy
      });

      currentTime = addMinutes(currentTime, this.SINGLE_DAY_INTERVAL_MINUTES);
    }

    return points;
  }

  /**
   * Generates daily occupancy points.
   * Uses the maximum concurrent occupancy for each day.
   *
   * @param events - Array of parking events
   * @param startDate - Start of the date range
   * @param endDate - End of the date range
   * @returns Array of OccupancyPoint with daily granularity
   */
  private static generateDailyPoints(
    events: ParkingEvent[],
    startDate: Date,
    endDate: Date
  ): OccupancyPoint[] {
    const points: OccupancyPoint[] = [];
    let currentDay = startOfDay(startDate);
    const finalDay = endOfDay(endDate);

    while (currentDay <= finalDay) {
      const maxOccupancy = this.calculateMaxOccupancyForDay(events, currentDay);

      points.push({
        timestamp: new Date(currentDay),
        label: format(currentDay, 'dd/MM'),
        occupancy: maxOccupancy
      });

      currentDay = addDays(currentDay, 1);
    }

    return points;
  }

  /**
   * Calculates the number of active parking events at a specific point in time.
   *
   * An event is considered active at time T if:
   * - start_time <= T AND (end_time > T OR end_time is null)
   *
   * Events with null end_time are treated as currently active (ongoing sessions).
   *
   * @param events - Array of parking events
   * @param timestamp - The point in time to check
   * @returns Number of active parking events (occupancy count)
   */
  static calculateOccupancyAtTime(events: ParkingEvent[], timestamp: Date): number {

    return events.filter(event => {
      const startTime = parseISO(event.start_time);

      // If start_time is after the timestamp, the event hasn't started yet
      if (startTime > timestamp) {
        return false;
      }

      // If end_time is null or undefined, the event is active
      if (event.end_time === null || event.end_time === undefined) {
        return true;
      }

      const endTime = parseISO(event.end_time);

      // Event is active if it started before or at timestamp AND ended after timestamp
      return endTime > timestamp;
    }).length;
  }

  /**
   * Calculates the maximum concurrent occupancy for a specific day.
   *
   * This method samples the occupancy at multiple points (30 mins) throughout the day
   * and returns the maximum value found.
   *
   * @param events - Array of parking events
   * @param day - The day to analyze
   * @returns Maximum concurrent occupancy during the day
   */
  private static calculateMaxOccupancyForDay(events: ParkingEvent[], day: Date): number {
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);

    let maxOccupancy = 0;
    let sampleTime = new Date(dayStart);

    // Sample every 30 minutes throughout the day
    while (sampleTime <= dayEnd) {
      const occupancy = this.calculateOccupancyAtTime(events, sampleTime);
      maxOccupancy = Math.max(maxOccupancy, occupancy);
      sampleTime = addMinutes(sampleTime, 30);
    }

    return maxOccupancy;
  }

  /**
   * Filters events that are relevant to a specific parking area.
   *
   * @param events - Array of all parking events
   * @param areaId - The ID of the parking area to filter by
   * @returns Filtered array of events for the specified area
   */
  static filterEventsByArea(events: ParkingEvent[], areaId: number): ParkingEvent[] {
    return events.filter(event => event.parking_area_id === areaId);
  }

  /**
   * Filters events that overlap with a specific time range.
   *
   * An event overlaps with the range if:
   *  - It started before the range ends AND
   *  - It ended after the range starts OR is ongoing (end_time is null)
   *
   * @param events - Array of parking events
   * @param startDate - Start of the time range
   * @param endDate - End of the time range
   * @returns Filtered array of events that overlap with the time range
   */
  static filterEventsByTimeRange(
    events: ParkingEvent[],
    startDate: Date,
    endDate: Date
  ): ParkingEvent[] {
    return events.filter(event => {
      const eventStart = parseISO(event.start_time);

      // If event started after the range ends, it doesn't overlap
      if (eventStart > endDate) {
        return false;
      }

      // Handle null/undefined end_time (ongoing session)
      if (event.end_time === null || event.end_time === undefined) {
        // Ongoing event overlaps if the range starts before the event starts
        return true;
      }

      const eventEnd = parseISO(event.end_time);

      // Event overlaps if it ended after the range starts
      return eventEnd > startDate;
    });
  }
}
