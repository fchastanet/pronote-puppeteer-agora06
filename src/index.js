import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import Utils from '#pronote/Utils/Utils.js';
import Crawler from '#pronote/Crawler/Crawler.js';
import PronoteCrawler from '#pronote/Crawler/PronoteCrawler.js';
import DatabaseConnection from './Database/DatabaseConnection.js';
import DataWarehouse from '#pronote/Database/DataWarehouse.js'
import DataMetrics from '#pronote/Database/DataMetrics.js'
import DataProcessor from '#pronote/Processor/DataProcessor.js'
import MetricsProcessor from '#pronote/Processor/MetricsProcessor.js'
import HttpServer from '#pronote/HttpServer/HttpServer.js'
import DateWrapper from '#pronote/Utils/DateWrapper.js'
import {Command} from 'commander'

let browser = null;

// -----------------------------------------------------------------------------
// Handle process exit
// -----------------------------------------------------------------------------
function exitHandler(options, exitCode) {
    if (options.cleanup) {
      if (browser !== null) {
        console.log('Closing browser');
        browser.close();
      }
    }
    if (exitCode === null) {
      exitCode = 1;
    }
    if (typeof exitCode === 'error' || typeof exitCode === 'string' || exitCode instanceof Error) {
      console.error(exitCode);
      exitCode = 2;
    }
    if (options.exit) process.exit(exitCode);
}

// do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

// catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));

// catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));

async function retrievePronoteData({
  resultDir, casUrl, login, password, currentDate, debugMode, verbose
}) {
  /** @var {Crawler} crawler */
  const crawler = new Crawler(debugMode);
  browser = await crawler.initBrowser();
  const page = await crawler.initPage(browser);

  /** @var {PronoteCrawler} pronoteCrawler */
  const pronoteCrawler = new PronoteCrawler({
    page, debugMode, verbose, 
    currentDate,
    resultDir, login, password, casUrl
  });
  pronoteCrawler.setPageListeners();
  try {
    await pronoteCrawler.crawl();
    if (debugMode) {
      console.log("keep window opened for debugging");
      await Utils.delay(600000);
    } else {
      console.log("Wait 5 seconds for xhr request to finish");
      await Utils.delay(5000);
    }
  } catch (error) {
    console.error('An error occurred during the login process:', error);
    process.exit(1);
  }
}

function processPronoteDataWarehouse({databaseConnection, verbose, resultsDir}) {
  const dataWarehouse = new DataWarehouse(databaseConnection)
  const dataProcessor = new DataProcessor(dataWarehouse, resultsDir, verbose)
  dataProcessor.process()
}

async function processPronoteDataMetrics({databaseConnection, verbose, resultsDir}) {
  const dataMetrics = new DataMetrics(databaseConnection)
  const metricsProcessor = new MetricsProcessor(dataMetrics, resultsDir, verbose)
  return await metricsProcessor.process()
}

function parseCommandOptions(argv) {
  const command = new Command()
  command
    .name('pronote-analyser')
    .description('Allows pronote information retrieval and analysis')
    .version('1.0.0', '--version')
    .usage('[OPTIONS]...')
    .option('-d, --debug', 'Activates debug mode.', false)
    .option('-v, --verbose', 'Activates verbose mode (details loaded pages, ...).', false)
    .option('--skip-pronote', 'Skips pronote data retrieval.', false)
    .option('--skip-data-process', 'Skips data process.', false)
    .option('--skip-data-metrics', 'Skips data metrics.', false)
    .option('--server', 'Launch internal http server to serve html files.', false)
    .parse(argv);

  return command.opts();
}

async function main() {
  dotenv.config();

  const casUrl = process.env.CAS_URL;
  const login = process.env.LOGIN;
  const password = process.env.PASSWORD;
  const databaseFile = process.env.SQLITE_DATABASE_FILE;

  const currentDate = new DateWrapper()
  const folderDate = currentDate.formatDate('YYYY-MM-DD_HH')
  const resultsDir = path.join(process.cwd(), process.env.RESULTS_DIR)
  const publicDir = path.join(process.cwd(), process.env.PUBLIC_DIR)
  const currentResultDir = path.join(resultsDir, folderDate);

  const commandOptions = parseCommandOptions(process.argv)
  const databaseConnection = new DatabaseConnection(databaseFile, commandOptions.verbose);

  try {
    if (!commandOptions.skipPronote) {
      if (commandOptions.verbose) {
        console.debug("Retrieving Pronote data ...")
      }
      await retrievePronoteData({
        resultDir: currentResultDir, 
        casUrl, login, password, 
        currentDate,
        debug: commandOptions.debug,
        verbose: commandOptions.verbose
      });
      if (commandOptions.verbose) {
        console.debug("Pronote data retrieved")
      }
    } else if (commandOptions.verbose) {
      console.debug("Pronote data retrieval skipped.")
    }

    if (!commandOptions.skipDataProcess) {
      if (commandOptions.verbose) {
        console.debug("Pronote data warehouse processing ...")
      }
      processPronoteDataWarehouse({databaseConnection, verbose: commandOptions.verbose, resultsDir});
      if (commandOptions.verbose) {
        console.debug("Pronote data warehouse processed.")
      }
    } else if (commandOptions.verbose) {
      console.debug("Pronote data warehouse processing skipped.")
    }

    if (!commandOptions.skipDataMetrics) {
      if (commandOptions.verbose) {
        console.debug("Pronote data metrics processing ...")
      }
      const metrics = await processPronoteDataMetrics({databaseConnection, verbose: commandOptions.verbose})
      const jsonString = JSON.stringify(metrics, null, 2).replace(/\00/g,'')
      const targetFile = path.join(publicDir, 'metrics.json')
      console.debug(`Writing metrics to '${targetFile}'.`)
      if (commandOptions.verbose) {
        console.debug(`Metrics: ${jsonString}`)
      }
      fs.writeFileSync(
        targetFile, 
        jsonString, 
        'utf8', 
        err => {
          if (err) {
            console.error(err);
            process.exit(1);
          } else {
            console.log(`Result written into '${targetFile}'`);
          }
        }
      )
      if (commandOptions.verbose) {
        console.debug("Pronote data metrics processed.")
      }
    } else if (commandOptions.verbose) {
      console.debug("Pronote data metrics processing skipped.")
    }

    
    if (commandOptions.server) {
      const server = new HttpServer()
      server.start();
    }
  
  } finally {
    databaseConnection.close();
  }
  
}

await main();
