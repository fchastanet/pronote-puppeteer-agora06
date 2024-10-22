import { default as SqliteDatabase} from 'better-sqlite3'

export default class Database {
  db = null

  async init(databaseFile) {
    this.db = new SqliteDatabase(databaseFile, { verbose: console.log })
    this.db.pragma('journal_mode = WAL') // it is generally important to set the WAL pragma for performance reasons.
  }

  close() {
    if (this.db) {
      this.db.close()
    }
  }

  createSchema() {
    let stmt = this.db.prepare(`
      CREATE TABLE IF NOT EXISTS student ( 
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        name VARCHAR(50),
        school VARCHAR(50),
        grade VARCHAR(50)
      )
    `)
    stmt.run()
  }

  insertStudent(name, school, grade) {
    let stmt = this.db.prepare('INSERT INTO student(name, school, grade) VALUES (?, ?, ?)')
    stmt.run(name, school, grade)
  }

  getStudent(name) {
    let stmt = this.db.prepare('SELECT * FROM student WHERE name=?')
    return stmt.get(name)
  }


}