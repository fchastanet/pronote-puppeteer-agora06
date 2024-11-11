import {defaultToolbox} from './_charts'
import * as echarts from 'echarts'

const initCompletionRateChart = (data) => {
  const completionRateChart = echarts.init(document.getElementById('completionRateChart'))
  const completionRateOption = {
    title: {
      text: 'Homework Completion Rate',
    },
    tooltip: {},
    toolbox: defaultToolbox,
    series: [
      {
        type: 'pie',
        data: [
          {value: data.completionRate, name: 'Completed'},
          {value: 100 - data.completionRate, name: 'Not Completed'},
        ],
      },
    ],
  }
  completionRateChart.setOption(completionRateOption)
}

export default initCompletionRateChart
