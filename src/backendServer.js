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

let databaseConnection = null
processManagement((options) => {
  if (!options.cleanup) {
    return
  }
  if (databaseConnection !== null) {
    console.log('Closing database connection')
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

const main = async () => {
  const envFile = process.env.ENV_FILE ?? '.env'
  console.log('loading envFile', envFile)
  dotenv.config({path: path.join(process.cwd(), envFile)})

  const databaseFile = process.env.SQLITE_DATABASE_FILE

  const resultsDir = path.join(process.cwd(), process.env.RESULTS_DIR)
  const publicDir = path.join(process.cwd(), process.env.PUBLIC_DIR)
  const commandOptions = parseCommandOptions(process.argv)

  databaseConnection = new DatabaseConnection(databaseFile, commandOptions.debug)
  const dataWarehouse = new DataWarehouse(databaseConnection)

  const cookieOptions = {
    secure: process.env?.SESSION_COOKIE_SECURE === 1 ?? false,
  }
  console.log('cookieOptions', cookieOptions)
  const authService = new AuthService({dataWarehouse})
  const loginController = new LoginController({
    authService,
    cookieOptions,
    verbose: commandOptions.verbose,
  })

  const pushSubscriptionService = new PushSubscriptionService(
    dataWarehouse,
    path.join(process.cwd(), 'src', 'HttpServer'),
    commandOptions.debug
  )
  await pushSubscriptionService.init()
  const pushSubscriptionController = new PushSubscriptionController(pushSubscriptionService)

  const dataMetrics = new DataMetrics(databaseConnection)
  const processorMetricsService = new ProcessorMetricsService(dataMetrics, dataWarehouse)
  const dashboardController = new DashboardController({processorMetricsService})

  const userController = new UserController(dataWarehouse)

  const server = new HttpServer({
    pushSubscriptionController,
    loginController,
    userController,
    dashboardController,
    resultsDir,
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
