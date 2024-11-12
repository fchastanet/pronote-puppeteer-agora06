import './css/main.css'
import {initSubscription} from './js/pushNotifications/client'
import {initDayjs} from './js/utils/dayjs'
import initCompletionRateChart from './js/charts/completionRateChart'
import initOnTimeCompletionRateChart from './js/charts/onTimeCompletionRateChart'
import initHomeworkLoadChart from './js/charts/homeworkLoadChart'
import initHomeworkLoadPerWeekDayChart from './js/charts/homeworkLoadPerWeekDayChart'
import initSubjectMetricsChart from './js/charts/subjectMetricsChart'
import initHomeworksDurationChart from './js/charts/homeworksDurationChart'
import dayjs from 'dayjs'

window.webServiceUrl = ''
window.addEventListener('load', () => {
  const appDiv = document.getElementById('app')
  window.webServiceUrl = appDiv.getAttribute('data-web-service-url')
  initDayjs(dayjs)
  initSubscription()
  fetch(`${window.webServiceUrl}/metrics.json`)
    .then((response) => response.json())
    .then((data) => {
      initCompletionRateChart(data)
      initOnTimeCompletionRateChart(data)
      initHomeworkLoadChart(data)
      initHomeworkLoadPerWeekDayChart(data)
      initSubjectMetricsChart(data)
      initHomeworksDurationChart(data)
    })
})
