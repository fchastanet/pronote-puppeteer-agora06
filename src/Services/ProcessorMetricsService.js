import DataMetrics from '../Database/DataMetrics.js'
import path from 'path'
import fs from 'fs'

export default class ProcessorMetricsService {
  /** @type {DataMetrics} */
  #db
  #publicDir
  #verbose
  #debug
  
  constructor(db, publicDir, debug = false, verbose = false) {
    this.#db = db
    this.#publicDir = publicDir
    this.#debug = debug
    this.#verbose = verbose
  }

  async process() {
    const completionRate = await this.#db.getCompletionRate();
    const onTimeCompletionRate = await this.#db.getOnTimeCompletionRate();
    const homeworkLoadPerWeek = await this.#db.getHomeworkLoadPerWeek();
    const homeworkLoadPerDay = await this.#db.getHomeworkLoadPerDay();
    const homeworkLoadPerWeekDay = await this.#db.getHomeworkLoadPerWeekDay();
    const homeworkLoadPerSubject = await this.#db.getHomeworkLoadPerSubject();
    const completionPerSubject = await this.#db.getCompletionPerSubject();
    const averageDurationPerSubjectGivenToExpected = await this.#db.getAverageDurationPerSubjectGivenToExpected();
    const averageDurationPerSubjectGivenToDone = await this.#db.getAverageDurationPerSubjectGivenToDone();
    const homeworksDuration = await this.#db.getHomeworksDuration()

    const metrics = {
      completionRate,
      onTimeCompletionRate,
      homeworkLoadPerWeek,
      homeworkLoadPerDay,
      homeworkLoadPerWeekDay,
      homeworkLoadPerSubject,
      completionPerSubject,
      averageDurationPerSubjectGivenToExpected,
      averageDurationPerSubjectGivenToDone,
      homeworksDuration,
    };
    this.save(metrics)

    return new Promise((resolve) => resolve(metrics))
  }

  save(metrics) {
    const jsonString = JSON.stringify(metrics, null, 2).replace(/\00/g,'')
    const targetFile = path.join(this.#publicDir, 'metrics.json')
    if (this.#verbose) {
      console.debug(`Writing metrics to '${targetFile}'.`)
    }
    if (this.#debug) {
      console.debug(`Metrics: ${jsonString}`)
    }
    try {
      fs.writeFileSync(
        targetFile, 
        jsonString, 
        {encoding: 'utf8'}
      )
    } catch (err) {
      console.error(err);
      throw err;
    } 
    console.log(`Metrics written into '${targetFile}'`);
  }
}