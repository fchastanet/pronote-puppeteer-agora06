import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import PushSubscriptionController from '#pronote/Controllers/PushSubscriptionController.js'
import LoginController from '#pronote/Controllers/LoginController.js'

export default class HttpServer {
  /** @type {PushSubscriptionController} */
  #pushSubscriptionController
  /** @type {LoginController} */
  #loginController
  #resultsDir
  #port
  #origin
  #dataWarehouse

  constructor(
    pushSubscriptionController, LoginController,
    resultsDir, port = 3001, origin) {
    this.#port = port
    this.#resultsDir = resultsDir
    this.#pushSubscriptionController = pushSubscriptionController
    this.#loginController = LoginController
    this.#origin = origin
  }

  start() {
    const app = express()

    // dependency needed by pushNotification system for parsing JSON bodies
    app.use(bodyParser.json())
    app.use(cors())

    const corsOptions = {
      origin: this.#origin,
      optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
    }

    app.options('*', cors(corsOptions)) // enable pre-flight request for all routes
    app.get(
      '/publicVapidKey.json',
      cors(corsOptions),
      this.#pushSubscriptionController.getPublicVapidKey.bind(this.#pushSubscriptionController)
    )
    app.post(
      '/subscription',
      cors(corsOptions),
      this.#pushSubscriptionController.postSubscription.bind(this.#pushSubscriptionController)
    )
    app.delete(
      '/subscription',
      cors(corsOptions),
      this.#pushSubscriptionController.deleteSubscription.bind(this.#pushSubscriptionController)
    )
    app.get(
      '/notifyTest',
      cors(corsOptions),
      this.#pushSubscriptionController.getNotificationTest.bind(this.#pushSubscriptionController)
    )
    app.get(
      '/metrics.json',
      cors(corsOptions),
      (req, res) => {
        res.sendFile(`${this.#resultsDir}/metrics.json`)
      }
    )
    app.post(
      '/login',
      cors(corsOptions),
      this.#loginController.loginAction.bind(this.#loginController)
    )

    app.listen(this.#port, '0.0.0.0', () => {
      console.log(`CORS-enabled WebServer running at http://127.0.0.1:${this.#port}/`)
    })
  }
}
