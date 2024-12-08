import PronoteCrawler from '#pronote/Crawler/PronoteCrawler.js'
import DataWarehouse from '#pronote/Database/DataWarehouse.js'
import DateWrapper from '#pronote/Utils/DateWrapper.js'
import Utils from '#pronote/Utils/Utils.js'
import path from 'path'
import Logger from './Logger.js'

export default class PronoteRetrievalService {
  /** @type {PronoteCrawler} #pronoteCrawler */
  #pronoteCrawler
  /** @type {DataWarehouse} */
  #dataWarehouse
  /** @type {Logger} */
  #logger
  #resultsDir

  constructor({pronoteCrawler, dataWarehouse, logger, resultsDir}) {
    this.#pronoteCrawler = pronoteCrawler
    this.#dataWarehouse = dataWarehouse
    this.#logger = logger
    this.#resultsDir = resultsDir
  }

  async process() {
    try {
      const currentDate = new DateWrapper()
      const folderDate = currentDate.formatDate('YYYY-MM-DD_HH')

      const students = this.#dataWarehouse.getStudents()

      for (const account of students) {
        const currentResultDir = path.join(
          this.#resultsDir,
          account.name.replace(/ /g, '_'),
          folderDate
        )
        this.#logger.info('Processing account:', account.name)
        this.#logger.info('Results directory:', currentResultDir)

        await this.#pronoteCrawler.init()
        await this.#pronoteCrawler.crawl({
          resultDir: currentResultDir,
          currentDate,
          login: account.pronoteLogin,
          password: account.pronotePassword,
          casUrl: account.pronoteCasUrl,
        })

        if (this.#logger.debugMode) {
          this.#logger.debug('keep window opened for debugging')
          await Utils.delay(600000)
        } else {
          this.#logger.info('Wait 5 seconds for xhr request to finish')
          await Utils.delay(5000)
        }

        await this.#pronoteCrawler.close()
      }
    } catch (error) {
      this.#logger.error('An error occurred during the login process:', error)
    }
  }
}
