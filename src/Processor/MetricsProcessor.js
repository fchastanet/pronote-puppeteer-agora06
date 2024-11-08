import DataMetrics from '../Database/DataMetrics.js'

export default class MetricsProcessor {
  
  /**
   * @type {DataMetrics}
   * @private
  */
 #db
 #verbose
  
  constructor(db, verbose = false) {
    this.#db = db
    this.#verbose = verbose
  }

  async process() {
    if (this.#verbose) {
      console.log('MetricsProcessor process');
    }

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

    if (this.#verbose) {
      console.log('MetricsProcessor process done', metrics);
    }

    return metrics
  }
}