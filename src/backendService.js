import path from 'path'
import dotenv from 'dotenv'
import {Command} from 'commander'
import DatabaseConnection from '#pronote/Database/DatabaseConnection.js'
import DataWarehouse from '#pronote/Database/DataWarehouse.js'
import processManagement from '#pronote/Utils/ProcessManagement.js'
import PushSubscriptionService from '#pronote/Services/PushSubscriptionService.js'
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

const initProcess = (debugMode, verboseMode) => {
  logger.processId = randomUUID()
  logger.debugMode = debugMode
  logger.verboseMode = verboseMode
}

const initProcessController = async (options) => {
  const envFile = process.env.ENV_FILE ?? '.env'
  logger.info('loading envFile', envFile)
  dotenv.config({path: path.join(process.cwd(), envFile)})

  const databaseFile = process.env.SQLITE_DATABASE_FILE
  const resultsDir = path.join(process.cwd(), process.env.RESULTS_DIR)

  databaseConnection = new DatabaseConnection({
    databaseFile,
    logger
  })
  const dataWarehouse = new DataWarehouse(databaseConnection, logger)

  const pushSubscriptionService = new PushSubscriptionService({
    dataWarehouse,
    privatePath: path.join(process.cwd(), 'src', 'HttpServer'),
    logger
  })
  await pushSubscriptionService.init()

  const crawler = new Crawler({logger})
  const pronoteCrawler = new PronoteCrawler({
    crawler,
    logger,
    debug: options.debug,
    verbose: options.verbose
  })

  const pronoteRetrievalService = new PronoteRetrievalService({
    pronoteCrawler,
    dataWarehouse,
    logger,
    resultsDir,
    debug: options.debug,
    verbose: options.verbose
  })

  const notificationsService = new NotificationsService({
    dataWarehouse,
    pushSubscriptionService,
    logger,
    skipNotifications: options.skipNotifications,
    rateLimit: process.env.NOTIFICATIONS_RATE_LIMIT
  })

  const processorDataService = new ProcessorDataService({
    dataWarehouse,
    notificationsService,
    logger,
    resultsDir
  })

  return new ProcessController({
    pronoteRetrievalService,
    processorDataService,
    skipPronoteDataRetrieval: options.skipPronote,
    logger,
    skipDataProcess: options.skipDataProcess,
    databaseFile,
    studentsInitializationFile: path.join(process.cwd(), '.students-dev.js')
  })
}

const parseCommandOptions = (argv) => {
  const command = new Command()
  command
    .name('pronote-backend-service')
    .description('Execute background tasks for Pronote data retrieval and processing')
    .version('1.0.0')

  command
    .command('install')
    .description('Install and initialize the application')
    .option('-d, --debug', 'Activates debug mode', false)
    .option('-v, --verbose', 'Activates verbose mode', false)
    .action(async (options) => {
      initProcess(options.debug, options.verbose)
      const processController = await initProcessController(options)
      await processController.install()
    })

  command
    .command('process')
    .description('Process Pronote data retrieval and notifications')
    .option('-d, --debug', 'Activates debug mode', false)
    .option('-v, --verbose', 'Activates verbose mode', false)
    .option('--skip-notifications', 'Skip sending notifications', false)
    .option('--skip-pronote', 'Skip Pronote data retrieval', false)
    .option('--skip-data-process', 'Skip data processing', false)
    .action(async (options) => {
      initProcess(options.debug, options.verbose)
      const processController = await initProcessController(options)
      await processController.process()
    })

  command.parse(argv)
}

const main = async () => {
  await parseCommandOptions(process.argv)
}

await main()
