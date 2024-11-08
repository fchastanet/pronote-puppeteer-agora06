const initHomeworksDurationChart = (data) => {
  const homeworksDurationChart = echarts.init(document.getElementById('homeworksDurationChart'))
  const renderItem = (params, api) => {
    const categoryIndex = api.value(0)
    const date1 = api.value(1)
    const date2 = api.value(2)
    const start = api.coord([date1, categoryIndex])
    const end = api.coord([date2, categoryIndex])
    const height = api.size([0, 1])[1] * 0.6
    const bg = api.value(4)

    return {
      type: 'rect',
      shape: {
        x: start[0],
        y: start[1] + height,
        width: end[0] - start[0],
        height: height
      },
      style: api.style()
    }
  }

  const homeworksDurationOption = {
    title: {
      text: 'Homework Duration Gantt Chart'
    },
    grid: {
      left: 30,
      right: 50,
    },
    toolbox: defaultToolbox,
    tooltip: {
      trigger: 'item',
      formatter: param => [
        '<b>Completion:</b> ' + COMPLETION_STATE_LABELS[param.data[4]] + '<br>',
        '<b>Assignment Date:</b> ' + dayjs(param.data[1]).format('YYYY-MM-DD') + '<br>',
        '<b>Completion Date:</b> ' + dayjs(param.data[2]).format('YYYY-MM-DD') + '<br>',
        '<b>Duration to Complete:</b> ' + dayjs.duration(param.data[2] - param.data[1], 'seconds').humanize() + '<br>',
        '<b>Homework:</b> <span class="tooltip homeworkDescription">' + stripTags(param.data[3]) + '</span><br>',
      ].join('')
    },
    legend: {
      top: 30,
      data: [
        {
          name: COMPLETION_STATE_LABELS[0],
          icon: 'circle',
          textStyle: {
            color: COMPLETION_STATE_COLORS[0]
          }
        },
        {
          name: COMPLETION_STATE_LABELS[1],
          icon: 'circle',
          textStyle: {
            color: COMPLETION_STATE_COLORS[1]
          }
        },
        {
          name: COMPLETION_STATE_LABELS[2],
          icon: 'circle',
          textStyle: {
            color: COMPLETION_STATE_COLORS[2]
          }
        }
      ]
    },
    xAxis: {
      type: 'time',
      name: 'Date',
      splitLine: {show: true},
    },
    yAxis: {},
    dataset: {
      source: [
        [COMPLETION_STATE_LABELS[0], ...data.homeworksDuration.filter(item => item.completionState === 0)],
        [COMPLETION_STATE_LABELS[1], ...data.homeworksDuration.filter(item => item.completionState === 1)],
        [COMPLETION_STATE_LABELS[2], ...data.homeworksDuration.filter(item => item.completionState === 2)],
      ]
    },
    series: [
      {
        type: 'custom',
        name: COMPLETION_STATE_LABELS[0],
        renderItem,
        encode: {
          x: [1, 2],
          y: 0
        },
        data: data.homeworksDuration.filter(item => item.completionState === 0).map(item => [
          item.id, item.assignedDate, item.completionDate, item.description, item.completionState
        ]),
        color: COMPLETION_STATE_COLORS[0]
      },
      {
        type: 'custom',
        name: COMPLETION_STATE_LABELS[1],
        renderItem,
        encode: {
          x: [1, 2],
          y: 0
        },
        data: data.homeworksDuration.filter(item => item.completionState === 1).map(item => [
          item.id, item.assignedDate, item.completionDate, item.description, item.completionState
        ]),
        color: COMPLETION_STATE_COLORS[1]
      },
      {
        type: 'custom',
        name: COMPLETION_STATE_LABELS[2],
        renderItem,
        encode: {
          x: [1, 2],
          y: 0
        },
        data: data.homeworksDuration.filter(item => item.completionState === 2).map(item => [
          item.id, item.assignedDate, item.completionDate, item.description, item.completionState
        ]),
        color: COMPLETION_STATE_COLORS[2]
      },
    ]
  }
  homeworksDurationChart.setOption(homeworksDurationOption)
}
