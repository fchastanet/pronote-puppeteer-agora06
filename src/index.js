import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import Utils from './Utils.js';
import Crawler from './Crawler.js';
import PronoteCrawler from './PronoteCrawler.js';

let browser = null;

// -----------------------------------------------------------------------------
// Handle process exit
// @see https://stackoverflow.com/a/14032965
// -----------------------------------------------------------------------------
process.stdin.resume(); // so the program will not close instantly

function exitHandler(options, exitCode) {
    if (options.cleanup) {
      console.log('clean before exiting');
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

async function main() {
  dotenv.config();

  const casUrl = process.env.CAS_URL;
  const login = process.env.LOGIN;
  const password = process.env.PASSWORD;
  const debugMode = process.env.DEBUG_MODE === '1';
  const consoleLogs = process.env.CONSOLE_LOGS === '1';
  const currentDate = Utils.formatDate(new Date());
  const resultDir = path.join(process.cwd(), process.env.RESULTS_DIR, currentDate);

  if (!fs.existsSync(resultDir)){
    fs.mkdirSync(resultDir, { recursive: true });
  }

  /** @var {Crawler} crawler */
  const crawler = new Crawler(debugMode);
  browser = await crawler.initBrowser();
  const page = await crawler.initPage(browser);

  /** @var {PronoteCrawler} pronoteCrawler */
  const pronoteCrawler = new PronoteCrawler({
    page, debugMode, consoleLogs, 
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
    process.exit(0);
  } catch (error) {
    console.error('An error occurred during the login process:', error);
  }
}

await main();