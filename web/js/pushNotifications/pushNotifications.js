import showToast from '../components/toastMessage/toastMessage.js'
import {fetchWithAuth} from '../utils/fetchWithAuth.js'
import {timeout} from '../utils/utils.js'
import './pushNotifications.scss'

class PushNotifications {

  constructor() {
  }

  init() {
    const subscribeButton = document.getElementById('subscribeButton')
    subscribeButton.addEventListener('click', this.subscribeOrUnsubscribe.bind(this))

    subscribeButton.classList = 'navbar-button navbar-notificationsButton hidden'

    const setButtonEnabled = (button, enabled) => {
      button.classList.toggle('disabled', !enabled)
      button.disabled = !enabled
    }

    window.addEventListener('subscribed', async (event) => {
      subscribeButton.title = 'you are currently subscribed, you will receive notifications, unless you click on that button'
      subscribeButton.disabled = false
      subscribeButton.dataset.action = 'unsubscribe'
      subscribeButton.classList.toggle('navbar-subscribeNotificationsButton', false)
      subscribeButton.classList.toggle('navbar-unsubscribeNotificationsButton', true)
      subscribeButton.innerHTML = `
        <span class="material-symbols-outlined">
        notifications
        </span>
        <span data-translate="subscribed"></span>
      `
      window.dispatchEvent(new CustomEvent('loadComponentTranslations', {detail: {component: subscribeButton}}))
    })
    window.addEventListener('unsubscribed', async (event) => {
      subscribeButton.classList.toggle('hidden', false)
      subscribeButton.classList.toggle('disabled', false)
      subscribeButton.title = 'you will not receive notifications until you click on that button'
      subscribeButton.disabled = false
      subscribeButton.dataset.action = 'subscribe'
      subscribeButton.classList.toggle('navbar-subscribeNotificationsButton', true)
      subscribeButton.classList.toggle('navbar-unsubscribeNotificationsButton', false)
      subscribeButton.innerHTML = `
        <span class="material-symbols-outlined">
        notifications_off
        </span>
        <span data-translate="subscribe"></span>
      `
      window.dispatchEvent(new CustomEvent('loadComponentTranslations', {detail: {component: subscribeButton}}))
    })

    window.addEventListener('userLoggedIn', async (event) => {
      subscribeButton.classList.toggle('hidden', false)
      subscribeButton.classList.toggle('disabled', false)
      if (event.detail?.pushNotification?.enabled) {
        window.dispatchEvent(new CustomEvent('subscribed'))
      } else {
        window.dispatchEvent(new CustomEvent('unsubscribed'))
      }
    })

    window.addEventListener('userLoggedOut', async (event) => {
      subscribeButton.classList.toggle('hidden', true)
      subscribeButton.classList.toggle('disabled', true)
    })

    window.addEventListener('subscriptionInProgress', async (event) => {
      setButtonEnabled(subscribeButton, false)
    })

    window.addEventListener('subscriptionCompleted', async (event) => {
      setButtonEnabled(subscribeButton, true)
    })

  }

  async #isServiceWorkerAvailable() {
    if ('serviceWorker' in navigator) {
      console.log('Service Worker is supported by this browser')
    } else {
      console.error('Service Worker is not supported by this browser')
      return false
    }

    return true
  }

  async #isNotificationAvailable() {
    if ('Notification' in window) {
      console.log('Notification is supported by this browser')
    } else {
      console.error('Notification is not supported by this browser')
      return false
    }

    return true
  }

  async #requestNotificationPermission() {
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      console.log('Notification permission granted')
    } else {
      throw new Error('Permission not granted for Notification')
    }
  }

  async #requestServiceWorkerRegistration() {
    try {
      const registration = await navigator.serviceWorker.register(
        `/service-worker.js?webService=${window.webServiceUrl}`,
        {scope: '/'}
      )
      console.log('Service Worker registered with scope:', registration.scope)
      return registration
    } catch (error) {
      console.error('Service Worker registration failed:', error)
      throw error
    }
  }

  async #unsubscribe() {
    try {
      await fetchWithAuth(`${window.webServiceUrl}/subscription`, {
        method: 'DELETE',
      })
    } catch (error) {
      throw new Error('Error unsubscribing', error)
    }

    if (!this.#isNotificationAvailable() || !this.#isServiceWorkerAvailable()) {
      throw new Error('Service Worker and Notification are not supported')
    }

    console.log('Unsubscribing from push notifications')
    const registration = await navigator.serviceWorker.ready
    if (!registration) {
      throw new Error('Service Worker registration not found')
    }

    let subscription = null
    try {
      subscription = await registration.pushManager.getSubscription()
      if (!subscription) {
        console.error('No subscription found')
        throw new Error('No subscription found')
      }
    } catch (error) {
      throw new Error('Error getting subscription', error)
    }

    // wait a little bit to receive last notification message before unsubscribing
    await timeout(1000)
    try {
      await subscription.unsubscribe()
      console.log('Unsubscribed')
    } catch (error) {
      throw new Error('Error unsubscribing', error)
    }
  }

  #urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }

    return outputArray
  }

  async #getPublicVapidKey() {
    try {
      const keys = await fetchWithAuth(
        `${window.webServiceUrl}/publicVapidKey.json?${Date.now()}`,
      )
      return keys.publicVapidKey
    } catch (error) {
      console.error('Error getting public VAPID key:', error)
      throw error
    }
  }

  async #remoteSubscription(subscription) {
    try {
      const response = await fetchWithAuth(
        `${window.webServiceUrl}/subscription`,
        {
          method: 'POST',
          body: JSON.stringify({new: subscription}),
        },
        {
          decodeJsonResponse: false,
          throwErrorOnResponseKO: true
        }
      )
      if (response.ok) {
        console.log('Subscription sent')
      }
    } catch (error) {
      console.error('Error sending subscription:', error)
      throw error
    }
  }

  async #subscribeUser(registration, publicVapidKey) {
    try {
      const subscription = await registration.pushManager
        .subscribe({
          userVisibleOnly: true,
          // eslint-disable-next-line no-undef
          applicationServerKey: this.#urlBase64ToUint8Array(publicVapidKey),
        })
      return subscription
    } catch (error) {
      if (error.code === 20) {
        showToast('Google Services for push messaging disabled chec your privacy settings', false)
      }
      throw new Error('Error subscribing:', error)
    }
  }

  async #subscribe() {
    if (!this.#isNotificationAvailable() || !this.#isServiceWorkerAvailable()) {
      throw new Error('Service Worker and Notification are not supported')
    }
    console.log('Service Worker and Notification are supported')
    let publicVapidKey = null
    try {
      publicVapidKey = await this.#getPublicVapidKey()
    } catch (error) {
      console.error('Error getting public VAPID key:', error)
      throw new Error('Error getting public VAPID key', error)
    }
    try {
      const registration = await this.#requestServiceWorkerRegistration()
      await this.#requestNotificationPermission()
      const subscription = await this.#subscribeUser(registration, publicVapidKey)
      await this.#remoteSubscription(subscription)
    } catch (error) {
      throw new Error('Error subscribing', error)
    }
  }

  async unsubscribe() {
    window.dispatchEvent(new CustomEvent('subscriptionInProgress'))
    try {
      await this.#unsubscribe()
      showToast(`You have been unsubscribed from notifications successfully`, true)
      window.dispatchEvent(new CustomEvent('unsubscribed'))
    } catch (error) {
      console.error('Error unsubscribing:', error)
      showToast(`Error unsubscribing : ${error}`, false)
    } finally {
      window.dispatchEvent(new CustomEvent('subscriptionCompleted'))
    }
  }

  async subscribe() {
    window.dispatchEvent(new CustomEvent('subscriptionInProgress'))
    try {
      await this.#subscribe()
      showToast(`You have been subscribed to notifications successfully`, true)
      window.dispatchEvent(new CustomEvent('subscribed'))
    } catch (error) {
      showToast(`Error subscribing : ${error}`, false)
    } finally {
      window.dispatchEvent(new CustomEvent('subscriptionCompleted'))
    }
  }

  async subscribeOrUnsubscribe(event) {
    if (event.currentTarget.disabled) {
      return
    }
    if (event.currentTarget.dataset.action === 'unsubscribe') {
      await this.unsubscribe()
    } else {
      await this.subscribe()
    }
  }
}

export default PushNotifications
