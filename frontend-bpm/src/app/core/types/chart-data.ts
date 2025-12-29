/**
 * Interface representing the data structure for the line chart.
 */
export interface ChartData {
  labels: string[];
  values: number[];
  areaName: string;
  chartType?: 'step' | 'line' | 'bar';
  tooltipFormat?: string;
}

/**
 * Interface representing a time interval with event count.
 */
export interface TimeInterval {
  start: Date;
  end: Date;
  label: string;
  count: number;
}

/**
 * Interface representing the date range for filtering.
 */
export interface DateRange {
  startDate: Date;
  endDate: Date;
}
