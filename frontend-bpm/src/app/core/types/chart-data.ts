/**
 * Interface representing the data structure for the line chart.
 */
export interface ChartData {
  labels: string[];
  values: number[];
  areaName: string;
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
