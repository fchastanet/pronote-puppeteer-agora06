import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import duration from 'dayjs/plugin/duration'

const WEEK_DAY_LABELS = {
  0: 'Monday',
  1: 'Tuesday',
  2: 'Wednesday',
  3: 'Thursday',
  4: 'Friday',
  5: 'Saturday',
  6: 'Sunday',
}
const COMPLETION_STATE_LABELS = {
  0: 'In Progress',
  1: 'Completed',
  2: 'Over Due',
  3: 'Unknown',
}
const COMPLETION_STATE_COLORS = {
  0: '#87CEEB', // Light Blue
  1: '#4caf50',
  2: '#ff5722',
  3: '#9e9e9e',
}

const COMPLETION_STATE_IN_PROGRESS = 0
const COMPLETION_STATE_COMPLETED = 1
const COMPLETION_STATE_OVER_DUE = 2
const COMPLETION_STATE_UNKNOWN = 3

const initDayjs = (dayjs) => {
  dayjs.extend(duration)
  dayjs.extend(relativeTime)
}

String.prototype.capitalize =
  String.prototype.capitalize ||
  function () {
    return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase()
  }

const convertDateToWeek = (date) => dayjs(date).startOf('week').format('MMM-DD')
const convertDateToDay = (date) => dayjs(date).format('MMM-DD')
const convertDateToWeekInterval = (date) => {
  date = dayjs(date)
  const startDate = date.startOf('week').format('MMM-DD')
  const endDate = date.endOf('week').format('MMM-DD')
  return `${startDate} - ${endDate}`
}

const durationFormatter = (value) => {
  if (value <= 0 || value == null) {
    return 'N/A'
  }
  return dayjs.duration(value, 'seconds').humanize()
}
const rateFormatter = (value) => {
  return `${Math.round(value)}%`
}
const countFormatter = (value) => {
  return Math.round(value)
}

export {
  WEEK_DAY_LABELS,
  COMPLETION_STATE_LABELS,
  COMPLETION_STATE_COLORS,
  COMPLETION_STATE_IN_PROGRESS,
  COMPLETION_STATE_COMPLETED,
  COMPLETION_STATE_OVER_DUE,
  COMPLETION_STATE_UNKNOWN,
  initDayjs,
  convertDateToWeek,
  convertDateToDay,
  convertDateToWeekInterval,
  durationFormatter,
  rateFormatter,
  countFormatter,
}
