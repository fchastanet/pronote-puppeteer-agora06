import * as echarts from 'echarts/core'

import {BarChart, CustomChart, PieChart, LineChart} from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  ToolboxComponent,
  LegendComponent,
  GridComponent,
  DatasetComponent,
  MarkAreaComponent,
} from 'echarts/components'
import {CanvasRenderer} from 'echarts/renderers'

echarts.use([
  BarChart,
  CustomChart,
  LineChart,
  PieChart,
  MarkAreaComponent,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  ToolboxComponent,
  LegendComponent,
  CanvasRenderer,
])

const defaultToolbox = {
  show: true,
  orient: 'horizontal',
  top: 'left',
  feature: {
    dataView: {show: true, readOnly: false},
    saveAsImage: {show: true},
  },
}
const init = echarts.init

export {
  defaultToolbox,
  init,
}
