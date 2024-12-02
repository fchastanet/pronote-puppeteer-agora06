import ProcessorDataService from '#pronote/Services/ProcessorDataService.js'
import fs from 'fs'
import PronoteRetrievalService from '../Services/PronoteRetrievalService.js'
import Logger from '#pronote/Services/Logger.js'

export default class ProcessController {
  /** @type {PronoteRetrievalService} */
  #pronoteRetrievalService
  /** @type {ProcessorDataService} */
  #processorDataService
  /** @type {Logger} */
  #logger
  #skipPronoteDataRetrieval
  #skipDataProcess
  #verbose
  #studentsInitializationFile

  constructor({
    pronoteRetrievalService,
    processorDataService,
    skipPronoteDataRetrieval,
    skipDataProcess,
    verbose,
    studentsInitializationFile,
    logger
  }) {
    this.#pronoteRetrievalService = pronoteRetrievalService
    this.#processorDataService = processorDataService
    this.#skipPronoteDataRetrieval = skipPronoteDataRetrieval
    this.#skipDataProcess = skipDataProcess
    this.#verbose = verbose
    this.#studentsInitializationFile = studentsInitializationFile
    this.#logger = logger
  }

  setProcessId(processId) {
    this.#logger.setProcessId(processId)
  }

  setDebug(debug) {
    this.#pronoteRetrievalService.setDebug(debug)
  }

  async process() {
    this.#logger.info('Start process ...')
    await this.#createDatabase()
    await this.#initStudents()
    await this.#retrievePronoteData()
    await this.#processPronoteData()
    this.#logger.info('End process ...')
  }

  async #createDatabase() {
    this.#logger.debug('Creating database ...')
    await this.#processorDataService.createDatabase()
    this.#logger.debug('Database created.')
  }

  async #initStudents() {
    if (this.#studentsInitializationFile) {
      this.#logger.debug('Initializing students ...')
      if (!fs.existsSync(this.#studentsInitializationFile)) {
        throw new Error(`The students initialization file does not exist: ${this.#studentsInitializationFile}`)
      }
      await this.#processorDataService.initStudents(this.#studentsInitializationFile)
      this.#logger.debug('Students initialized.')
    }
  }

  async #retrievePronoteData() {
    if (this.#skipPronoteDataRetrieval) {
      this.#logger.debug('Pronote data retrieval skipped.')
      return
    }
    this.#logger.debug('Retrieving Pronote data ...')
    await this.#pronoteRetrievalService.process()
    this.#logger.debug('Pronote data retrieved')
  }

  async #processPronoteData() {
    if (this.#skipDataProcess) {
      this.#logger.debug('Pronote data processing skipped.')
      return
    }
    this.#logger.debug('Pronote data warehouse processing ...')
    await this.#processorDataService.process()
    this.#logger.debug('Pronote data warehouse processed.')
  }

  getLogs(processId, format = 'json') {
    return this.#logger.getLogs(processId, format)
  }
}
