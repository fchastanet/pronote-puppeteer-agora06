import DataWarehouse from '#pronote/Database/DataWarehouse.js'
import DataMetrics from '../Database/DataMetrics.js'
import dayjs from 'dayjs'

export default class ProcessorMetricsService {
  /** @type {DataMetrics} */
  #dataMetrics
  /** @type {DataWarehouse} */
  #dataWarehouse

  constructor(dataMetrics, dataWarehouse) {
    this.#dataMetrics = dataMetrics
    this.#dataWarehouse = dataWarehouse
  }

  dashboardFiltersConfig(userId) {
    const students = this.#dataWarehouse.getStudentsForUser(userId)
    const {minDate, maxDate} = this.#dataMetrics.getMinMaxDate(userId)
    let endDate = dayjs()
    if (dayjs(endDate).isAfter(maxDate)) {
      endDate = maxDate
    }
    let startDate = dayjs().subtract(1, 'month')
    if (dayjs(startDate).isBefore(minDate)) {
      startDate = minDate
    }

    return {
      students,
      minDate,
      maxDate,
      startDate: startDate.format('YYYY-MM-DD'),
      endDate: endDate.format('YYYY-MM-DD'),
    }
  }

  validateFilters(filters, userId) {
    const {startDate, endDate, students} = filters
    const decodedStartDate = dayjs(startDate)
    const decodedEndDate = dayjs(endDate)
    if (!decodedStartDate.isValid() || !decodedEndDate.isValid()) {
      throw new Error('Invalid date format')
    }
    if (decodedStartDate.isAfter(decodedEndDate)) {
      throw new Error('Invalid date range')
    }
    const minMaxDates = this.#dataMetrics.getMinMaxDate(userId)
    const minDate = dayjs(minMaxDates.minDate)
    const maxDate = dayjs(minMaxDates.maxDate)
    if (decodedStartDate.isBefore(minDate)) {
      throw new Error(`Start date cannot be before ${minDate.format('YYYY-MM-DD')}`)
    }
    if (decodedEndDate.isAfter(maxDate)) {
      throw new Error(`End date cannot be after ${maxDate.format('YYYY-MM-DD')}`)
    }
    const decodedStudents = JSON.parse(students)
    if (students !== 'ALL') {
      if (!Array.isArray(decodedStudents)) {
        throw new Error('Invalid students')
      }
      const availableStudentIds = this.#dataWarehouse.getStudentsForUser(userId)?.map((student) => student.id)
      for (const studentId of decodedStudents) {
        if (!availableStudentIds.includes(studentId)) {
          throw new Error(`Invalid student: ${studentId}`)
        }
      }
    }
    return {
      startDate: decodedStartDate.format('YYYY-MM-DD'),
      endDate: decodedEndDate.format('YYYY-MM-DD'),
      students: students === 'ALL' ? 'ALL' : decodedStudents,
    }
  }

  async process(filters) {
    const completionRate = this.#dataMetrics.getCompletionRate(filters)
    const onTimeCompletionRate = this.#dataMetrics.getOnTimeCompletionRate(filters)
    const homeworkLoadPerWeek = this.#dataMetrics.getHomeworkLoadPerWeek(filters)
    const homeworkLoadPerDay = this.#dataMetrics.getHomeworkLoadPerDay(filters)
    const homeworkLoadPerWeekDay = this.#dataMetrics.getHomeworkLoadPerWeekDay(filters)
    const homeworkLoadPerSubject = this.#dataMetrics.getHomeworkLoadPerSubject(filters)
    const completionPerSubject = this.#dataMetrics.getCompletionPerSubject(filters)
    const averageDurationPerSubjectGivenToExpected = this.#dataMetrics.getAverageDurationPerSubjectGivenToExpected(filters)
    const averageDurationPerSubjectGivenToDone = this.#dataMetrics.getAverageDurationPerSubjectGivenToDone(filters)
    const homeworksDuration = this.#dataMetrics.getHomeworksDuration(filters)

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
    }

    return new Promise((resolve) => resolve(metrics))
  }
}
