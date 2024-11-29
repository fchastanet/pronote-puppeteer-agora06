import PronoteCrawler from '#pronote/Crawler/PronoteCrawler.js'
import DataWarehouse from '#pronote/Database/DataWarehouse.js'
import DateWrapper from '#pronote/Utils/DateWrapper.js'
import Utils from '#pronote/Utils/Utils.js'
import path from 'path'

export default class PronoteRetrievalService {
  /** @type {PronoteCrawler} #pronoteCrawler */
  #pronoteCrawler
  /** @type {DataWarehouse} */
  #dataWarehouse
  #resultsDir
  #debug
  #verbose

  constructor({pronoteCrawler, dataWarehouse, resultsDir, debug, verbose}) {
    this.#pronoteCrawler = pronoteCrawler
    this.#dataWarehouse = dataWarehouse
    this.#resultsDir = resultsDir
    this.#debug = debug
    this.#verbose = verbose
  }

  async process() {
    try {
      const currentDate = new DateWrapper()
      const folderDate = currentDate.formatDate('YYYY-MM-DD_HH')

      const students = this.#dataWarehouse.getStudents()

      for (const account of students) {
        const currentResultDir = path.join(
          this.#resultsDir,
          account.name,
          folderDate
        )

        await this.#pronoteCrawler.init()
        await this.#pronoteCrawler.crawl({
          currentResultDir, currentDate,
          login: account.login,
          password: account.password,
          casUrl: account.casUrl,
        })

        if (this.#debug) {
          console.log('keep window opened for debugging')
          await Utils.delay(600000)
        } else {
          console.log('Wait 5 seconds for xhr request to finish')
          await Utils.delay(5000)
        }

        await this.#pronoteCrawler.close()
      }
    } catch (error) {
      console.error('An error occurred during the login process:', error)
    }
  }
}
