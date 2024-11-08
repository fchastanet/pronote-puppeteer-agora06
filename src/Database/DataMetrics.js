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
        (SUM(CASE WHEN completed = 1 AND completion_duration < max_completion_duration THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) AS onTimeCompletionRate
      FROM fact_homework
      WHERE completion_duration IS NOT null AND max_completion_duration IS NOT null;
    `;
    const result = await this.#db.get(query);
    return result.onTimeCompletionRate;
  }

  async getHomeworkLoadPerWeek() {
    const query = `
      SELECT 
        assigned_date.date AS date,
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

  async getHomeworkLoadPerDay() {
    const query = `
      SELECT
        STRFTIME('%Y-%m-%d', assigned_date.date) AS day,
        COUNT(*) AS count
      FROM fact_homework
      JOIN dim_dates as assigned_date ON fact_homework.assigned_date_id = assigned_date.date_id
      GROUP BY assigned_date.year, assigned_date.month, assigned_date.day
      ORDER BY date ASC;
    `;
    const result = await this.#db.all(query);
    return result;
  }

  async getHomeworkLoadPerWeekDay() {
    const query = `
      SELECT
        assigned_date.weekday AS weekday,
        COUNT(*) AS count
      FROM fact_homework
      JOIN dim_dates as assigned_date ON fact_homework.assigned_date_id = assigned_date.date_id
      GROUP BY assigned_date.weekday
      ORDER BY assigned_date.weekday;
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
        AVG(max_completion_duration) AS averageDuration
      FROM fact_homework
      JOIN dim_subjects ON fact_homework.subject_id = dim_subjects.subject_id
      WHERE max_completion_duration IS NOT null
      GROUP BY fact_homework.subject_id;
    `;
    const result = await this.#db.all(query);
    return result;
  }

  async getAverageDurationPerSubjectGivenToDone() {
    const query = `
      SELECT 
        subject,
        AVG(completion_duration) AS averageDuration
      FROM fact_homework
      JOIN dim_subjects ON fact_homework.subject_id = dim_subjects.subject_id
      GROUP BY fact_homework.subject_id;
    `;
    const result = await this.#db.all(query);
    return result;
  }

  async getHomeworksDuration() {
    const query = `
       SELECT 
        row_number() OVER(ORDER BY fact_id) AS id,
        assignedDate.date AS assignedDate,
        completionDate.date AS completionDate,
        dueDate.date AS dueDate,
        completion_state as completionState,
        dim_subjects.subject AS subject,
        fact_homework.description
      FROM fact_homework
      JOIN dim_subjects ON fact_homework.subject_id = dim_subjects.subject_id
      JOIN dim_dates as assignedDate ON fact_homework.assigned_date_id = assignedDate.date_id
      JOIN dim_dates as dueDate ON fact_homework.due_date_id = dueDate.date_id
      LEFT JOIN dim_dates as completionDate ON fact_homework.completed_date_id = completionDate.date_id
      WHERE completion_state != 3 -- state unknown
      ORDER BY completion_duration DESC;
    `
    const result = await this.#db.all(query)
    return result
  }
}