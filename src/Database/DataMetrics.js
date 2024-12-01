import DatabaseConnection from './DatabaseConnection.js'

export default class DataMetrics {
  /**
   * @type {DatabaseConnection}
   */
  #db = null

  constructor(databaseConnection) {
    this.#db = databaseConnection
  }

  getMinMaxDate(userId) {
    const query = `
      SELECT MIN(assignedDate.date) AS minDate, MAX(dueDate.date) AS maxDate
      FROM factHomework
      JOIN userStudentsLink ON factHomework.studentId = userStudentsLink.studentId
      JOIN dimDates as assignedDate ON factHomework.assignedDateId = assignedDate.dateId
      JOIN dimDates as dueDate ON factHomework.dueDateId = dueDate.dateId
      WHERE userStudentsLink.userId = ?
    `
    const params = [userId]

    const stmt = this.#db.prepare(query)
    return stmt.all(...params)?.[0]
  }

  getCompletionRate(filters) {
    const {startDate, endDate, students} = filters
    let query = `
      SELECT
        (SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) AS completionRate
      FROM factHomework
      JOIN dimDates as assignedDate ON factHomework.assignedDateId = assignedDate.dateId
      WHERE 1=1
    `
    const params = []

    if (startDate) {
      query += ' AND assignedDate.date >= ?'
      params.push(startDate)
    }
    if (endDate) {
      query += ' AND assignedDate.date <= ?'
      params.push(endDate)
    }
    if (students && students !== 'ALL') {
      query += ' AND factHomework.studentId IN (' + students.map(() => '?').join(',') + ')'
      params.push(...students)
    }

    const result = this.#db.get(query, ...params)
    return result.completionRate
  }

  getOnTimeCompletionRate(filters) {
    const {startDate, endDate, students} = filters
    let query = `
      SELECT
        (SUM(CASE WHEN completed = 1 AND completionDuration < maxCompletionDuration THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) AS onTimeCompletionRate
      FROM factHomework
      JOIN dimDates as assignedDate ON factHomework.assignedDateId = assignedDate.dateId
      WHERE completionDuration IS NOT null AND maxCompletionDuration IS NOT null
    `
    const params = []

    if (startDate) {
      query += ' AND assignedDate.date >= ?'
      params.push(startDate)
    }
    if (endDate) {
      query += ' AND assignedDate.date <= ?'
      params.push(endDate)
    }
    if (students && students !== 'ALL') {
      query += ' AND factHomework.studentId IN (' + students.map(() => '?').join(',') + ')'
      params.push(...students)
    }

    const result = this.#db.get(query, ...params)
    return result.onTimeCompletionRate
  }

  getHomeworkLoadPerWeek(filters) {
    const {startDate, endDate, students} = filters
    let query = `
      SELECT
        assignedDate.date AS date,
        CONCAT(assignedDate.year, '-', assignedDate.week) AS week,
        COUNT(*) AS count
      FROM factHomework
      JOIN dimDates as assignedDate ON factHomework.assignedDateId = assignedDate.dateId
      WHERE 1=1
    `
    const params = []

    if (startDate) {
      query += ' AND assignedDate.date >= ?'
      params.push(startDate)
    }
    if (endDate) {
      query += ' AND assignedDate.date <= ?'
      params.push(endDate)
    }
    if (students && students !== 'ALL') {
      query += ' AND factHomework.studentId IN (' + students.map(() => '?').join(',') + ')'
      params.push(...students)
    }

    query += `
      GROUP BY assignedDate.year, assignedDate.week
      ORDER BY assignedDate.year, assignedDate.week
    `

    const result = this.#db.all(query, ...params)
    return result
  }

  getHomeworkLoadPerDay(filters) {
    const {startDate, endDate, students} = filters
    let query = `
      SELECT
        STRFTIME('%Y-%m-%d', assignedDate.date) AS day,
        COUNT(*) AS count
      FROM factHomework
      JOIN dimDates as assignedDate ON factHomework.assignedDateId = assignedDate.dateId
      WHERE 1=1
    `
    const params = []

    if (startDate) {
      query += ' AND assignedDate.date >= ?'
      params.push(startDate)
    }
    if (endDate) {
      query += ' AND assignedDate.date <= ?'
      params.push(endDate)
    }
    if (students && students !== 'ALL') {
      query += ' AND factHomework.studentId IN (' + students.map(() => '?').join(',') + ')'
      params.push(...students)
    }

    query += `
      GROUP BY assignedDate.year, assignedDate.month, assignedDate.day
      ORDER BY date ASC
    `

    const result = this.#db.all(query, ...params)
    return result
  }

  getHomeworkLoadPerWeekDay(filters) {
    const {startDate, endDate, students} = filters
    let query = `
      SELECT
        assignedDate.weekday AS weekday,
        COUNT(*) AS count
      FROM factHomework
      JOIN dimDates as assignedDate ON factHomework.assignedDateId = assignedDate.dateId
      WHERE 1=1
    `
    const params = []

    if (startDate) {
      query += ' AND assignedDate.date >= ?'
      params.push(startDate)
    }
    if (endDate) {
      query += ' AND assignedDate.date <= ?'
      params.push(endDate)
    }
    if (students && students !== 'ALL') {
      query += ' AND factHomework.studentId IN (' + students.map(() => '?').join(',') + ')'
      params.push(...students)
    }

    query += `
      GROUP BY assignedDate.weekday
      ORDER BY assignedDate.weekday
    `

    const result = this.#db.all(query, ...params)
    return result
  }

  getHomeworkLoadPerSubject(filters) {
    const {startDate, endDate, students} = filters
    let query = `
      SELECT
        dimSubjects.subject,
        COUNT(*) AS count
      FROM factHomework
      JOIN dimSubjects ON factHomework.subjectId = dimSubjects.subjectId
      JOIN dimDates as assignedDate ON factHomework.assignedDateId = assignedDate.dateId
      WHERE 1=1
    `
    const params = []

    if (startDate) {
      query += ' AND assignedDate.date >= ?'
      params.push(startDate)
    }
    if (endDate) {
      query += ' AND assignedDate.date <= ?'
      params.push(endDate)
    }
    if (students && students !== 'ALL') {
      query += ' AND factHomework.studentId IN (' + students.map(() => '?').join(',') + ')'
      params.push(...students)
    }

    query += `
      GROUP BY factHomework.subjectId
      ORDER BY count DESC
    `

    const result = this.#db.all(query, ...params)
    return result
  }

  getCompletionPerSubject(filters) {
    const {startDate, endDate, students} = filters
    let query = `
      SELECT
        subject,
        (SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) AS completionRate
      FROM factHomework
      JOIN dimSubjects ON factHomework.subjectId = dimSubjects.subjectId
      JOIN dimDates as assignedDate ON factHomework.assignedDateId = assignedDate.dateId
      WHERE 1=1
    `
    const params = []

    if (startDate) {
      query += ' AND assignedDate.date >= ?'
      params.push(startDate)
    }
    if (endDate) {
      query += ' AND assignedDate.date <= ?'
      params.push(endDate)
    }
    if (students && students !== 'ALL') {
      query += ' AND factHomework.studentId IN (' + students.map(() => '?').join(',') + ')'
      params.push(...students)
    }

    query += `
      GROUP BY factHomework.subjectId
      ORDER BY completionRate DESC
    `

    const result = this.#db.all(query, ...params)
    return result
  }

  getAverageDurationPerSubjectGivenToExpected(filters) {
    const {startDate, endDate, students} = filters
    let query = `
      SELECT
        subject,
        AVG(maxCompletionDuration) AS averageDuration
      FROM factHomework
      JOIN dimSubjects ON factHomework.subjectId = dimSubjects.subjectId
      JOIN dimDates as assignedDate ON factHomework.assignedDateId = assignedDate.dateId
      WHERE maxCompletionDuration IS NOT null
    `
    const params = []

    if (startDate) {
      query += ' AND assignedDate.date >= ?'
      params.push(startDate)
    }
    if (endDate) {
      query += ' AND assignedDate.date <= ?'
      params.push(endDate)
    }
    if (students && students !== 'ALL') {
      query += ' AND factHomework.studentId IN (' + students.map(() => '?').join(',') + ')'
      params.push(...students)
    }

    query += `
      GROUP BY factHomework.subjectId
    `

    const result = this.#db.all(query, ...params)
    return result
  }

  getAverageDurationPerSubjectGivenToDone(filters) {
    const {startDate, endDate, students} = filters
    let query = `
      SELECT
        subject,
        AVG(completionDuration) AS averageDuration
      FROM factHomework
      JOIN dimSubjects ON factHomework.subjectId = dimSubjects.subjectId
      JOIN dimDates as assignedDate ON factHomework.assignedDateId = assignedDate.dateId
      WHERE 1=1
    `
    const params = []

    if (startDate) {
      query += ' AND assignedDate.date >= ?'
      params.push(startDate)
    }
    if (endDate) {
      query += ' AND assignedDate.date <= ?'
      params.push(endDate)
    }
    if (students && students !== 'ALL') {
      query += ' AND factHomework.studentId IN (' + students.map(() => '?').join(',') + ')'
      params.push(...students)
    }

    query += `
      GROUP BY factHomework.subjectId
    `

    const result = this.#db.all(query, ...params)
    return result
  }

  getHomeworksDuration(filters) {
    const {startDate, endDate, students} = filters
    let query = `
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
    `
    const params = []

    if (startDate) {
      query += ' AND assignedDate.date >= ?'
      params.push(startDate)
    }
    if (endDate) {
      query += ' AND assignedDate.date <= ?'
      params.push(endDate)
    }
    if (students && students !== 'ALL') {
      query += ' AND factHomework.studentId IN (' + students.map(() => '?').join(',') + ')'
      params.push(...students)
    }

    query += `
      ORDER BY completionDuration DESC
    `

    const result = this.#db.all(query, ...params)
    return result
  }
}
