import path from 'path'
import dotenv from 'dotenv'
import PronoteCrawler from '#pronote/Crawler/PronoteCrawler.js'
import DatabaseConnection from '#pronote/Database/DatabaseConnection.js'
import HttpServer from '#pronote/HttpServer/HttpServer.js'
import {Command} from 'commander'
import PushSubscriptionService from '#pronote/Services/PushSubscriptionService.js'
import PushSubscriptionController from '#pronote/Controllers/PushSubscriptionController.js'
import PronoteRetrievalService from '#pronote/Services/PronoteRetrievalService.js'
import CronController from '#pronote/Controllers/CronController.js'
import DataMetrics from '#pronote/Database/DataMetrics.js'
import DataWarehouse from '#pronote/Database/DataWarehouse.js'
import ProcessorDataService from '#pronote/Services/ProcessorDataService.js'
import ProcessorMetricsService from '#pronote/Services/ProcessorMetricsService.js'
import Crawler from '#pronote/Crawler/Crawler.js'
import ProcessorNotificationsService from '#pronote/Services/ProcessorNotificationsService.js'

let crawler = null
let databaseConnection = null

// -----------------------------------------------------------------------------
// Handle process exit
// -----------------------------------------------------------------------------
/**
 * handle process exit
 * @param {object} options - options
 * @param {number} exitCode - exit code
 */
function exitHandler(options, exitCode) {
  if (options.cleanup) {
    if (crawler !== null) {
      console.log('Closing browser')
      crawler.close()
    }
    if (databaseConnection !== null) {
      console.log('Closing database connection')
      databaseConnection.close()
    }
  }
  if (exitCode === null) {
    exitCode = 1
  }
  if (typeof exitCode === 'object' || typeof exitCode === 'string' || exitCode instanceof Error) {
    console.error(exitCode)
    exitCode = 2
  }
  if (options.exit) process.exit(exitCode)
}

// do something when app is closing
process.on('exit', exitHandler.bind(null, {cleanup: true}))

// catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit: true}))

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {exit: true}))
process.on('SIGUSR2', exitHandler.bind(null, {exit: true}))

// catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit: true}))

/**
 * Parse command arguments
 * @param {Array} argv - arguments
 * @returns {object} options selected
 */
function parseCommandOptions(argv) {
  const command = new Command()
  command
    .name('pronote-analyser')
    .description('Allows pronote information retrieval and analysis')
    .version('1.0.0', '--version')
    .usage('[OPTIONS]...')
    .option('-d, --debug', 'Activates debug mode.', false)
    .option('-v, --verbose', 'Activates verbose mode (details loaded pages, ...).', false)
    .option('--skip-cron', 'Skips automatic processes.', false)
    .option('--skip-pronote', 'Skips pronote data retrieval.', false)
    .option('--skip-data-process', 'Skips data process.', false)
    .option('--skip-data-metrics', 'Skips data metrics.', false)
    .option('--skip-notifications', 'Skips notifications generation.', false)
    .option('--server', 'Launch internal http server to serve html files.', false)
    .parse(argv)

  return command.opts()
}

/**
 * Main function
 */
async function main() {
  dotenv.config()

  const casUrl = process.env.CAS_URL
  const login = process.env.LOGIN
  const password = process.env.PASSWORD
  const databaseFile = process.env.SQLITE_DATABASE_FILE

  const resultsDir = path.join(process.cwd(), process.env.RESULTS_DIR)

  const commandOptions = parseCommandOptions(process.argv)
  databaseConnection = new DatabaseConnection(databaseFile, commandOptions.debug)

  crawler = new Crawler(commandOptions.debug)
  const pronoteCrawler = new PronoteCrawler({
    crawler,
    casUrl,
    login,
    password,
    debug: commandOptions.debug,
    verbose: commandOptions.verbose,
  })
  const pronoteRetrievalService = new PronoteRetrievalService({
    pronoteCrawler,
    resultsDir,
    debug: commandOptions.debug,
    verbose: commandOptions.verbose,
  })

  const dataWarehouse = new DataWarehouse(databaseConnection)
  const processorDataService = new ProcessorDataService(
    dataWarehouse,
    resultsDir,
    commandOptions.debug,
    commandOptions.verbose
  )

  const dataMetrics = new DataMetrics(databaseConnection)
  const processorMetricsService = new ProcessorMetricsService(
    dataMetrics,
    resultsDir,
    commandOptions.debug,
    commandOptions.verbose
  )

  const pushSubscriptionService = new PushSubscriptionService(
    dataWarehouse,
    path.join(process.cwd(), 'src', 'HttpServer'),
    commandOptions.debug
  )
  await pushSubscriptionService.init()
  const pushSubscriptionController = new PushSubscriptionController(pushSubscriptionService)

  const processorNotificationsService = new ProcessorNotificationsService({
    dataWarehouse,
    pushSubscriptionService,
    verbose: commandOptions.verbose,
  })

  if (commandOptions.server) {
    const server = new HttpServer(
      pushSubscriptionController,
      resultsDir,
      process.env?.SERVER_PORT ?? 3001,
      process.env?.ASSETS_URL ?? 'http://localhost:3000'
    )

    server.start()
  }

  const cronController = new CronController({
    pronoteRetrievalService,
    processorDataService,
    processorMetricsService,
    processorNotificationsService,
    runOnInit: true || !dataWarehouse.isSchemaInitialized(),
    skipCron: commandOptions.skipCron,
    skipPronoteDataRetrieval: commandOptions.skipPronote,
    skipDataProcess: commandOptions.skipDataProcess,
    skipDataMetrics: commandOptions.skipDataMetrics,
    skipNotifications: commandOptions.skipNotifications,
    debug: commandOptions.debug,
    verbose: commandOptions.verbose,
  })
  cronController.setupCronJobs()
}

await main()
