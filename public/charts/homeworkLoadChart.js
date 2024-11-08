const initHomeworkLoadChart = (data) => {
  const homeworkLoadChart = echarts.init(document.getElementById('homeworkLoadChart'))
  const homeworkLoadOption = {
    title: {
      text: 'Homework Load'
    },
    tooltip: {},
    toolbox: defaultToolbox,
    legend: {
      top: 30,
      data: ['Per Week', 'Per Day']
    },
    xAxis: [
      {
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