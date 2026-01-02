import { Component, effect, input } from '@angular/core';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';

import * as echarts from 'echarts/core';
import { EChartsCoreOption } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart, BarChart } from 'echarts/charts';
import { GridComponent, TitleComponent, TooltipComponent } from 'echarts/components';
import { CommonModule } from '@angular/common';
import { ChartData } from '@core/types/chart-data';


echarts.use([LineChart, BarChart, GridComponent, TitleComponent, TooltipComponent, CanvasRenderer]);

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
   * Dynamically switches between step, line, and bar charts based on chartType.
   *
   * @param data - The chart data containing labels, values, area name, and chart type
   * @returns EChartsCoreOption configured for the data
   */
  private buildChartOption(data: ChartData): EChartsCoreOption {
    const chartType = data.chartType ?? 'line';

    return {
      title: {
        show: true,
        text: `Occupazione parcheggio: ${data.areaName}`,
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      series: [this.buildSeriesConfig(data, chartType)],
      xAxis: this.buildXAxisConfig(data, chartType),
      yAxis: {
        name: 'Biciclette parcheggiate',
        nameLocation: 'middle',
        nameGap: 40,
        type: 'value',
        minInterval: 1,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: chartType === 'bar' ? 'shadow' : 'line',
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

  /**
   * Builds the series configuration based on chart type.
   *
   * @param data - The chart data
   * @param chartType - The type of chart to render
   * @returns Series configuration object
   */
  private buildSeriesConfig(data: ChartData, chartType: 'step' | 'line' | 'bar'): object {
    const baseConfig = {
      name: 'Biciclette parcheggiate',
      data: data.values,
    };

    switch (chartType) {
      case 'step':
        return {
          ...baseConfig,
          type: 'line',
          step: 'end',
          areaStyle: {
            opacity: 0.3
          },
          lineStyle: {
            width: 2
          },
          itemStyle: {
            color: '#5470c6'
          }
        };

      case 'bar':
        return {
          ...baseConfig,
          type: 'bar',
          barWidth: '60%',
          itemStyle: {
            color: '#91cc75',
            borderRadius: [4, 4, 0, 0]
          }
        };

      case 'line':
      default:
        return {
          ...baseConfig,
          type: 'line',
          smooth: true,
          areaStyle: {
            opacity: 0.3
          },
          lineStyle: {
            width: 2
          }
        };
    }
  }

  /**
   * Builds the X-axis configuration based on chart type.
   *
   * @param data - The chart data
   * @param chartType - The type of chart to render
   * @returns X-axis configuration object
   */
  private buildXAxisConfig(data: ChartData, chartType: 'step' | 'line' | 'bar'): object {
    const baseConfig = {
      type: 'category',
      data: data.labels,
    };

    if (chartType === 'step') {
      // For step charts (single-day view), show more labels for time granularity
      return {
        ...baseConfig,
        axisTick: {
          show: true,
          alignWithLabel: true,
        },
        axisLabel: {
          rotate: 45,
          fontSize: 10,
          interval: Math.floor(data.labels.length / 12), // Show ~12 labels
        },
        boundaryGap: false, // Step line starts from axis
      };
    } else if (chartType === 'bar') {
      // For bar charts (multi-day view), center labels under bars
      return {
        ...baseConfig,
        axisTick: {
          show: true,
          alignWithLabel: true,
        },
        axisLabel: {
          rotate: 45,
          fontSize: 10,
          autoSkip: true,         // to improve readability, selects only some labels to show
          autoSkipPadding: 25,    // minimum padding between labels
          hideOverlap: true,      // forces first and last label
        },
        boundaryGap: true, // Required for bar charts
      };
    } else {
      // Default line chart config
      return {
        ...baseConfig,
        axisTick: {
          show: true,
          alignWithLabel: true,
          interval: 0,
        },
        axisLabel: {
          rotate: 45,
          fontSize: 10,
        }
      };
    }
  }
}
