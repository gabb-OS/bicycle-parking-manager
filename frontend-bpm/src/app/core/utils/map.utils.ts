export class MapUtils {

  /**
   * The color used for highlighting selected parking areas.
   */
  static readonly SELECTED_AREA_COLOR = 'rgba(0, 120, 255, 0.8)';
  static readonly SELECTED_AREA_FILL_COLOR = 'rgba(0, 120, 255, 0.3)';

  /**
   * Calculates the color for a parking area based on its occupancy ratio.
   *
   * @param residualCapacity - Number of free parking spots remaining
   * @param maxCapacity - Total number of parking spots in the area
   * @returns RGBA color string representing the occupancy level
   *
   * @description
   * Color coding:
   * - Green (0, 255, 0): Area is mostly empty (high residual capacity)
   * - Yellow-Orange: Area is partially occupied
   * - Red (255, 0, 0): Area is nearly full (low residual capacity)
   * - Gray (128, 128, 128): Invalid capacity (maxCapacity is 0)
   *
   * The color is calculated using linear interpolation between green and red
   * based on the occupancy ratio: (maxCapacity - residualCapacity) / maxCapacity
   */
  static getCapacityColor(residualCapacity: number, maxCapacity: number): string {
    if (maxCapacity === 0) return 'rgba(128, 128, 128, 0.8)'; // Gray for invalid capacity

    const occupancyRatio = 1 - (residualCapacity / maxCapacity);
    const clampedRatio = Math.max(0, Math.min(1, occupancyRatio));

    // Interpolate from green (0, 255, 0) to red (255, 0, 0)
    const red = Math.round(255 * clampedRatio);
    const green = Math.round(150 * (1 - clampedRatio));

    return `rgba(${red}, ${green}, 0, 0.8)`;
  }

}
