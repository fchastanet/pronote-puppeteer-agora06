import path from 'path'
import dotenv from 'dotenv'
import {Command} from 'commander'
import HttpServer from '#pronote/HttpServer/HttpServer.js'
import DatabaseConnection from '#pronote/Database/DatabaseConnection.js'
import PushSubscriptionService from '#pronote/Services/PushSubscriptionService.js'
import PushSubscriptionController from '#pronote/Controllers/PushSubscriptionController.js'
import DataWarehouse from '#pronote/Database/DataWarehouse.js'
import processManagement from '#pronote/Utils/ProcessManagement.js'
import AuthService from '#pronote/Services/AuthService.js'
import LoginController from '#pronote/Controllers/LoginController.js'
import UserController from '#pronote/Controllers/UserController.js'
import DataMetrics from '#pronote/Database/DataMetrics.js'
import DashboardController from '#pronote/Controllers/DashboardController.js'
import ProcessorMetricsService from '#pronote/Services/ProcessorMetricsService.js'
import PronoteCrawler from './Crawler/PronoteCrawler.js'
import PronoteRetrievalService from './Services/PronoteRetrievalService.js'
import NotificationsService from './Services/NotificationsService.js'
import ProcessorDataService from './Services/ProcessorDataService.js'
import ProcessController from './Controllers/ProcessController.js'
import Crawler from './Crawler/Crawler.js'
import Logger from './Services/Logger.js'
import {randomUUID} from 'crypto'

const logger = new Logger()
let databaseConnection = null
processManagement(logger, (options) => {
  if (!options.cleanup) {
    return
  }
  if (databaseConnection !== null) {
    logger.info('Closing database connection')
    databaseConnection.close()
  }
})

const parseCommandOptions = (argv) => {
  const command = new Command()
  command
    .name('pronote-backend-server')
    .description('Launch internal http server to serve html files')
    .version('1.0.0', '--version')
    .usage('[OPTIONS]...')
    .option('-d, --debug', 'Activates debug mode.', false)
    .option('-v, --verbose', 'Activates verbose mode (details loaded pages, ...).', false)
    .parse(argv)

  return command.opts()
}

const initProcessController = ({
  dataWarehouse,
  pushSubscriptionService,
  logger,
  commandOptions,
  databaseFile,
  resultsDir
}) => {
  const crawler = new Crawler({logger})
  const pronoteCrawler = new PronoteCrawler({
    crawler,
    logger,
    debug: commandOptions.debug,
    verbose: commandOptions.verbose,
  })
  const pronoteRetrievalService = new PronoteRetrievalService({
    pronoteCrawler,
    dataWarehouse,
    logger,
    resultsDir,
    debug: commandOptions.debug,
    verbose: commandOptions.verbose,
  })

  const notificationsService = new NotificationsService({
    dataWarehouse,
    pushSubscriptionService,
    logger,
    skipNotifications: commandOptions.skipNotifications,
    rateLimit: process.env.NOTIFICATIONS_RATE_LIMIT,
  })

  const processorDataService = new ProcessorDataService({
    dataWarehouse,
    notificationsService,
    logger,
    resultsDir,
  })

  return new ProcessController({
    pronoteRetrievalService,
    processorDataService,
    skipPronoteDataRetrieval: commandOptions.skipPronote,
    logger,
    skipDataProcess: commandOptions.skipDataProcess,
    databaseFile,
    studentsInitializationFile: path.join(process.cwd(), '.students-dev.js'),
  })
}

const main = async () => {
  const commandOptions = parseCommandOptions(process.argv)
  logger.processId = randomUUID()
  logger.debugMode = commandOptions.debug
  logger.verboseMode = commandOptions.verbose

  const envFile = process.env.ENV_FILE ?? '.env'
  logger.info('loading envFile', envFile)
  dotenv.config({path: path.join(process.cwd(), envFile)})

  const databaseFile = process.env.SQLITE_DATABASE_FILE

  const resultsDir = path.join(process.cwd(), process.env.RESULTS_DIR)
  const publicDir = path.join(process.cwd(), process.env.PUBLIC_DIR)

  databaseConnection = new DatabaseConnection({
    databaseFile, logger
  })
  const dataWarehouse = new DataWarehouse(databaseConnection, logger)

  const cookieOptions = {
    secure: process.env?.SESSION_COOKIE_SECURE === 1 ?? false,
  }
  logger.info('cookieOptions', cookieOptions)
  const authService = new AuthService({dataWarehouse})
  const loginController = new LoginController({
    logger,
    authService,
    cookieOptions,
    verbose: commandOptions.verbose,
  })

  const pushSubscriptionService = new PushSubscriptionService({
    dataWarehouse,
    privatePath: path.join(process.cwd(), 'src', 'HttpServer'),
    logger
  })
  await pushSubscriptionService.init()
  const pushSubscriptionController = new PushSubscriptionController({
    logger, pushSubscriptionService
  })

  const dataMetrics = new DataMetrics(databaseConnection)
  const processorMetricsService = new ProcessorMetricsService({
    dataMetrics, dataWarehouse
  })
  const dashboardController = new DashboardController({processorMetricsService})

  const userController = new UserController(dataWarehouse)

  const processController = initProcessController({
    dataWarehouse,
    pushSubscriptionService,
    logger,
    commandOptions,
    databaseFile,
    resultsDir
  })
  const server = new HttpServer({
    pushSubscriptionController,
    loginController,
    userController,
    dashboardController,
    processController,
    logger,
    publicDir,
    port: process.env?.SERVER_PORT ?? 3001,
    origin: process.env?.ASSETS_URL ?? 'http://localhost:3000',
    sessionDatabaseFile: process.env?.SESSION_DATABASE_FILE,
    sessionExpiration: process.env?.SESSION_EXPIRATION_IN_MS ?? 900000,
    sessionSecret: process.env?.SESSION_SECRET ?? 'your-secret-key',
    cookieOptions,
    debug: commandOptions.debug
  })

  server.start()
}

await main()
