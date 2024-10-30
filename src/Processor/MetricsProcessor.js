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
    const averageDuration = await this.#db.getAverageDuration();
    const homeworkLoadPerWeek = await this.#db.getHomeworkLoadPerWeek();
    const homeworkLoadPerSubject = await this.#db.getHomeworkLoadPerSubject();
    const completionPerSubject = await this.#db.getCompletionPerSubject();

    const metrics = {
      completionRate,
      onTimeCompletionRate,
      averageDuration,
      homeworkLoadPerWeek,
      homeworkLoadPerSubject,
      completionPerSubject
    };

    if (this.#verbose) {
      console.log('MetricsProcessor process done', metrics);
    }

    return metrics
  }
}