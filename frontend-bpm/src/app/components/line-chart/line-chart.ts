import { Component, effect, input } from '@angular/core';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';

import * as echarts from 'echarts/core';
import { EChartsCoreOption } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart } from 'echarts/charts';
import { GridComponent, TitleComponent, TooltipComponent } from 'echarts/components';
import { CommonModule } from '@angular/common';
import { ChartData } from '@core/types/chart-data';


echarts.use([LineChart, GridComponent, TitleComponent, TooltipComponent, CanvasRenderer]);

@Component({
  selector: 'app-line-chart',
  imports: [CommonModule, NgxEchartsDirective],
  templateUrl: './line-chart.html',
  styleUrl: './line-chart.css',
  providers: [provideEchartsCore({ echarts })],
})

export class LineChartComponent {
  /**
   * Input signal for chart data from parent component.
   */
  chartData = input<ChartData | null>(null);

  /**
   * Chart options that will be updated when chartData changes.
   */
  chartOption: EChartsCoreOption = this.getDefaultChartOption();

  constructor() {
    // Effect to update chart when chartData input changes
    effect(() => {
      const data = this.chartData();
      if (data) {
        this.chartOption = this.buildChartOption(data);
      } else {
        this.chartOption = this.getDefaultChartOption();
      }
    });
  }

  /**
   * Returns the default chart option when no data is available.
   */
  private getDefaultChartOption(): EChartsCoreOption {
    return {
      title: {
        show: true,
        text: 'Seleziona un\'area e un intervallo di date per visualizzare i dati',
        left: 'center',
        top: 'middle',
        textStyle: {
          fontSize: 14,
          fontWeight: 'normal',
          color: '#999'
        }
      },
      xAxis: {
        type: 'category',
        data: [],
      },
      yAxis: {
        type: 'value',
      },
      series: [],
    };
  }

  /**
   * Builds the chart option based on the provided chart data.
   *
   * @param data - The chart data containing labels, values, and area name
   * @returns EChartsCoreOption configured for the data
   */
  private buildChartOption(data: ChartData): EChartsCoreOption {
    return {
      title: {
        show: true,
        text: `Andamento parcheggi per ${data.areaName}`,
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      series: [
        {
          name: 'Eventi parcheggio',
          data: data.values,
          type: 'line',
          smooth: true,
          areaStyle: {
            opacity: 0.3
          },
          lineStyle: {
            width: 2
          }
        },
      ],
      xAxis: {
        type: 'category',
        data: data.labels,
        axisTick: {
          show: true,
          alignWithLabel: true,
          interval: 0,
        },
        axisLabel: {
          rotate: 45,
          fontSize: 10,
        }
      },
      yAxis: {
        name: 'Eventi parcheggio',
        nameLocation: 'middle',
        nameGap: 40,
        type: 'value',
        minInterval: 1,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'line',
          lineStyle: {
            type: 'dashed',
            width: 2,
          }
        }
      },
      emphasis: {
        itemStyle: {
          color: '#FF7300',
          borderWidth: 8,
          borderColor: 'rgba(255, 34, 0, 0.4)'
        },
      },
      grid: {
        left: '10%',
        right: '5%',
        bottom: '20%',
      }
    };
  }
}
