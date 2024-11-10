import PronoteCrawler from "#pronote/Crawler/PronoteCrawler.js";
import DateWrapper from "#pronote/Utils/DateWrapper.js";
import Utils from "#pronote/Utils/Utils.js";
import path from 'path';

export default class PronoteRetrievalService {
  /** @type {PronoteCrawler} #pronoteCrawler */
  #pronoteCrawler
  #resultsDir
  #debug
  #verbose

  constructor({pronoteCrawler, resultsDir, debug, verbose}) {
    this.#pronoteCrawler = pronoteCrawler
    this.#resultsDir = resultsDir
    this.#debug = debug
    this.#verbose = verbose
  }

  async process() { 
    try {      
      const currentDate = new DateWrapper();
      const folderDate = currentDate.formatDate('YYYY-MM-DD_HH')
      const currentResultDir = path.join(this.#resultsDir, folderDate);
      
      await this.#pronoteCrawler.init();
      await this.#pronoteCrawler.crawl(currentResultDir, currentDate);
      if (this.#debug) {
        console.log("keep window opened for debugging");
        await Utils.delay(600000);
      } else {
        console.log("Wait 5 seconds for xhr request to finish");
        await Utils.delay(5000);
      }
    } catch (error) {
      console.error('An error occurred during the login process:', error);
    } finally {
      this.#pronoteCrawler.close();
    }
  }

}