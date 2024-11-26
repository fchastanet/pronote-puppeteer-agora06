let webServiceUrl = null

self.addEventListener('install', function () {
  console.log('Service worker installed', location)
  webServiceUrl = new URL(location).searchParams.get('webService')
  console.log('webServiceUrl', webServiceUrl)
})

self.addEventListener('push', (event) => {
  try {
    const data = event.data.json()
    self.registration
      .showNotification(data.title, {
        body: data.body,
      })
      .catch((error) => {
        console.error('Error showing notification:', error)
      })
  } catch (error) {
    console.error('Error handling push event:', error)
  }
})

self.addEventListener(
  'pushsubscriptionchange',
  (event) => {
    const conv = (val) => self.btoa(String.fromCharCode.apply(null, new Uint8Array(val)))
    const getPayload = (subscription) => ({
      endpoint: subscription.endpoint,
      keys: {
        auth: conv(subscription.getKey('auth')),
        p256dh: conv(subscription.getKey('p256dh')),
      },
    })
    const subscription = self.registration.pushManager.subscribe(event.oldSubscription.options).then((subscription) =>
      fetch(`${webServiceUrl}/subscription`, {
        method: 'post',
        credentials: 'include', // important for sending cookies
        headers: {
          'Content-type': 'application/json',
        },
        body: JSON.stringify({
          old: getPayload(event.oldSubscription),
          new: getPayload(subscription),
        }),
      })
    )
    event.waitUntil(subscription)
  },
  false
)
