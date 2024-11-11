import ProcessorDataService from '#pronote/Services/ProcessorDataService.js'
import ProcessorMetricsService from '#pronote/Services/ProcessorMetricsService.js'
import ProcessorNotificationsService from '#pronote/Services/ProcessorNotificationsService.js'
import {CronJob} from 'cron'
import PronoteRetrievalService from '../Services/PronoteRetrievalService.js'

export default class CronController {
  /** @type {PronoteRetrievalService} */
  #pronoteRetrievalService
  /** @type {ProcessorDataService} */
  #processorDataService
  /** @type {ProcessorMetricsService} */
  #processorMetricsService
  /** @type {ProcessorNotificationsService} */
  #processorNotificationsService
  #runOnInit
  #skipCron
  #skipPronoteDataRetrieval
  #skipDataProcess
  #skipDataMetrics
  #skipNotifications
  #debug
  #verbose

  constructor({
    pronoteRetrievalService,
    processorDataService,
    processorMetricsService,
    processorNotificationsService,
    runOnInit,
    skipCron,
    skipPronoteDataRetrieval,
    skipDataProcess,
    skipDataMetrics,
    skipNotifications,
    debug,
    verbose,
  }) {
    this.#pronoteRetrievalService = pronoteRetrievalService
    this.#processorDataService = processorDataService
    this.#processorMetricsService = processorMetricsService
    this.#processorNotificationsService = processorNotificationsService
    this.#runOnInit = runOnInit
    this.#skipCron = skipCron
    this.#skipPronoteDataRetrieval = skipPronoteDataRetrieval
    this.#skipDataProcess = skipDataProcess
    this.#skipDataMetrics = skipDataMetrics
    this.#skipNotifications = skipNotifications
    this.#debug = debug
    this.#verbose = verbose
  }

  setupCronJobs() {
    if (this.#skipCron) {
      if (this.#verbose) {
        console.debug('Cron jobs skipped, run programmed jobs immediately.')
      }
      this.mainCronTask()
    } else {
      // every hour between 9am and 6pm
      let cronTime = '0 9-18 * * *'
      if (this.#debug) {
        // every minute
        cronTime = '* * * * *'
      }
      console.log('Setting up cron job with cronTime: ', cronTime)
      CronJob.from({
        cronTime,
        onTick: this.mainCronTask.bind(this),
        start: true,
        timeZone: 'Europe/Paris',
      })

      if (this.#runOnInit) {
        setTimeout(() => {
          this.mainCronTask()
        }, 1000)
      }
    }
  }

  async mainCronTask() {
    if (this.#verbose) {
      console.debug('Start mainCronTask ...')
    }
    await this.#retrievePronoteData()
    await this.#processPronoteData()
    await this.#processDataMetrics()
    await this.#generateNotifications()
    if (this.#verbose) {
      console.debug('End mainCronTask ...')
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

  async #generateNotifications() {
    if (this.#skipNotifications) {
      if (this.#verbose) {
        console.debug('Notifications generation skipped.')
      }
      return
    }
    if (this.#verbose) {
      console.debug('Notifications generation ...')
    }
    await this.#processorNotificationsService.process()
    if (this.#verbose) {
      console.debug('Notifications generated.')
    }
  }
}
