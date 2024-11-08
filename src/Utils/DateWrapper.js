import 'dayjs/locale/fr.js'
import weekday from 'dayjs/plugin/weekday.js'
import weekOfYear from 'dayjs/plugin/weekOfYear.js' 
import customParseFormat from 'dayjs/plugin/customParseFormat.js'
import dayjs from 'dayjs'

dayjs.extend(weekday)
dayjs.extend(weekOfYear)
dayjs.extend(customParseFormat)
dayjs.locale('fr')

export default class DateWrapper {
  /** 
   * @type {dayjs} 
   */
  #date

  /**
   * @param {Date|dayjs|string} date 
   */
  constructor(date = null) {
    if (date === null) {
      this.#date = dayjs()
    } else if (dayjs.isDayjs(date)) {
      this.#date = date
    } else {
      this.#date = dayjs(date)
    }
    if (!this.#date.isValid()) {
      throw new Error(`Invalid date string: ${date}`)
    }
  }

  clone() {
    return new DateWrapper(this.#date.clone())
  }

  formatDate(format) {
    return this.#date.format(format)
  }

  formatFullDate() {
    return this.#date.format('YYYY-MM-DD HH:mm:ss')
  }

  getWeekOfTheYear() {
    return this.#date.week()
  }

  getWeekDay() {
    return this.#date.weekday()
  }

  getYear() {
    return this.#date.year()
  }

  getDayOfTheMonth() {
    return this.#date.date()
  }

  getMonth() {
    return this.#date.month() + 1
  }

  getHour() {
    return this.#date.hour()
  }

  getMinute() {
    return this.#date.minute()
  }

  getSecond() {
    return this.#date.second()
  }

  getMilliSecond() {
    return this.#date.millisecond()
  }

  toISOString() {
    return this.#date.toISOString()
  }

  getUnixTimestamp() {
    return this.#date.unix()
  }

  diff(date) {
    return this.#date.diff(date.#date)
  }

  isAfter(date) {
    return this.#date.isAfter(date.#date)
  }

  /**
   * Add a specified amount of time to the current date.
   * @param {number} value - The amount of time to add.
   * @param {string} unit - The unit of time (e.g., 'day', 'month', 'year').
   * @returns {DateWrapper} The updated DateWrapper instance.
   */
  add(value, unit) {
    this.#date = this.#date.add(value, unit)
    return this
  }

  /**
   * Parse a date string with the format "DD/MM/YYYY HH:mm:ss".
   * @param {string} dateString - The date string to parse.
   * @returns {Date} The parsed date object.
   */
  static parseDate(dateString) {
    const date = dayjs(dateString, ['DD/MM/YYYY HH:mm:ss', 'DD/MM/YYYY'])
    return new DateWrapper(date)
  }
}