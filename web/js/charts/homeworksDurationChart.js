import dayjs from 'dayjs'
import {COMPLETION_STATE_COLORS, COMPLETION_STATE_LABELS} from '../utils/dayjs'
import {stripTags} from '../utils/utils'
import {init, defaultToolbox} from './_charts'

const initHomeworksDurationChart = (data) => {
  const homeworksDurationChart = init(document.getElementById('homeworksDurationChart'))
  const renderItem = (params, api) => {
    const categoryIndex = api.value(0)
    const assignmentDate = dayjs(api.value(1)).format('YYYY-MM-DD')
    const completionState = api.value(4)
    const completionDate = dayjs(api.value(2) === null ? api.value(1) : api.value(2)).format('YYYY-MM-DD')
    const dueDate = dayjs(api.value(5)).format('YYYY-MM-DD')
    const assignmentDateCoord = api.coord([assignmentDate, categoryIndex])
    const completionDateCoord = api.coord([completionDate, categoryIndex])
    const dueDateCoord = api.coord([dueDate, categoryIndex])
    const height = api.size([0, 1])[1] * 0.6
    const completionRect = {
      type: 'rect',
      transition: ['shape'],
      shape: {
        x: assignmentDateCoord[0],
        y: assignmentDateCoord[1] + height,
        width: completionDateCoord[0] - assignmentDateCoord[0],
        height: height,
      },
      style: api.style({fill: COMPLETION_STATE_COLORS[completionState]}),
    }
    const dueRect = {
      type: 'rect',
      transition: ['shape'],
      shape: {
        x: assignmentDateCoord[0],
        y: assignmentDateCoord[1] + height,
        width: dueDateCoord[0] - assignmentDateCoord[0],
        height: height,
      },
      style: api.style(),
    }
    const children = [dueRect, completionRect]

    return {
      type: 'group',
      children,
    }
  }

  const maxDueDate = data.homeworksDuration.reduce((max, item) => {
    if (item.dueDate === null) {
      return max
    }
    const dueDate = dayjs(item.dueDate)
    return dueDate.diff(max) > 0 ? dueDate : max
  }, dayjs())

  const todayArea = {
    silent: true,
    itemStyle: {
      opacity: 0.3,
    },
    data: [
      [
        {
          xAxis: dayjs().startOf('day').toISOString(),
        },
        {
          xAxis: dayjs().endOf('day').toISOString(),
        },
      ],
    ],
  }

  const homeworksDurationOption = {
    title: {
      text: 'Homework Duration Gantt Chart',
    },
    grid: {
      left: 30,
      right: 50,
    },
    toolbox: {
      defaultToolbox,
      ...{
        feature: {
          dataZoom: {
            yAxisIndex: 'none',
          },
          restore: {},
        },
      },
    },
    tooltip: {
      trigger: 'item',
      formatter: (param) => {
        const assignedDate = dayjs(param.data[1])
        const completionDate = param.data[2] === null ? null : dayjs(param.data[2])
        const dueDate = dayjs(param.data[5])
        const text = [
          '<b>Completion:</b> ' + COMPLETION_STATE_LABELS[param.data[4]] + '<br>',
          '<b>Assignment Date:</b> ' + assignedDate.format('YYYY-MM-DD') + '<br>',
          '<b>Due Date:</b> ' + dueDate.format('YYYY-MM-DD') + '<br>',
        ]
        if (completionDate === null) {
          const leftTime = dayjs.duration(dayjs().diff(dueDate)).humanize()
          text.push(`<b>Duration to Complete:</b> ${leftTime}<br>`)
        } else {
          const takenTime = dayjs.duration(completionDate.diff(assignedDate)).humanize()
          const lateTime = dayjs.duration(completionDate.diff(dueDate)).humanize()
          text.push(
            `<b>Completion Date:</b> ${completionDate.format('YYYY-MM-DD')} (Taken ${takenTime} Late ${lateTime})<br>`
          )
        }
        text.push(
          '<b>Homework:</b> <span class="tooltip homeworkDescription">' + stripTags(param.data[3]) + '</span><br>'
        )
        return text.join('')
      },
    },
    legend: {
      top: 30,
      data: [
        {
          name: COMPLETION_STATE_LABELS[0],
          icon: 'circle',
          textStyle: {
            color: COMPLETION_STATE_COLORS[0],
          },
        },
        {
          name: COMPLETION_STATE_LABELS[1],
          icon: 'circle',
          textStyle: {
            color: COMPLETION_STATE_COLORS[1],
          },
        },
        {
          name: COMPLETION_STATE_LABELS[2],
          icon: 'circle',
          textStyle: {
            color: COMPLETION_STATE_COLORS[2],
          },
        },
      ],
    },
    xAxis: {
      type: 'time',
      name: 'Date',
      splitLine: {show: true},
      max: maxDueDate.toISOString(),
    },
    yAxis: {},
    dataset: {
      source: [
        [COMPLETION_STATE_LABELS[0], ...data.homeworksDuration.filter((item) => item.completionState === 0)],
        [COMPLETION_STATE_LABELS[1], ...data.homeworksDuration.filter((item) => item.completionState === 1)],
        [COMPLETION_STATE_LABELS[2], ...data.homeworksDuration.filter((item) => item.completionState === 2)],
      ],
    },
    series: [
      {
        type: 'custom',
        name: COMPLETION_STATE_LABELS[0],
        renderItem,
        encode: {
          x: [1, 2],
          y: 0,
        },
        data: data.homeworksDuration
          .filter((item) => item.completionState === 0)
          .map((item) => [
            item.id,
            item.assignedDate,
            item.completionDate,
            item.description,
            item.completionState,
            item.dueDate,
          ]),
        color: COMPLETION_STATE_COLORS[0],
        markArea: todayArea,
      },
      {
        type: 'custom',
        name: COMPLETION_STATE_LABELS[1],
        renderItem,
        encode: {
          x: [1, 2],
          y: 0,
        },
        data: data.homeworksDuration
          .filter((item) => item.completionState === 1)
          .map((item) => [
            item.id,
            item.assignedDate,
            item.completionDate,
            item.description,
            item.completionState,
            item.dueDate,
          ]),
        color: COMPLETION_STATE_COLORS[1],
        markArea: todayArea,
      },
      {
        type: 'custom',
        name: COMPLETION_STATE_LABELS[2],
        renderItem,
        encode: {
          x: [1, 2],
          y: 0,
        },
        data: data.homeworksDuration
          .filter((item) => item.completionState === 2)
          .map((item) => [
            item.id,
            item.assignedDate,
            item.completionDate,
            item.description,
            item.completionState,
            item.dueDate,
          ]),
        color: COMPLETION_STATE_COLORS[2],
        markArea: todayArea,
      },
    ],
  }
  homeworksDurationChart.setOption(homeworksDurationOption)
}

export default initHomeworksDurationChart
