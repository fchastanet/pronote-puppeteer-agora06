import Logger from '#pronote/Services/Logger.js'
import {default as SqliteDatabase} from 'better-sqlite3'

export default class DatabaseConnection {
  /** @type {SqliteDatabase} */
  #db = null
  #dbClosed = true
  /** @type {Logger} */
  #logger
  #databaseFile

  constructor({databaseFile, logger}) {
    this.#databaseFile = databaseFile
    this.#logger = logger
  }

  open() {
    const opts = {}
    if (this.#logger.debugMode) {
      opts.verbose = this.#logger.log
    }
    this.#db = new SqliteDatabase(this.#databaseFile, opts)
    this.#db.pragma('journal_mode = WAL') // it is generally important to set the WAL pragma for performance reasons.
    this.#dbClosed = false
    this.#logger.info(`Opening database connection to ${this.#databaseFile}`)
  }

  close() {
    if (this.#db) {
      this.#db.close()
      this.#dbClosed = true
    }
  }

  get(query, ...params) {
    if (this.#dbClosed) {
      this.open()
    }
    return this.#db.prepare(query).get(params)
  }

  all(query, ...params) {
    if (this.#dbClosed) {
      this.open()
    }
    return this.#db.prepare(query).all(params)
  }

  run(query, ...params) {
    if (this.#dbClosed) {
      this.open()
    }
    return this.#db.prepare(query).run(params)
  }

  transaction(fn) {
    if (this.#dbClosed) {
      this.open()
    }
    return this.#db.transaction(fn)()
  }

  prepare(query) {
    if (this.#dbClosed) {
      this.open()
    }
    return this.#db.prepare(query)
  }

  exec(query) {
    if (this.#dbClosed) {
      this.open()
    }
    return this.#db.exec(query)
  }
}
