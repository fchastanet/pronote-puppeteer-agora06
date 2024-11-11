const subscribeToPushNotifications = () => {
  console.log('Subscribing to push notifications')
  if (!'serviceWorker' in navigator || !'Notification' in window) {
    console.error('Service Worker and Notification are not supported')
    return
  }
  console.log('Service Worker and Notification are supported')
  navigator.serviceWorker.register(
    '/service-worker.js', {
    scope: '/',
    }
  ).then(registration => {
    console.log('Service Worker registered with scope:', registration.scope)

    // Request Notification Permission
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        console.log('Notification permission granted')
        subscribeUser(registration)
        setSubscribeMessage();
      } else {
        console.log('Notification permission denied')
      }
    })
  }).catch(error => {
    console.error('Service Worker registration failed:', error)
  })
}

const unsubscribeFromPushNotifications = async () => {
  console.log('Unsubscribing from push notifications')
  navigator.serviceWorker.ready.then(registration => {
    registration.pushManager.getSubscription()?.then(async (subscription) => {
      if (!subscription) {
        console.error('No subscription found')
        return
      }
      const { endpoint } = subscription;
      const response = await fetch(`/subscription?endpoint=${endpoint}`, {
        method: 'DELETE',
        headers: {
          'content-type': 'application/json',
        },
      });
      if (response.ok) {
        // wait a little bit to receive last notification message before unsubscribing
        setTimeout(() => {
          subscription.unsubscribe().then(() => {
            console.log('Unsubscribed')
            setSubscribeMessage();
          }).catch(error => {
            console.error('Error unsubscribing:', error)
          })
        }, 1000)
      }
    }).catch(error => {
      console.error('Error getting subscription:', error)
    })
  }).catch(error => {
    console.error('Error getting service worker registration:', error)
  })
}

const setSubscribeMessage = async () => {
  const registration = await navigator.serviceWorker.ready.catch(error => {
    console.error('Error getting service worker registration:', error)
    document.getElementById('subscribeButton').setAttribute('style', 'display: none');
    document.getElementById('unsubscribeButton').setAttribute('style', 'display: none');
  });
  const subscription = await registration.pushManager.getSubscription();
  document.getElementById('subscribeButton').setAttribute('style', `display: ${subscription ? 'none' : 'block'};`);
  document.getElementById('unsubscribeButton').setAttribute('style', `display: ${subscription ? 'block' : 'none'};`);
};


const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')
  
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  
  return outputArray
}

const subscribeUser = async () => {
  if (!('serviceWorker' in navigator)) {
    console.error('Service Worker is not supported by this browser')
    return;
  }
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
  }).catch(error => {
    console.error('Error subscribing:', error)
  })
  await fetch('/subscription', {
    method: 'POST',
    body: JSON.stringify({new: subscription}),
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(response => {
    if (!response.ok) {
      console.error('Error sending subscription:', response)
    } else {
      console.log('Subscription sent')
    }
    setSubscribeMessage();
  }).catch(error => {
    console.error('Error sending subscription:', error)
  })
}

initSubscription = async () => {
  setSubscribeMessage();
}