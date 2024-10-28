import path from 'path';
import dotenv from 'dotenv';
import Utils from '#pronote/Utils/Utils.js';
import Crawler from '#pronote/Crawler/Crawler.js';
import PronoteCrawler from '#pronote/Crawler/PronoteCrawler.js';
import Database from '#pronote/Database/Database.js'
import DataProcessor from '#pronote/Processor/DataProcessor.js'
import {Command} from 'commander'

let browser = null;

// -----------------------------------------------------------------------------
// Handle process exit
// @see https://stackoverflow.com/a/14032965
// -----------------------------------------------------------------------------
process.stdin.resume(); // so the program will not close instantly

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

async function retrievePronoteData({resultDir, casUrl, login, password, debugMode, verbose}) {
  /** @var {Crawler} crawler */
  const crawler = new Crawler(debugMode);
  browser = await crawler.initBrowser();
  const page = await crawler.initPage(browser);

  /** @var {PronoteCrawler} pronoteCrawler */
  const pronoteCrawler = new PronoteCrawler({
    page, debugMode, verbose, 
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
  }
}

async function processPronoteData({databaseFile, verbose, resultsDir}) {
  const database = new Database();
  database.init({databaseFile, verbose})
  const dataProcessor = new DataProcessor(database, resultsDir)
  dataProcessor.process()
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
    .parse(argv);

  return command.opts();
}

async function main() {
  dotenv.config();

  const casUrl = process.env.CAS_URL;
  const login = process.env.LOGIN;
  const password = process.env.PASSWORD;
  const databaseFile = process.env.SQLITE_DATABASE_FILE;

  const currentDate = Utils.formatDate(new Date());
  const resultsDir = path.join(process.cwd(), process.env.RESULTS_DIR)
  const currentResultDir = path.join(resultsDir, currentDate);

  const commandOptions = parseCommandOptions(process.argv)
  

  if (!commandOptions.skipPronote) {
    if (commandOptions.verbose) {
      console.debug("Retrieving Pronote data ...")
    }
    await retrievePronoteData({
      resultDir: currentResultDir, 
      casUrl, login, password, 
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
      console.debug("Pronote data processing ...")
    }
    await processPronoteData({databaseFile, verbose: commandOptions.verbose, resultsDir});
    if (commandOptions.verbose) {
      console.debug("Pronote data processed.")
    }
  } else if (commandOptions.verbose) {
    console.debug("Pronote data processing skipped.")
  }
}

await main();

process.exit(0)