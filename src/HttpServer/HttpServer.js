import express from 'express'
import session from 'express-session'
import cors from 'cors'
import bodyParser from 'body-parser'
import PushSubscriptionController from '#pronote/Controllers/PushSubscriptionController.js'
import LoginController from '#pronote/Controllers/LoginController.js'
import DashboardController from '#pronote/Controllers/DashboardController.js'
import SqliteStoreFactory from 'better-sqlite3-session-store'
import cookieParser from 'cookie-parser'
import UserController from '#pronote/Controllers/UserController.js'
import {randomUUID} from 'crypto'
import {default as SqliteDatabase} from 'better-sqlite3'
import ProcessController from '#pronote/Controllers/ProcessController.js'
import Logger from '#pronote/Services/Logger.js'

export default class HttpServer {
  /** @type {PushSubscriptionController} */
  #pushSubscriptionController
  /** @type {LoginController} */
  #loginController
  /** @type {UserController} */
  #userController
  /** @type {DashboardController} */
  #dashboardController
  /** @type {ProcessController} */
  #processController
  #publicDir
  #port
  #origin
  #sessionExpirationInMs
  #sessionDb
  #sessionSecret
  #cookieOptions
  #sessionDatabaseFile
  #debug
  #apiKey
  /** @type {Logger} */
  #logger

  constructor({
    pushSubscriptionController, loginController, dashboardController,
    userController, processController,
    publicDir, port = 3001, origin,
    sessionDatabaseFile,
    sessionExpirationInMs = 900000,
    sessionSecret,
    cookieOptions = {},
    apiKey,
    debug = false,
    logger
  }) {
    this.#port = port
    this.#publicDir = publicDir
    this.#pushSubscriptionController = pushSubscriptionController
    this.#loginController = loginController
    this.#dashboardController = dashboardController
    this.#userController = userController
    this.#processController = processController
    this.#origin = origin
    this.#sessionExpirationInMs = sessionExpirationInMs
    this.#sessionSecret = sessionSecret
    this.#cookieOptions = {
      secure: process.env.NODE_ENV === 'production',
      // lax needed for cross-site cookies
      sameSite:
        process.env.NODE_ENV === 'production' ? 'Strict' : 'lax',
      maxAge: this.#sessionExpirationInMs,
      httpOnly: true,
      ...cookieOptions
    }
    this.#sessionDatabaseFile = sessionDatabaseFile
    this.#debug = debug
    this.#apiKey = apiKey
    this.#logger = logger
  }

  #getSessionDb() {
    if (!this.#sessionDb) {
      const opts = {}
      if (this.#debug) {
        opts.verbose = console.log
      }
      this.#sessionDb = new SqliteDatabase(
        this.#sessionDatabaseFile,
        opts
      )
      this.#sessionDb.pragma('journal_mode = WAL') // it is generally important to set the WAL pragma for performance reasons.
    }
    return this.#sessionDb
  }

  start() {
    const app = express()
    const SqliteStore = SqliteStoreFactory(session)

    app.set('etag', false)
    app.set('lastModified', false)

    // Serve static files from the dist folder
    app.use(express.static(this.#publicDir))

    // Configure cookie parser middleware
    app.use(cookieParser())

    // Configure CORS to accept credentials
    const corsOptions = {
      origin: this.#origin, // frontend URL
      credentials: true, // important for cookies
      methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
    }
    // dependency needed by pushNotification system for parsing JSON bodies
    app.use(bodyParser.json())
    app.use(cors(corsOptions))
    app.use(session({
      store: new SqliteStore({
        client: this.#getSessionDb(),
        expired: {
          clear: true,
          intervalMs: this.#sessionExpirationInMs //ms = 15min
        }
      }),
      secret: this.#sessionSecret,
      resave: false,
      saveUninitialized: false,
      rolling: true, // Enable rolling sessions
      cookie: this.#cookieOptions,
    }))

    const checkSessionCookie = (req, res, next) => {
      if (!req.session || !req.session.user) {
        return res.status(401).json({message: 'Unauthorized: No session cookie'})
      }
      req.session.touch() // Postpone the cookie expiration
      next()
    }

    const getBearerToken = (req) => {
      const authHeader = req.headers['authorization']
      if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.slice(7, authHeader.length) // Remove 'Bearer ' prefix
      }
      return null
    }

    const checkBearerToken = (req, res, next) => {
      const token = getBearerToken(req)
      if (!token) {
        return res.status(401).json({message: 'Unauthorized: No bearer token'})
      }
      // You can add additional token validation logic here
      req.token = token // Attach token to request object for further use
      next()
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
      checkSessionCookie,
      this.#pushSubscriptionController.postSubscription.bind(this.#pushSubscriptionController)
    )
    app.delete(
      '/subscription',
      cors(corsOptions),
      checkSessionCookie,
      this.#pushSubscriptionController.deleteSubscription.bind(this.#pushSubscriptionController)
    )
    app.post(
      '/login',
      cors(corsOptions),
      this.#loginController.loginAction.bind(this.#loginController)
    )

    app.post(
      '/logout',
      cors(corsOptions),
      this.#loginController.logoutAction.bind(this.#loginController)
    )

    app.get(
      '/checkLoggedIn',
      cors(corsOptions),
      this.#loginController.checkLoggedInAction.bind(this.#loginController)
    )

    app.get(
      '/dashboardFiltersConfig',
      cors(corsOptions),
      checkSessionCookie,
      this.#dashboardController.dashboardFiltersConfigAction.bind(this.#dashboardController)
    )

    app.get(
      '/dashboardMetrics',
      cors(corsOptions),
      checkSessionCookie,
      this.#dashboardController.dashboardMetricsAction.bind(this.#dashboardController)
    )

    app.post(
      '/cron',
      cors(corsOptions),
      checkBearerToken,
      (req, res) => {
        const processId = randomUUID()
        // Launch background process without waiting
        Promise.resolve().then(async () => {
          try {
            this.#logger.setProcessId(processId)
            console.log('req.query?.verbose', req.query?.verbose)
            console.log('req.query?.debug', req.query?.debug)
            this.#logger.setVerbose((req.query?.verbose ?? '') === 'true')
            await this.#processController.process((req.query?.debug ?? '') === 'true')
          } catch (error) {
            this.#logger.error('Background process error:', error)
          }
        })
        // Return process ID for log retrieval
        res.status(202).json({
          message: 'Process started',
          processId
        })
      }
    )

    // Add endpoint to retrieve logs
    app.get(
      '/cron/:processId/logs',
      cors(corsOptions),
      checkBearerToken,
      (req, res) => {
        const logs = this.#processController.getLogs(req.params.processId)
        res.json(logs)
      }
    )

    app.listen(this.#port, '0.0.0.0', () => {
      this.#logger.info(`CORS-enabled WebServer running at http://127.0.0.1:${this.#port}/`)
    })
  }
}
