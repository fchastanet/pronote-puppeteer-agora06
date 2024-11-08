const initHomeworkLoadPerWeekDayChart = (data) => {
  const homeworkLoadPerWeekDayChart = echarts.init(document.getElementById('homeworkLoadPerWeekDayChart'))
  const homeworkLoadPerWeekDayOption = {
    title: {
      text: 'Homework Load Per Week Day'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        animation: false,
        label: {
          backgroundColor: '#505765'
        }
      }
    },
    toolbox: defaultToolbox,
    xAxis: {
      type: 'category',
      data: data.homeworkLoadPerWeekDay.map(item => WEEK_DAY_LABELS[item.weekday]),
      axisPointer: {
        snap: true,
        label: {
          show: true,
          formatter: function (item) {
            return item.value
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
    yAxis: {
      type: 'value'
    },
    series: [{
      data: data.homeworkLoadPerWeekDay.map(item => ({
        value: item.count,
        weekday: WEEK_DAY_LABELS[item.weekday],
      })),
      type: 'line',
      color: '#2196f3',
      tooltip: {
        formatter: function (param) {
          return [
            '<b>Day:</b> ' + param.data.weekday + '<br>',
            '<b>Homework count:</b> ' + param.data.value + '<br>'
          ].join('')
        }
      }
    }]
  }
  homeworkLoadPerWeekDayChart.setOption(homeworkLoadPerWeekDayOption)
}