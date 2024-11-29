import DatabaseConnection from './DatabaseConnection.js'

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
      FROM factHomework;
    `
    const result = await this.#db.get(query)
    return result.completionRate
  }

  async getOnTimeCompletionRate() {
    const query = `
      SELECT
        (SUM(CASE WHEN completed = 1 AND completionDuration < maxCompletionDuration THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) AS onTimeCompletionRate
      FROM factHomework
      WHERE completionDuration IS NOT null AND maxCompletionDuration IS NOT null;
    `
    const result = await this.#db.get(query)
    return result.onTimeCompletionRate
  }

  async getHomeworkLoadPerWeek() {
    const query = `
      SELECT
        assignedDate.date AS date,
        CONCAT(assignedDate.year, '-', assignedDate.week) AS week,
        COUNT(*) AS count
      FROM factHomework
      JOIN dimDates as assignedDate ON factHomework.assignedDateId = assignedDate.dateId
      GROUP BY assignedDate.year, assignedDate.week
      ORDER BY assignedDate.year, assignedDate.week;
    `
    const result = await this.#db.all(query)
    return result
  }

  async getHomeworkLoadPerDay() {
    const query = `
      SELECT
        STRFTIME('%Y-%m-%d', assignedDate.date) AS day,
        COUNT(*) AS count
      FROM factHomework
      JOIN dimDates as assignedDate ON factHomework.assignedDateId = assignedDate.dateId
      GROUP BY assignedDate.year, assignedDate.month, assignedDate.day
      ORDER BY date ASC;
    `
    const result = await this.#db.all(query)
    return result
  }

  async getHomeworkLoadPerWeekDay() {
    const query = `
      SELECT
        assignedDate.weekday AS weekday,
        COUNT(*) AS count
      FROM factHomework
      JOIN dimDates as assignedDate ON factHomework.assignedDateId = assignedDate.dateId
      GROUP BY assignedDate.weekday
      ORDER BY assignedDate.weekday;
    `
    const result = await this.#db.all(query)
    return result
  }

  async getHomeworkLoadPerSubject() {
    const query = `
      SELECT
        dimSubjects.subject,
        COUNT(*) AS count
      FROM factHomework
      JOIN dimSubjects ON factHomework.subjectId = dimSubjects.subjectId
      GROUP BY factHomework.subjectId
      ORDER BY count DESC;
    `
    const result = await this.#db.all(query)
    return result
  }

  async getCompletionPerSubject() {
    const query = `
      SELECT
        subject,
        (SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) AS completionRate
      FROM factHomework
      JOIN dimSubjects ON factHomework.subjectId = dimSubjects.subjectId
      GROUP BY factHomework.subjectId
      ORDER BY completionRate DESC;
    `
    const result = await this.#db.all(query)
    return result
  }

  async getAverageDurationPerSubjectGivenToExpected() {
    const query = `
      SELECT
        subject,
        AVG(maxCompletionDuration) AS averageDuration
      FROM factHomework
      JOIN dimSubjects ON factHomework.subjectId = dimSubjects.subjectId
      WHERE maxCompletionDuration IS NOT null
      GROUP BY factHomework.subjectId;
    `
    const result = await this.#db.all(query)
    return result
  }

  async getAverageDurationPerSubjectGivenToDone() {
    const query = `
      SELECT
        subject,
        AVG(completionDuration) AS averageDuration
      FROM factHomework
      JOIN dimSubjects ON factHomework.subjectId = dimSubjects.subjectId
      GROUP BY factHomework.subjectId;
    `
    const result = await this.#db.all(query)
    return result
  }

  async getHomeworksDuration() {
    const query = `
       SELECT
        row_number() OVER(ORDER BY factId) AS id,
        assignedDate.date AS assignedDate,
        completionDate.date AS completionDate,
        dueDate.date AS dueDate,
        completionState as completionState,
        dimSubjects.subject AS subject,
        factHomework.description
      FROM factHomework
      JOIN dimSubjects ON factHomework.subjectId = dimSubjects.subjectId
      JOIN dimDates as assignedDate ON factHomework.assignedDateId = assignedDate.dateId
      JOIN dimDates as dueDate ON factHomework.dueDateId = dueDate.dateId
      LEFT JOIN dimDates as completionDate ON factHomework.completedDateId = completionDate.dateId
      WHERE completionState != 3 -- state unknown
      ORDER BY completionDuration DESC;
    `
    const result = await this.#db.all(query)
    return result
  }
}
