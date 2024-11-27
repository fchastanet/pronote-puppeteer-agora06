import path from 'path'
import dotenv from 'dotenv'
import PronoteCrawler from '#pronote/Crawler/PronoteCrawler.js'
import DatabaseConnection from '#pronote/Database/DatabaseConnection.js'
import {Command} from 'commander'
import PushSubscriptionService from '#pronote/Services/PushSubscriptionService.js'
import PronoteRetrievalService from '#pronote/Services/PronoteRetrievalService.js'
import ProcessController from '#pronote/Controllers/ProcessController.js'
import DataMetrics from '#pronote/Database/DataMetrics.js'
import DataWarehouse from '#pronote/Database/DataWarehouse.js'
import ProcessorDataService from '#pronote/Services/ProcessorDataService.js'
import ProcessorMetricsService from '#pronote/Services/ProcessorMetricsService.js'
import Crawler from '#pronote/Crawler/Crawler.js'
import NotificationsService from '#pronote/Services/NotificationsService.js'
import processManagement from '#pronote/Utils/ProcessManagement.js'

let crawler = null
let databaseConnection = null
processManagement((options) => {
  if (!options.cleanup) {
    return
  }
  if (crawler !== null) {
    console.log('Closing browser')
    crawler.close()
  }
  if (databaseConnection !== null) {
    console.log('Closing database connection')
    databaseConnection.close()
  }
})


/**
 * Parse command arguments
 * @param {Array} argv - arguments
 * @returns {object} options selected
 */
const parseCommandOptions = (argv) => {
  const command = new Command()
  command
    .name('pronote-data-processor')
    .description('Allows pronote information retrieval and analysis')
    .version('1.0.0', '--version')
    .usage('[OPTIONS]...')
    .option('-d, --debug', 'Activates debug mode.', false)
    .option('-v, --verbose', 'Activates verbose mode (details loaded pages, ...).', false)
    .option('--skip-pronote', 'Skips pronote data retrieval.', false)
    .option('--skip-data-process', 'Skips data process.', false)
    .option('--skip-data-metrics', 'Skips data metrics.', false)
    .option('--skip-notifications', 'Skips notifications generation.', false)
    .parse(argv)

  return command.opts()
}

const main = async () => {
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

  const pushSubscriptionService = new PushSubscriptionService(
    dataWarehouse,
    path.join(process.cwd(), 'src', 'HttpServer'),
    commandOptions.debug
  )
  await pushSubscriptionService.init()

  const notificationsService = new NotificationsService({
    dataWarehouse,
    pushSubscriptionService,
    verbose: commandOptions.verbose,
    skipNotifications: commandOptions.skipNotifications,
    rateLimit: process.env.NOTIFICATIONS_RATE_LIMIT,
  })

  const processorDataService = new ProcessorDataService(
    dataWarehouse,
    notificationsService,
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

  const processController = new ProcessController({
    pronoteRetrievalService,
    processorDataService,
    processorMetricsService,
    skipPronoteDataRetrieval: commandOptions.skipPronote,
    skipDataProcess: commandOptions.skipDataProcess,
    skipDataMetrics: commandOptions.skipDataMetrics,
    verbose: commandOptions.verbose,
    accountsInitializationFile: path.join(process.cwd(), '.accounts.js'),
  })
  await processController.process()
}

await main()
