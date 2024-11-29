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
  #studentsInitializationFile

  constructor({
    pronoteRetrievalService,
    processorDataService,
    processorMetricsService,
    skipPronoteDataRetrieval,
    skipDataProcess,
    skipDataMetrics,
    verbose,
    studentsInitializationFile,
  }) {
    this.#pronoteRetrievalService = pronoteRetrievalService
    this.#processorDataService = processorDataService
    this.#processorMetricsService = processorMetricsService
    this.#skipPronoteDataRetrieval = skipPronoteDataRetrieval
    this.#skipDataProcess = skipDataProcess
    this.#skipDataMetrics = skipDataMetrics
    this.#verbose = verbose
    this.#studentsInitializationFile = studentsInitializationFile
  }

  async process() {
    if (this.#verbose) {
      console.debug('Start process ...')
    }
    await this.#createDatabase()
    await this.#initStudents()
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

  async #initStudents() {
    if (this.#studentsInitializationFile) {
      if (this.#verbose) {
        console.debug('Initializing students ...')
      }
      if (!fs.existsSync(this.#studentsInitializationFile)) {
        throw new Error(`The students initialization file does not exist: ${this.#studentsInitializationFile}`)
      }
      await this.#processorDataService.initStudents(this.#studentsInitializationFile)
      if (this.#verbose) {
        console.debug('Students initialized.')
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
