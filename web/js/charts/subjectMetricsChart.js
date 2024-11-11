import * as echarts from 'echarts'
import dayjs from 'dayjs'
import {countFormatter, durationFormatter, rateFormatter} from '../utils/dayjs'
import {defaultToolbox} from './_charts'

const initSubjectMetricsChart = (data) => {
  const xAxisFormatter = [durationFormatter, countFormatter, rateFormatter]
  const subjectMetricsChart = echarts.init(document.getElementById('subjectMetricsChart'))
  const subjectMetricsOption = {
    title: {
      text: 'Subject Metrics',
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          show: true,
          formatter: function (params) {
            if (params.axisDimension === 'y') {
              return params.value
            }
            return xAxisFormatter[params.axisIndex](params.value)
          },
        },
      },
      formatter: function (params) {
        if (params.length !== 4) {
          return 'N/A'
        }
        const subject = params[0].axisValueLabel
        const homeworkLoad = countFormatter(params[0].data)
        const completionRate = rateFormatter(params[1].data)
        const avgDurationGivenToExpected = durationFormatter(params[2].data)
        const avgDurationGivenToDone = durationFormatter(params[3].data)
        return [
          `<b>Subject:</b> ${subject}<br>`,
          `<span class="bullet" style="background-color:${params[0].color}"></span><b>Homework load:</b> ${homeworkLoad}<br>`,
          `<span class="bullet" style="background-color:${params[1].color}"></span><b>Completion Rate:</b> ${completionRate}%<br>`,
          `<span class="bullet" style="background-color:${params[2].color}"></span><b>Avg Duration Given to Expected:</b> ${avgDurationGivenToExpected}<br>`,
          `<span class="bullet" style="background-color:${params[3].color}"></span><b>Avg Duration Given to Done:</b> ${avgDurationGivenToDone}<br>`,
        ].join('')
      },
      position: function (point) {
        // fixed at top
        return [point[0] + 20, -50]
      },
    },
    grid: {
      top: 130,
      left: 150,
      right: 70,
      bottom: 30,
    },
    toolbox: defaultToolbox,
    legend: {
      top: 30,
      data: ['Homework Load', 'Completion Rate', 'Avg Duration Given to Expected', 'Avg Duration Given to Done'],
    },
    xAxis: [
      {
        name: 'Duration',
        type: 'value',
        axisLabel: {
          formatter: durationFormatter,
        },
      },
      {
        name: 'Count',
        type: 'value',
        axisLine: {
          show: true,
        },
        axisLabel: {
          formatter: countFormatter,
        },
      },
      {
        name: 'Rate',
        type: 'value',
        min: 0,
        max: 100,
        axisLine: {
          show: true,
        },
        offset: 25,
        axisLabel: {
          formatter: rateFormatter,
        },
      },
    ],
    yAxis: {
      type: 'category',
      data: data.homeworkLoadPerSubject.map((item) => item.subject.capitalize()),
      axisLabel: {
        fontSize: 12,
      },
    },
    series: [
      {
        name: 'Homework Load',
        data: data.homeworkLoadPerSubject.map((item) => item.count),
        type: 'line',
        stack: 'Total',
        xAxisIndex: 1,
        areaStyle: {},
        emphasis: {
          focus: 'series',
        },
        color: '#9c27b0',
      },
      {
        name: 'Completion Rate',
        data: data.completionPerSubject.map((item) => item.completionRate),
        type: 'line',
        xAxisIndex: 2,
        stack: 'Total',
        areaStyle: {},
        emphasis: {
          focus: 'series',
        },
        color: '#4caf50',
      },
      {
        name: 'Avg Duration Given to Expected',
        data: data.averageDurationPerSubjectGivenToExpected.map((item) => item.averageDuration / 1000),
        type: 'line',
        stack: 'Total',
        areaStyle: {},
        emphasis: {
          focus: 'series',
        },
        color: '#ff5722',
        tooltip: {
          formatter: function (param) {
            const duration =
              param.data <= 0 || param.data == null ? 'N/A' : dayjs.duration(param.data, 'seconds').humanize()
            return ['<b>Average Duration:</b> ' + duration + '<br>'].join('')
          },
        },
      },
      {
        name: 'Avg Duration Given to Done',
        data: data.averageDurationPerSubjectGivenToDone.map((item) => item.averageDuration / 1000),
        type: 'line',
        stack: 'Total',
        areaStyle: {},
        emphasis: {
          focus: 'series',
        },
        color: '#3f51b5',
        tooltip: {
          formatter: function (param) {
            const duration =
              param.data <= 0 || param.data == null ? 'N/A' : dayjs.duration(param.data, 'seconds').humanize()
            return ['<b>Average Duration:</b> ' + duration + '<br>'].join('')
          },
        },
      },
    ],
  }
  subjectMetricsChart.setOption(subjectMetricsOption)
}

export default initSubjectMetricsChart
