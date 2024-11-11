import express from 'express'
import bodyParser from 'body-parser'

export default class HttpServer {
  #port
  #staticPath
  #pushSubscriptionController
  #indexController

  constructor(staticPath, indexController, pushSubscriptionController, port = 3000) {
    this.#port = port
    this.#staticPath = staticPath
    this.#indexController = indexController
    this.#pushSubscriptionController = pushSubscriptionController
  }

  start() {
    const app = express()

    // dependency needed by pushNotification system for parsing JSON bodies
    app.use(bodyParser.json())

    app.post('/subscription', this.#pushSubscriptionController.postSubscription.bind(this.#pushSubscriptionController))
    app.delete(
      '/subscription',
      this.#pushSubscriptionController.deleteSubscription.bind(this.#pushSubscriptionController)
    )
    app.get('/notifyTest', this.#pushSubscriptionController.getNotificationTest.bind(this.#pushSubscriptionController))
    app.get(
      '/pushNotifications/publicVapidKey.js',
      this.#pushSubscriptionController.getPublicVapidKey.bind(this.#pushSubscriptionController)
    )

    // Serve index.html with timestamp replacement
    app.get('/', this.#indexController.index.bind(this.#indexController))

    // Finally serve static files from the current directory
    app.use(express.static(this.#staticPath))

    app.listen(this.#port, '0.0.0.0', () => {
      console.log(`Server running at http://127.0.0.1:${this.#port}/`)
    })
  }
}
