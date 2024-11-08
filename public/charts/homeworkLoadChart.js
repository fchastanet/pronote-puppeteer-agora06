const initHomeworkLoadChart = (data) => {
  const homeworkLoadChart = echarts.init(document.getElementById('homeworkLoadChart'))
  const homeworkLoadOption = {
    title: {
      text: 'Homework Load'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          show: true,
          formatter: function (params) {
            if (params.axisDimension === 'y') {
              return Math.round(params.value);
            }
            return xAxisFormatter[params.axisIndex](params.value);
          }
        },
      },
      position: function (point, params, dom, rect, size) {
        // fixed at top
        return [point[0] + 20, -50];
      }
    },
    toolbox: defaultToolbox,
    legend: {
      top: 0,
      left: 170,
      data: ['Per Week', 'Per Day']
    },
    xAxis: [
      {
        name: 'Week',
        type: 'category',
        data: data.homeworkLoadPerWeek.map(item => item.date),
        axisLabel: {
          formatter: (item) => convertDateToWeek(item),
        },
        axisPointer: {
          snap: true,
          label: {
            show: true,
            formatter: function (item) {
              return convertDateToWeekInterval(item.value)
            }
          },
          handle: {
            show: true
          }
        },
        splitLine: {
          show: false
        }
      },
      {
        name: 'Date',
        type: 'category',
        data: data.homeworkLoadPerWeek.map(item => item.date),
        axisLabel: {
          formatter: (item) => convertDateToDay(item),
        },
        axisPointer: {
          snap: true,
          label: {
            show: true,
            formatter: function (item) {
              return convertDateToDay(item.value)
            }
          },
          handle: {
            show: true
          }
        },
        splitLine: {
          show: false
        }
      },
    ],
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: 'Per Week',
        data: data.homeworkLoadPerWeek.map(item => ({
          value: item.count,
          date: item.date
        })),
        type: 'line',
        color: '#2196f3',
        xAxisIndex: 0,
        tooltip: {
          formatter: function (param) {
            const week = convertDateToWeekInterval(param.data.date)
            return [
              '<b>Week:</b> ' + week + '<br>',
              '<b>Homework count:</b> ' + param.data.value + '<br>'
            ].join('')
          }
        }
      },
      {
        name: 'Per Day',
        data: data.homeworkLoadPerDay.map(item => ({
          value: item.count,
          day: item.day,
        })),
        type: 'line',
        xAxisIndex: 1,
        color: '#4caf50',
        tooltip: {
          formatter: function (param) {
            return [
              '<b>Date:</b> ' + convertDateToDay(param.data.day) + '<br>',
              '<b>Homework count:</b> ' + param.data.value + '<br>'
            ].join('')
          }
        }
      }
    ]
  }
  homeworkLoadChart.setOption(homeworkLoadOption)

};