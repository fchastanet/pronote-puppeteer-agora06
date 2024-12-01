import {fetchWithAuth} from '../utils/fetchWithAuth.js'
import {timeout} from '../utils/utils.js'

class PushNotifications {

  constructor() {
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
      const registration = await navigator.serviceWorker
        .register(`/service-worker.js?webService=${window.webServiceUrl}`, {
          scope: '/',
        })
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

  #setButtonEnabled(button, enabled) {
    button.classList.toggle('disabled', !enabled)
    button.disabled = !enabled
  }

  #setButtonVisible(button, visible) {
    button.classList.toggle('hidden', !visible)
  }

  #setSubscribeButtonState(state) {
    const subscribeButton = document.getElementById('subscribeButton')
    const unsubscribeButton = document.getElementById('unsubscribeButton')
    if (state === PushNotifications.NOTIFICATION_STATE_IN_PROGRESS) {
      this.#setButtonEnabled(subscribeButton, false)
      this.#setButtonEnabled(unsubscribeButton, false)
      return
    }
    if (state === PushNotifications.NOTIFICATION_STATE_NOT_LOGGED) {
      this.#setButtonVisible(subscribeButton, false)
      this.#setButtonVisible(unsubscribeButton, false)
      this.#setButtonEnabled(unsubscribeButton, false)
      return
    }
    this.#setButtonEnabled(subscribeButton, true)
    this.#setButtonEnabled(unsubscribeButton, true)
    this.#setButtonVisible(subscribeButton, state !== PushNotifications.NOTIFICATION_STATE_ACTIVATED)
    this.#setButtonVisible(unsubscribeButton, state === PushNotifications.NOTIFICATION_STATE_ACTIVATED)
  }


  async unsubscribe() {
    this.#setSubscribeButtonState(PushNotifications.NOTIFICATION_STATE_IN_PROGRESS)
    try {
      await this.#unsubscribe()
      console.log('Unsubscribed')
    } catch (error) {
      this.#setSubscribeButtonState(PushNotifications.NOTIFICATION_STATE_ACTIVATED)
    } finally {
      this.#setSubscribeButtonState(PushNotifications.NOTIFICATION_STATE_DEACTIVATED)
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

  async subscribe() {
    this.#setSubscribeButtonState(PushNotifications.NOTIFICATION_STATE_IN_PROGRESS)
    try {
      await this.#subscribe()
      console.log('Subscribed')
    } catch (error) {
      this.#setSubscribeButtonState(PushNotifications.NOTIFICATION_STATE_DEACTIVATED)
    } finally {
      this.#setSubscribeButtonState(PushNotifications.NOTIFICATION_STATE_ACTIVATED)
    }
  }


  async setListeners() {
    const subscribeButton = document.getElementById('subscribeButton')
    const unsubscribeButton = document.getElementById('unsubscribeButton')
    this.#setSubscribeButtonState(PushNotifications.NOTIFICATION_STATE_IN_PROGRESS)
    window.addEventListener('userLoggedIn', (event) => {
      console.log('User logged in:', event.detail)
      this.#setSubscribeButtonState(
        event.detail?.pushNotification?.enabled ?
          PushNotifications.NOTIFICATION_STATE_ACTIVATED :
          PushNotifications.NOTIFICATION_STATE_DEACTIVATED
      )
    })
    window.addEventListener('userLoggedOut', () => {
      this.#setSubscribeButtonState(PushNotifications.NOTIFICATION_STATE_NOT_LOGGED)
    })
    subscribeButton.addEventListener('click', this.subscribe.bind(this))
    unsubscribeButton.addEventListener('click', this.unsubscribe.bind(this))
  }
}

PushNotifications.NOTIFICATION_STATE_IN_PROGRESS = 'in-progress'
PushNotifications.NOTIFICATION_STATE_ACTIVATED = 'activated'
PushNotifications.NOTIFICATION_STATE_DEACTIVATED = 'deactivated'
PushNotifications.NOTIFICATION_STATE_NOT_LOGGED = 'notLogged'


export default PushNotifications
