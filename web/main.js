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
import showToast from './js/components/toastMessage/toastMessage'

const showMetrics = () => {
  initDayjs(dayjs)
  fetch(`${window.webServiceUrl}/metrics.json`)
    .then((response) => response.json())
    .then((data) => {
      document.getElementById('dashboard').classList.remove('hidden')
      initCompletionRateChart(data)
      initOnTimeCompletionRateChart(data)
      initHomeworkLoadChart(data)
      initHomeworkLoadPerWeekDayChart(data)
      initSubjectMetricsChart(data)
      initHomeworksDurationChart(data)
    })
}

const login = async () => {
  const login = document.getElementById('login').value
  const password = document.getElementById('password').value

  try {
    const response = await fetch(`${window.webServiceUrl}/login`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({login, password})
    })
    const result = await response.json()

    if (response.ok) {
      showToast('Login successful', true)
      document.getElementById('loginForm').classList.add('hidden')
      showMetrics()
    } else {
      showToast(result.message || 'Login failed', false)
    }
  } catch (error) {
    showToast('An error occurred', false)
  }
}

window.webServiceUrl = ''
window.addEventListener('load', () => {
  const appDiv = document.getElementById('app')
  window.webServiceUrl = appDiv.getAttribute('data-web-service-url')
  initSubscription()
  document.getElementById('loginButton').addEventListener('click', login)
})
