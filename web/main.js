import './css/main.css'
import {initDayjs} from './js/utils/dayjs'
import initCompletionRateChart from './js/charts/completionRateChart'
import initOnTimeCompletionRateChart from './js/charts/onTimeCompletionRateChart'
import initHomeworkLoadChart from './js/charts/homeworkLoadChart'
import initHomeworkLoadPerWeekDayChart from './js/charts/homeworkLoadPerWeekDayChart'
import initSubjectMetricsChart from './js/charts/subjectMetricsChart'
import initHomeworksDurationChart from './js/charts/homeworksDurationChart'
import dayjs from 'dayjs'
import showToast from './js/components/toastMessage/toastMessage'
import initLanguageSelector from './js/components/languageSelector/languageSelector'
import showStudentSelector from './js/components/studentSelector/studentSelector'
import PushNotifications from './js/pushNotifications/pushNotifications'

const showMetrics = () => {
  initDayjs(dayjs)
  fetch(`${window.webServiceUrl}/metrics.json`, {
    credentials: 'include', // important for sending cookies
    headers: {'Content-Type': 'application/json'}
  })
    .then((response) => response.json())
    .then((data) => {
      document.getElementById('dashboard').classList.toggle('hidden', false)
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
      credentials: 'include', // important for receiving cookies
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({login, password})
    })
    const result = await response.json()

    if (response.ok) {
      showToast('Login successful', true)
      const event = new CustomEvent('userLoggedIn', {detail: result})
      window.dispatchEvent(event)
    } else {
      showToast(result.message || 'Login failed', false)
    }
  } catch (error) {
    showToast('An error occurred', false)
  }
}

const logout = async () => {
  try {
    const response = await fetch(`${window.webServiceUrl}/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {'Content-Type': 'application/json'}
    })

    if (response.ok) {
      showToast('Logout successful', true)
      document.getElementById('loginForm').classList.toggle('hidden', false)
      document.getElementById('dashboard').classList.toggle('hidden', true)
      document.getElementById('logoutButton').classList.toggle('hidden', true)
      document.getElementById('studentSelector').classList.toggle('hidden', true)
      const event = new CustomEvent('userLoggedOut', {detail: response})
      window.dispatchEvent(event)
    } else {
      showToast('Logout failed', false)
    }
  } catch (error) {
    showToast('An error occurred during logout', false)
  }
}

const checkLoggedIn = async () => {
  try {
    const response = await fetch(
      `${window.webServiceUrl}/checkLoggedIn`,
      {
        method: 'GET',
        credentials: 'include', // important for sending cookies
        headers: {'Content-Type': 'application/json'},
      }
    )
    const result = await response.json()

    if (response.ok && result?.authenticated) {
      const event = new CustomEvent('userLoggedIn', {detail: result})
      window.dispatchEvent(event)
    }
  } catch (error) {
    console.error('Error checking login status:', error)
  }
}

window.addEventListener('userLoggedIn', (event) => {
  document.getElementById('loginForm').classList.toggle('hidden', true)
  document.getElementById('logoutButton').classList.toggle('hidden', false)
  const welcomeMessage = document.getElementById('welcomeMessage')
  welcomeMessage.classList.toggle('hidden', false)
  welcomeMessage.textContent = `Welcome, ${event.detail.welcomeMessage}`
  showStudentSelector()
  showMetrics()
})

window.webServiceUrl = ''
window.addEventListener('load', async () => {
  const appDiv = document.getElementById('app')
  window.webServiceUrl = appDiv.getAttribute('data-web-service-url')
  const pushNotifications = new PushNotifications()
  pushNotifications.setListeners()
  initLanguageSelector()
  document.getElementById('loginButton').addEventListener('click', login)
  document.getElementById('logoutButton').addEventListener('click', logout)
  await checkLoggedIn()
})

