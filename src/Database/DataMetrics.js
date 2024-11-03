import DatabaseConnection from './DatabaseConnection.js';

export default class DataMetrics {
  /**
   * @type {DatabaseConnection}
   */
  #db = null

  constructor(databaseConnection) {
    this.#db = databaseConnection
  }

  async getCompletionRate() {
    const query = `
      SELECT 
        (SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) AS completionRate
      FROM fact_homework;
    `;
    const result = await this.#db.get(query);
    return result.completionRate;
  }

  async getOnTimeCompletionRate() {
    const query = `
      SELECT 
        (SUM(CASE WHEN completed = 1 AND due_date.unix_timestamp >= assigned_date.unix_timestamp THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) AS onTimeCompletionRate
      FROM fact_homework
      JOIN dim_dates AS due_date ON fact_homework.due_date_id = due_date.date_id
      JOIN dim_dates AS assigned_date ON fact_homework.assigned_date_id = assigned_date.date_id;
    `;
    const result = await this.#db.get(query);
    return result.onTimeCompletionRate;
  }

  async getAverageDuration() {
    const query = `
      SELECT 
        AVG(duration) AS averageDuration
      FROM fact_homework;
    `;
    const result = await this.#db.get(query);
      return result.averageDuration;
  }

  async getHomeworkLoadPerWeek() {
    const query = `
      SELECT 
        CONCAT(assigned_date.year, '-', assigned_date.week) AS week,
        COUNT(*) AS count
      FROM fact_homework
      JOIN dim_dates as assigned_date ON fact_homework.assigned_date_id = assigned_date.date_id
      GROUP BY assigned_date.year, assigned_date.week
      ORDER BY assigned_date.year, assigned_date.week;
    `;
    const result = await this.#db.all(query);
    return result;
  }

  async getHomeworkLoadPerSubject() {
    const query = `
      SELECT 
        dim_subjects.subject,
        COUNT(*) AS count
      FROM fact_homework
      JOIN dim_subjects ON fact_homework.subject_id = dim_subjects.subject_id
      GROUP BY fact_homework.subject_id
      ORDER BY count DESC;
    `;
    const result = await this.#db.all(query);
    return result;
  }

  async getCompletionPerSubject() {
    const query = `
      SELECT 
        subject,
        (SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) AS completionRate
      FROM fact_homework
      JOIN dim_subjects ON fact_homework.subject_id = dim_subjects.subject_id
      GROUP BY fact_homework.subject_id
      ORDER BY completionRate DESC;
    `;
    const result = await this.#db.all(query);
    return result;
  }

  async getAverageDurationPerSubjectGivenToExpected() {
    const query = `
      SELECT 
        subject,
        AVG(due_date.unix_timestamp - assigned_date.unix_timestamp) AS averageDuration
      FROM fact_homework
      JOIN dim_subjects ON fact_homework.subject_id = dim_subjects.subject_id
      JOIN dim_dates AS due_date ON fact_homework.due_date_id = due_date.date_id
      JOIN dim_dates AS assigned_date ON fact_homework.assigned_date_id = assigned_date.date_id
      GROUP BY fact_homework.subject_id;
    `;
    const result = await this.#db.all(query);
    return result;
  }

  async getAverageDurationPerSubjectGivenToDone() {
    const query = `
      SELECT 
        subject,
        AVG(completed_date.unix_timestamp - assigned_date.unix_timestamp) AS averageDuration
      FROM fact_homework
      JOIN dim_subjects ON fact_homework.subject_id = dim_subjects.subject_id
      JOIN dim_dates AS completed_date ON fact_homework.completed_date_id = completed_date.date_id
      JOIN dim_dates AS assigned_date ON fact_homework.assigned_date_id = assigned_date.date_id
      WHERE completed = 1
      GROUP BY fact_homework.subject_id;
    `;
    const result = await this.#db.all(query);
    return result;
  }
}