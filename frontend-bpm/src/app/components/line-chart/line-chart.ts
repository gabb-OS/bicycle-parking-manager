import { Component } from '@angular/core';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';

//  Import the echarts core module, which provides the necessary interfaces for using echarts.
import * as echarts from 'echarts/core';
import { EChartsCoreOption } from 'echarts/core';
// Note that including the CanvasRenderer or SVGRenderer is a required step
import { CanvasRenderer } from 'echarts/renderers';

import { LineChart } from 'echarts/charts';
import { GridComponent, TitleComponent, TooltipComponent } from 'echarts/components';


echarts.use([LineChart, GridComponent, TitleComponent, TooltipComponent, CanvasRenderer]);

@Component({
  selector: 'app-line-chart',
  imports: [NgxEchartsDirective],
  templateUrl: './line-chart.html',
  styleUrl: './line-chart.css',
  providers: [provideEchartsCore({ echarts })],
})

export class LineChartComponent{

  area: string = 'BOLOTOWN';

  chartOption: EChartsCoreOption = {
    title: {
        show: true,
        text: `Andamento parcheggi per ${this.area} negli ultimi 12 mesi`,
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
    series: [
      {
        name: 'sales',
        data: [820, 932, 901, 934, 1290, 1330, 1320],
        type: 'line',
      },
    ],
    xAxis: { 
      type: 'category',
      data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      axisTick: {
        show: true,
        alignWithLabel: true,
        direction: 'reverse',
        length: 5,
      },
    },
    yAxis: {
      name: 'Eventi parking',
      nameLocation: 'middle',
      type: 'value',
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
  };
}