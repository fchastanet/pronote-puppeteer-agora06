import './css/main.scss'
import './css/dashboard-filters.scss'
import './css/dashboard.scss'
import './css/navbar.scss'

import showToast from './js/components/toastMessage/toastMessage'
import initLanguageSelector from './js/components/languageSelector/languageSelector'
import PushNotifications from './js/pushNotifications/pushNotifications'
import Dashboard from './js/dashboard/dashboard'
import {fetchWithAuth} from './js/utils/fetchWithAuth'

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
    const response = await fetchWithAuth(
      `${window.webServiceUrl}/checkLoggedIn`,
      {method: 'GET'}
    )

    if (response?.authenticated) {
      const event = new CustomEvent('userLoggedIn', {detail: response})
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
  welcomeMessage.textContent = `Welcome, ${event.detail.welcomeMessage}`
  const dashboard = new Dashboard()
  dashboard.init()
})

window.addEventListener('userLoggedOut', () => {
  const welcomeMessage = document.getElementById('welcomeMessage')
  welcomeMessage.textContent = ''
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

