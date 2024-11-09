self.addEventListener('push', event => {
  try {
    const data = event.data.json()
    self.registration.showNotification(data.title, {
      body: data.body
    }).catch(error => {
      console.error('Error showing notification:', error)
    })
  } catch (error) {
    console.error('Error handling push event:', error)
  }
})