import { default as SqliteDatabase} from 'better-sqlite3'

export default class DatabaseConnection {
  #db

  constructor(databaseFile, debug) {
    const opts = {}
    if (debug) {
      opts.verbose = console.log
    }
    
    this.#db = new SqliteDatabase(databaseFile, opts)
    this.#db.pragma('journal_mode = WAL') // it is generally important to set the WAL pragma for performance reasons.
  }

  close() {
    if (this.#db) {
      this.#db.close()
    }
  }

  get(query, ...params) {
    return this.#db.prepare(query).get(params)
  }

  all(query, ...params) {
    return this.#db.prepare(query).all(params)
  }

  run(query, ...params) {
    return this.#db.prepare(query).run(params)
  }

  transaction(fn) {
    return this.#db.transaction(fn)()
  }

  prepare(query) {
    return this.#db.prepare(query)
  }

  exec(query) {
    return this.#db.exec(query)
  }


}