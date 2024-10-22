import Database from "#pronote/Database/Database.js";

export default class DataProcessor {
  /** @var {Database} db */
  db
  constructor(db) {
    this.db = db
  }

  process() {
    try {
      this.db.createSchema()
      this.db.insertStudent("test")
      console.log(this.db.getStudent("test"))
    } catch (error) {
      console.error('Unable to connect to the database:', error)
    } finally {
      this.db.close()
    }
  }
}
