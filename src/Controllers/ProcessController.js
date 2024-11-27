import ProcessorDataService from '#pronote/Services/ProcessorDataService.js'
import ProcessorMetricsService from '#pronote/Services/ProcessorMetricsService.js'
import fs from 'fs'
import PronoteRetrievalService from '../Services/PronoteRetrievalService.js'

export default class ProcessController {
  /** @type {PronoteRetrievalService} */
  #pronoteRetrievalService
  /** @type {ProcessorDataService} */
  #processorDataService
  /** @type {ProcessorMetricsService} */
  #processorMetricsService
  #skipPronoteDataRetrieval
  #skipDataProcess
  #skipDataMetrics
  #verbose
  #accountsInitializationFile

  constructor({
    pronoteRetrievalService,
    processorDataService,
    processorMetricsService,
    skipPronoteDataRetrieval,
    skipDataProcess,
    skipDataMetrics,
    verbose,
    accountsInitializationFile,
  }) {
    this.#pronoteRetrievalService = pronoteRetrievalService
    this.#processorDataService = processorDataService
    this.#processorMetricsService = processorMetricsService
    this.#skipPronoteDataRetrieval = skipPronoteDataRetrieval
    this.#skipDataProcess = skipDataProcess
    this.#skipDataMetrics = skipDataMetrics
    this.#verbose = verbose
    this.#accountsInitializationFile = accountsInitializationFile
  }

  async process() {
    if (this.#verbose) {
      console.debug('Start process ...')
    }
    await this.#createDatabase()
    await this.#initAccounts()
    await this.#retrievePronoteData()
    await this.#processPronoteData()
    await this.#processDataMetrics()
    if (this.#verbose) {
      console.debug('End process ...')
    }
  }

  async #createDatabase() {
    if (this.#verbose) {
      console.debug('Creating database ...')
    }
    await this.#processorDataService.createDatabase()
    if (this.#verbose) {
      console.debug('Database created.')
    }
  }

  async #initAccounts() {
    if (this.#accountsInitializationFile) {
      if (this.#verbose) {
        console.debug('Initializing accounts ...')
      }
      if (!fs.existsSync(this.#accountsInitializationFile)) {
        throw new Error(`The accounts initialization file does not exist: ${this.#accountsInitializationFile}`)
      }
      await this.#processorDataService.initAccounts(this.#accountsInitializationFile)
      if (this.#verbose) {
        console.debug('Accounts initialized.')
      }
    }
  }

  async #retrievePronoteData() {
    if (this.#skipPronoteDataRetrieval) {
      if (this.#verbose) {
        console.debug('Pronote data retrieval skipped.')
      }
      return
    }
    if (this.#verbose) {
      console.debug('Retrieving Pronote data ...')
    }

    await this.#pronoteRetrievalService.process()
    if (this.#verbose) {
      console.debug('Pronote data retrieved')
    }
  }

  async #processPronoteData() {
    if (this.#skipDataProcess) {
      if (this.#verbose) {
        console.debug('Pronote data processing skipped.')
      }
      return
    }
    if (this.#verbose) {
      console.debug('Pronote data warehouse processing ...')
    }
    await this.#processorDataService.process()
    if (this.#verbose) {
      console.debug('Pronote data warehouse processed.')
    }
  }

  async #processDataMetrics() {
    if (this.#skipDataMetrics) {
      if (this.#verbose) {
        console.debug('Pronote data metrics processing skipped.')
      }
      return
    }
    if (this.#verbose) {
      console.debug('Pronote data metrics processing ...')
    }
    await this.#processorMetricsService.process()
    if (this.#verbose) {
      console.debug('Pronote data metrics processed.')
    }
  }
}
