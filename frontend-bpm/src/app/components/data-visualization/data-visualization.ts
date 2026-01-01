import { Component, output } from '@angular/core';

@Component({
  selector: 'app-data-visualization',
  imports: [],
  templateUrl: './data-visualization.html',
  styleUrl: './data-visualization.css',
})
export class DataVisualization {
  /**
   * Output event emitter to notify parent component when heatmap toggle changes.
   */
  heatmapToggled = output<boolean>();

  /**
   * Current state of the heatmap toggle.
   */
  isHeatmapEnabled = false;

  /**
   * Handles the heatmap toggle switch change event.
   * @param event - The change event from the checkbox input
   */
  onHeatmapToggle(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    this.isHeatmapEnabled = checkbox.checked;
    this.heatmapToggled.emit(this.isHeatmapEnabled);
  }
}
