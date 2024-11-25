import DateWrapper from '#pronote/Utils/DateWrapper.js'
import DatabaseConnection from './DatabaseConnection.js'

export default class DataWarehouse {
  static FILE_PROCESSING_STATUS_WAITING = 0
  static FILE_PROCESSING_STATUS_PROCESSED = 1
  static FILE_PROCESSING_STATUS_ERROR = 0

  static COMPLETION_STATE_IN_PROGRESS = 0
  static COMPLETION_STATE_COMPLETED = 1
  static COMPLETION_STATE_OVER_DUE = 2
  static COMPLETION_STATE_UNKNOWN = 3

  static NOTIFICATION_STATE_WAITING = 0
  static NOTIFICATION_STATE_SENT = 1
  static NOTIFICATION_STATE_RATE_LIMIT = 2
  static NOTIFICATION_STATE_ERROR = 3

  static USER_ROLE_ADMIN = 'admin'
  static USER_ROLE_USER = 'user'

  /**
   * @type {DatabaseConnection}
   */
  #db = null

  constructor(databaseConnection) {
    this.#db = databaseConnection
  }

  createSchema() {
    const createDimStudentsTable = `
      CREATE TABLE IF NOT EXISTS dim_students (
        student_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(50)
      );
      CREATE INDEX IF NOT EXISTS idx_students_name ON dim_students(name);
    `
    const createDimSchoolsTable = `
      CREATE TABLE IF NOT EXISTS dim_schools (
        school_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(50)
      );
      CREATE INDEX IF NOT EXISTS idx_schools_name ON dim_schools(name);
    `
    const createDimGradesTable = `
      CREATE TABLE IF NOT EXISTS dim_grades (
        grade_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(50)
      );
      CREATE INDEX IF NOT EXISTS idx_grades_name ON dim_grades(name);
    `
    const createDimSubjectsTable = `
      CREATE TABLE IF NOT EXISTS dim_subjects (
        subject_id INTEGER PRIMARY KEY AUTOINCREMENT,
        subject TEXT,
        backgroundColor TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_courses_subject ON dim_subjects(subject);
    `
    const createDimTeachersTable = `
      CREATE TABLE IF NOT EXISTS dim_teachers (
        teacher_id INTEGER PRIMARY KEY AUTOINCREMENT,
        subject_id INTEGER,
        name VARCHAR(50),
        FOREIGN KEY (subject_id) REFERENCES dim_subjects(subject_id)
      );
      CREATE INDEX IF NOT EXISTS idx_teachers_name ON dim_teachers(name);
    `
    const createDimDatesTable = `
      CREATE TABLE IF NOT EXISTS dim_dates (
        date_id INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATETIME,
        year INTEGER,
        month INTEGER,
        week INTEGER,
        weekday INTEGER,
        day INTEGER,
        hour INTEGER,
        minute INTEGER,
        second INTEGER,
        millisecond INTEGER,
        unix_timestamp INTEGER
      );
      CREATE INDEX IF NOT EXISTS idx_dates_date ON dim_dates(date);
      CREATE INDEX IF NOT EXISTS idx_dates_year_month_week_day ON dim_dates(year, month, week, weekday, day);
    `
    const createFactCoursesTable = `
      CREATE TABLE IF NOT EXISTS fact_courses (
        fact_id INTEGER PRIMARY KEY AUTOINCREMENT,
        fact_key TEXT,
        subject_id INTEGER,
        student_id INTEGER,
        school_id INTEGER,
        grade_id INTEGER,
        teacher_id INTEGER,
        start_date_id INTEGER,
        end_date_id INTEGER,
        homework_date_id INTEGER,
        content_list TEXT,
        locked INTEGER,
        -- update fields
        checksum TEXT,
        update_count INTEGER DEFAULT 1,
        update_first_date_id INTEGER,
        update_last_date_id INTEGER,
        update_files TEXT,
        FOREIGN KEY (subject_id) REFERENCES dim_subjects(subject_id),
        FOREIGN KEY (student_id) REFERENCES dim_students(student_id),
        FOREIGN KEY (school_id) REFERENCES dim_schools(school_id),
        FOREIGN KEY (grade_id) REFERENCES dim_grades(grade_id),
        FOREIGN KEY (teacher_id) REFERENCES dim_teachers(teacher_id),
        FOREIGN KEY (start_date_id) REFERENCES dim_dates(date_id),
        FOREIGN KEY (end_date_id) REFERENCES dim_dates(date_id),
        FOREIGN KEY (homework_date_id) REFERENCES dim_dates(date_id)
        FOREIGN KEY (update_first_date_id) REFERENCES dim_dates(date_id),
        FOREIGN KEY (update_last_date_id) REFERENCES dim_dates(date_id)
      );
      CREATE INDEX IF NOT EXISTS idx_fact_courses_id ON fact_courses(fact_key);
      CREATE INDEX IF NOT EXISTS idx_fact_courses_subject_id ON fact_courses(subject_id);
      CREATE INDEX IF NOT EXISTS idx_fact_courses_student_id ON fact_courses(student_id);
      CREATE INDEX IF NOT EXISTS idx_fact_courses_school_id ON fact_courses(school_id);
      CREATE INDEX IF NOT EXISTS idx_fact_courses_grade_id ON fact_courses(grade_id);
      CREATE INDEX IF NOT EXISTS idx_fact_courses_teacher_id ON fact_courses(teacher_id);
      CREATE INDEX IF NOT EXISTS idx_fact_courses_start_date_id ON fact_courses(start_date_id);
      CREATE INDEX IF NOT EXISTS idx_fact_courses_end_date_id ON fact_courses(end_date_id);
      CREATE INDEX IF NOT EXISTS idx_fact_courses_update_first_date_id ON fact_courses(update_first_date_id);
      CREATE INDEX IF NOT EXISTS idx_fact_courses_update_last_date_id ON fact_courses(update_last_date_id);
      CREATE INDEX IF NOT EXISTS idx_fact_courses_homework_date_id ON fact_courses(homework_date_id);
    `

    const createFactHomeworkTable = `
      CREATE TABLE IF NOT EXISTS fact_homework (
        fact_id INTEGER PRIMARY KEY AUTOINCREMENT,
        fact_key TEXT,
        student_id INTEGER,             -- FK dim_students
        school_id INTEGER,              -- FK dim_schools
        grade_id INTEGER,               -- FK dim_grades
        fact_course_id INTEGER,         -- FK fact_courses
        subject_id INTEGER,             -- FK dim_subjects
        due_date_id INTEGER,            -- FK dim_dates
        assigned_date_id INTEGER,       -- FK dim_dates
        completed INTEGER,              -- boolean
        completed_date_id INTEGER,      -- FK dim_dates
        completion_duration INTEGER,
        completion_state INTEGER,       -- 3 possible states
        max_completion_duration INTEGER,
        description TEXT,
        formatted INTEGER,              -- boolean
        requires_submission INTEGER,    -- boolean
        submission_type TEXT,           -- enum
        difficulty_level INTEGER,       -- enum
        background_color TEXT,
        public_name TEXT,
        themes TEXT,                    -- Storing as JSON string or comma-separated values
        attachments TEXT,               -- Storing as JSON string or comma-separated values
        -- update fields
        checksum TEXT,
        notification_checksum TEXT,
        update_count INTEGER DEFAULT 1,
        update_first_date_id INTEGER,   -- FK dim_dates
        update_last_date_id INTEGER,    -- FK dim_dates
        update_files TEXT,
        temporary INTEGER DEFAULT 1,    -- boolean
        json TEXT,
        notification_state INTEGER DEFAULT 0,  -- boolean
        notification_state_date_id INTEGER,    -- FK dim_dates
        FOREIGN KEY (student_id) REFERENCES dim_students(student_id),
        FOREIGN KEY (school_id) REFERENCES dim_schools(school_id),
        FOREIGN KEY (grade_id) REFERENCES dim_grades(grade_id),
        FOREIGN KEY (fact_course_id) REFERENCES fact_courses(fact_id),
        FOREIGN KEY (subject_id) REFERENCES dim_subjects(subject_id),
        FOREIGN KEY (due_date_id) REFERENCES dim_dates(date_id),
        FOREIGN KEY (assigned_date_id) REFERENCES dim_dates(date_id),
        FOREIGN KEY (completed_date_id) REFERENCES dim_dates(date_id),
        FOREIGN KEY (update_first_date_id) REFERENCES dim_dates(date_id),
        FOREIGN KEY (update_last_date_id) REFERENCES dim_dates(date_id),
        FOREIGN KEY (notification_state_date_id) REFERENCES dim_dates(date_id)
      );

      CREATE INDEX IF NOT EXISTS idx_fact_homework_fact_key ON fact_homework(fact_key);
      CREATE INDEX IF NOT EXISTS idx_fact_homework_subject_id ON fact_homework(subject_id);
      CREATE INDEX IF NOT EXISTS idx_fact_homework_student_id ON fact_courses(student_id);
      CREATE INDEX IF NOT EXISTS idx_fact_homework_school_id ON fact_courses(school_id);
      CREATE INDEX IF NOT EXISTS idx_fact_homework_grade_id ON fact_courses(grade_id);
      CREATE INDEX IF NOT EXISTS idx_fact_homework_due_date_id ON fact_homework(due_date_id);
      CREATE INDEX IF NOT EXISTS idx_fact_homework_assigned_date_id ON fact_homework(assigned_date_id);
    `

    const createProcessedFilesTable = `
      CREATE TABLE IF NOT EXISTS processed_files (
        file_id TEXT PRIMARY KEY,
        processing_status INTEGER DEFAULT 0  -- enum (0: not processed, 1: processed, 2: error)
      );
    `

    const createPushSubscriptionsTable = `
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        subscription_id INTEGER PRIMARY KEY AUTOINCREMENT,
        endpoint TEXT,
        auth TEXT,
        p256dh TEXT,
        expiration_time DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `

    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        firstName TEXT,
        lastName TEXT,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

      INSERT OR IGNORE INTO users (
        email, password, firstName, lastName, role
      ) VALUES (
        'admin', 'admin', 'admin', '', 'admin'
      );
    `

    const createPronoteAccountsTable = `
      CREATE TABLE IF NOT EXISTS user_pronote_accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cas_url TEXT,
        pronote_login TEXT NOT NULL,
        pronote_password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `

    const createUserAccountsTable = `
      CREATE TABLE IF NOT EXISTS user_accounts_link (
        user_id INTEGER,
        account_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, account_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (account_id) REFERENCES user_pronote_accounts(id) ON DELETE CASCADE
      );
    `

    const createViewQuery = `
      DROP VIEW IF EXISTS view_homework;
      CREATE VIEW view_homework AS
      SELECT
        hw.fact_id AS fact_id,
        hw.fact_key AS fact_key,
        hw.description AS description,
        dd.date AS due_date,
        ad.date AS assigned_date,
        hw.completed AS completed,
        cd.date AS completed_date,
        hw.completion_duration AS completion_duration,
        hw.completion_state AS completion_state,
        hw.max_completion_duration AS max_completion_duration,
        hw.formatted AS formatted,
        hw.requires_submission AS requires_submission,
        hw.submission_type AS submission_type,
        hw.difficulty_level AS difficulty_level,
        hw.background_color AS background_color,
        hw.public_name AS public_name,
        hw.themes AS themes,
        hw.attachments AS attachments,
        hw.checksum AS checksum,
        hw.update_count AS update_count,
        ufd.date AS update_first_date,
        uld.date AS update_last_date,
        hw.update_files AS update_files,
        hw.temporary AS temporary,
        hw.json AS json,
        s.name AS student_name,
        sc.name AS school_name,
        g.name AS grade_name,
        sub.subject AS subject_name,
        t.name AS teacher_name,
        sd.date AS course_start_date,
        ed.date AS course_end_date
      FROM fact_homework hw
      LEFT JOIN dim_students s ON hw.student_id = s.student_id
      LEFT JOIN dim_schools sc ON hw.school_id = sc.school_id
      LEFT JOIN dim_subjects sub ON hw.subject_id = sub.subject_id
      LEFT JOIN dim_grades g ON hw.grade_id = g.grade_id
      LEFT JOIN dim_dates dd ON hw.due_date_id = dd.date_id
      LEFT JOIN dim_dates ad ON hw.assigned_date_id = ad.date_id
      LEFT JOIN dim_dates cd ON hw.completed_date_id = cd.date_id
      LEFT JOIN dim_dates ufd ON hw.update_first_date_id = ufd.date_id
      LEFT JOIN dim_dates uld ON hw.update_last_date_id = uld.date_id
      LEFT JOIN fact_courses c ON hw.fact_course_id = c.fact_id
      LEFT JOIN dim_teachers t ON c.teacher_id = t.teacher_id
      LEFT JOIN dim_dates sd ON c.start_date_id = sd.date_id
      LEFT JOIN dim_dates ed ON c.end_date_id = ed.date_id
      ;
    `

    this.#db.exec(createDimStudentsTable)
    this.#db.exec(createDimSchoolsTable)
    this.#db.exec(createDimGradesTable)
    this.#db.exec(createDimSubjectsTable)
    this.#db.exec(createDimTeachersTable)
    this.#db.exec(createDimDatesTable)
    this.#db.exec(createFactCoursesTable)
    this.#db.exec(createFactHomeworkTable)
    this.#db.exec(createProcessedFilesTable)
    this.#db.exec(createPushSubscriptionsTable)
    this.#db.exec(createUsersTable)
    this.#db.exec(createPronoteAccountsTable)
    this.#db.exec(createUserAccountsTable)
    this.#db.exec(createViewQuery)
  }

  isSchemaInitialized() {
    const stmt = this.#db.prepare(
      'SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE `type`=\'table\' AND name = ?) as tableExists'
    )
    const row = stmt.get('dim_students')
    return row?.tableExists == 1 ? true : false
  }

  getStudentId(name) {
    const stmt = this.#db.prepare('SELECT student_id FROM dim_students WHERE name = ?')
    const row = stmt.get(name)
    return row ? row.student_id : null
  }

  getSubjectId(subject) {
    const stmt = this.#db.prepare('SELECT subject_id FROM dim_subjects WHERE subject = ?')
    const row = stmt.get(subject)
    return row ? row.subject_id : null
  }

  getSchoolId(name) {
    const stmt = this.#db.prepare('SELECT school_id FROM dim_schools WHERE name = ?')
    const row = stmt.get(name)
    return row ? row.school_id : null
  }

  getGradeId(name) {
    const stmt = this.#db.prepare('SELECT grade_id FROM dim_grades WHERE name = ?')
    const row = stmt.get(name)
    return row ? row.grade_id : null
  }

  getTeacherId(name, subjectId) {
    const stmt = this.#db.prepare('SELECT teacher_id FROM dim_teachers WHERE name = ? AND subject_id = ?')
    const row = stmt.get(name, subjectId)
    return row ? row.teacher_id : null
  }

  getDateId(date) {
    if (date === null) {
      return null
    }
    if (typeof date?.toISOString === 'function') {
      date = date.toISOString()
    }
    const stmt = this.#db.prepare('SELECT date_id FROM dim_dates WHERE date = ?')
    const row = stmt.get(date)
    return row ? row.date_id : null
  }

  getContentId(contentId) {
    const stmt = this.#db.prepare('SELECT id FROM content WHERE id = ?')
    const row = stmt.get(contentId)
    return row ? row.id : null
  }

  getAttachmentId(attachmentId) {
    const stmt = this.#db.prepare('SELECT id FROM attachments WHERE id = ?')
    const row = stmt.get(attachmentId)
    return row ? row.id : null
  }

  insertStudent(name) {
    const stmt = this.#db.prepare('INSERT INTO dim_students (name) VALUES (?)')
    const info = stmt.run(name)
    return info.lastInsertRowid
  }

  insertSchool(name) {
    const stmt = this.#db.prepare('INSERT INTO dim_schools (name) VALUES (?)')
    const info = stmt.run(name)
    return info.lastInsertRowid
  }

  insertGrade(name) {
    const stmt = this.#db.prepare('INSERT INTO dim_grades (name) VALUES (?)')
    const info = stmt.run(name)
    return info.lastInsertRowid
  }

  insertSubject({subject, backgroundColor}) {
    const stmt = this.#db.prepare('INSERT INTO dim_subjects (subject, backgroundColor) VALUES (?, ?)')
    const info = stmt.run(subject, backgroundColor)
    return info.lastInsertRowid
  }

  insertTeacher(name, subjectId) {
    const stmt = this.#db.prepare('INSERT INTO dim_teachers (name, subject_id) VALUES (?, ?)')
    const info = stmt.run(name, subjectId)
    return info.lastInsertRowid
  }

  /**
   * Insert a date into the dim_dates table.
   * @param {DateWrapper} date - The date to insert.
   * @returns {number} The ID of the inserted date.
   */
  insertDate(date) {
    let date_time_formatted = null
    if (date) {
      date_time_formatted = date.toISOString()
    } else {
      throw new Error('Date is null')
    }
    const unixTimestamp = date.getUnixTimestamp() // Assuming DateWrapper has a method getUnixTimestamp
    const stmt = this.#db.prepare(`INSERT INTO dim_dates(
        date, year, month,
        week, weekday, day,
        hour, minute, second, millisecond, unix_timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    try {
      const data = [
        date_time_formatted,
        date.getYear(),
        date.getMonth(),
        date.getWeekOfTheYear(),
        date.getWeekDay(),
        date.getDayOfTheMonth(),
        date.getHour(),
        date.getMinute(),
        date.getSecond(),
        date.getMilliSecond(),
        unixTimestamp,
      ]
      const info = stmt.run(...data)
      return info.lastInsertRowid
    } catch (e) {
      console.log('Error inserting date', date_time_formatted, e)
      throw e
    }
  }

  getOrInsertDate(date) {
    if (date === null) {
      return null
    }
    if (!(date instanceof DateWrapper)) {
      date = DateWrapper.parseDate(date)
    }
    let dateId = this.getDateId(date)
    if (!dateId) {
      dateId = this.insertDate(date)
    }
    return dateId
  }

  getFactCourse(fact_key) {
    const stmt = this.#db.prepare('SELECT * FROM fact_courses WHERE fact_key = ?')
    return stmt.get(fact_key)
  }

  insertFactCourse({
    fact_key,
    subject_id,
    student_id,
    school_id,
    grade_id,
    teacher_id,
    start_date_id,
    end_date_id,
    homework_date_id,
    content_list,
    checksum,
    locked,
    update_first_date_id,
    update_last_date_id,
    update_count,
    update_files,
  }) {
    const stmt = this.#db.prepare(`
      INSERT INTO fact_courses (
        fact_key, subject_id, student_id, school_id, grade_id,
        teacher_id, start_date_id, end_date_id, homework_date_id,
        content_list, checksum, locked,
        update_first_date_id, update_last_date_id, update_count, update_files
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const info = stmt.run(
      fact_key,
      subject_id,
      student_id,
      school_id,
      grade_id,
      teacher_id,
      start_date_id,
      end_date_id,
      homework_date_id,
      content_list,
      checksum,
      locked ? 1 : 0,
      update_first_date_id,
      update_last_date_id,
      update_count,
      update_files
    )
    return info.lastInsertRowid
  }

  updateFactCourse({
    fact_key,
    subject_id,
    student_id,
    school_id,
    grade_id,
    teacher_id,
    start_date_id,
    end_date_id,
    homework_date_id,
    content_list,
    checksum,
    locked,
    update_first_date_id,
    update_last_date_id,
    update_count,
    update_files,
  }) {
    const stmt = this.#db.prepare(`
      UPDATE fact_courses SET
        subject_id = ?, student_id = ?, school_id = ?, grade_id = ?,
        teacher_id = ?, start_date_id = ?, end_date_id = ?, homework_date_id = ?,
        content_list = ?, checksum = ?, locked = ?,
        update_first_date_id = ?, update_last_date_id = ?, update_count = ?, update_files = ?
      WHERE fact_key = ?
    `)
    const info = stmt.run(
      subject_id,
      student_id,
      school_id,
      grade_id,
      teacher_id,
      start_date_id,
      end_date_id,
      homework_date_id,
      content_list,
      checksum,
      locked ? 1 : 0,
      update_first_date_id,
      update_last_date_id,
      update_count,
      update_files,
      fact_key
    )
    return info.lastInsertRowid
  }

  getFactHomework(fact_key) {
    const stmt = this.#db.prepare('SELECT * FROM fact_homework WHERE fact_key = ?')
    return stmt.get(fact_key)
  }

  insertFactHomework(data) {
    const {
      fact_key,
      fact_course_id,
      student_id,
      school_id,
      grade_id,
      subject_id,
      due_date_id,
      assigned_date_id,
      description,
      formatted,
      requires_submission,
      completed,
      completed_date_id,
      submission_type,
      difficulty_level,
      completion_duration,
      max_completion_duration,
      background_color,
      public_name,
      themes,
      attachments,
      checksum,
      notification_checksum,
      update_count,
      update_first_date_id,
      update_last_date_id,
      update_files,
      completion_state,
      temporary = 1,
      json,
      notification_state = this.NOTIFICATION_STATE_WAITING,
      notification_state_date_id = null,
    } = data
    const stmt = this.#db.prepare(`
      INSERT INTO fact_homework (
        fact_key, fact_course_id, student_id, school_id, grade_id,
        subject_id, due_date_id, assigned_date_id, description, formatted, requires_submission,
        completed, completed_date_id, completion_duration, completion_state, max_completion_duration,
        submission_type, difficulty_level, background_color, public_name, themes, attachments,
        checksum, notification_checksum, update_count, update_first_date_id, update_last_date_id, update_files, temporary,
        json, notification_state, notification_state_date_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    try {
      const info = stmt.run(
        fact_key,
        fact_course_id,
        student_id,
        school_id,
        grade_id,
        subject_id,
        due_date_id,
        assigned_date_id,
        description,
        formatted ? 1 : 0,
        requires_submission ? 1 : 0,
        completed ? 1 : 0,
        completed_date_id,
        completion_duration,
        completion_state,
        max_completion_duration,
        submission_type,
        difficulty_level,
        background_color,
        public_name,
        themes,
        attachments,
        checksum,
        notification_checksum,
        update_count,
        update_first_date_id,
        update_last_date_id,
        update_files,
        temporary ? 1 : 0,
        json,
        notification_state,
        notification_state_date_id
      )
      return info.lastInsertRowid
    } catch (e) {
      console.log(e, data)
      throw e
    }
  }

  updateFactHomework(data) {
    const {
      fact_key,
      fact_course_id,
      student_id,
      school_id,
      grade_id,
      subject_id,
      due_date_id,
      assigned_date_id,
      description,
      formatted,
      requires_submission,
      completed,
      completed_date_id,
      completion_duration,
      completion_state,
      max_completion_duration,
      submission_type,
      difficulty_level,
      background_color,
      public_name,
      themes,
      attachments,
      checksum,
      notification_checksum,
      update_count,
      update_first_date_id,
      update_last_date_id,
      update_files,
      temporary = 0,
      json,
    } = data
    const stmt = this.#db.prepare(`
      UPDATE fact_homework SET
        fact_course_id = ?, student_id = ?, school_id = ?, grade_id = ?,
        subject_id = ?, due_date_id = ?, assigned_date_id = ?, description = ?, formatted = ?, requires_submission = ?,
        completed = ?, completed_date_id = ?, completion_duration = ?, completion_state = ?, max_completion_duration = ?,
        submission_type = ?, difficulty_level = ?, background_color = ?, public_name = ?, themes = ?, attachments = ?,
        checksum = ?, notification_checksum = ?, update_count = ?, update_first_date_id = ?, update_last_date_id = ?, update_files = ?,
        temporary = ?, json = ?
      WHERE fact_key = ?
    `)
    try {
      const info = stmt.run(
        fact_course_id,
        student_id,
        school_id,
        grade_id,
        subject_id,
        due_date_id,
        assigned_date_id,
        description,
        formatted ? 1 : 0,
        requires_submission ? 1 : 0,
        completed ? 1 : 0,
        completed_date_id,
        completion_duration,
        completion_state,
        max_completion_duration,
        submission_type,
        difficulty_level,
        background_color,
        public_name,
        themes,
        attachments,
        checksum,
        notification_checksum,
        update_count,
        update_first_date_id,
        update_last_date_id,
        update_files,
        temporary ? 1 : 0,
        json,
        fact_key
      )
      return info.changes
    } catch (e) {
      console.log(e, data)
      throw e
    }
  }

  updateFactHomeworkTemporary(fact_key, temporary) {
    const stmt = this.#db.prepare(`
      UPDATE fact_homework SET
        temporary = ?
      WHERE fact_key = ?
    `)
    try {
      const info = stmt.run(temporary ? 1 : 0, fact_key)
      return info.changes
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  insertContent(content) {
    const stmt = this.#db.prepare(`
      INSERT INTO content (id, courseItemId, description, date, endDate)
      VALUES (?, ?, ?, ?, ?)
    `)
    const info = stmt.run(content.id, content.courseItemId, content.description, content.date, content.endDate)
    return info.lastInsertRowid
  }

  insertAttachment(attachment) {
    const stmt = this.#db.prepare(`
      INSERT INTO attachments (id, contentId, name, type, isInternal)
      VALUES (?, ?, ?, ?, ?)
    `)
    const info = stmt.run(attachment.id, attachment.contentId, attachment.name, attachment.type, attachment.isInternal)
    return info.lastInsertRowid
  }

  /**
   * Insert a file into the processed_files table.
   * @param {string} fileId - The ID of the file to insert.
   * @param {string} status - The processing status of the file to insert.
   */
  insertProcessedFile(fileId, status) {
    const stmt = this.#db.prepare('INSERT OR REPLACE INTO processed_files (file_id, processing_status) VALUES (?, ?)')
    stmt.run(fileId, status)
  }

  isFileProcessed(fileId) {
    const selectStmt = this.#db.prepare('SELECT processing_status FROM processed_files WHERE file_id = ?')
    const result = selectStmt.get(fileId)
    return result?.processing_status == DataWarehouse.FILE_PROCESSING_STATUS_PROCESSED
  }

  getPushSubscriptions() {
    const stmt = this.#db.prepare('SELECT * FROM push_subscriptions')
    return stmt.all().map((row) => {
      return {
        id: row.subscription_id,
        endpoint: row.endpoint,
        keys: {
          auth: row.auth,
          p256dh: row.p256dh,
        },
        expirationTime: row.expiration_time,
      }
    })
  }

  deletePushSubscriptionByEndpoint(endpoint) {
    const stmt = this.#db.prepare(`
      DELETE FROM push_subscriptions
      WHERE endpoint = ?
    `)
    const info = stmt.run(endpoint)
    return info.changes
  }

  getSubscriptionByEndpoint(endpoint) {
    const stmt = this.#db.prepare('SELECT * FROM push_subscriptions WHERE endpoint = ?')
    const row = stmt.get(endpoint)
    if (!row) {
      return null
    }
    return {
      endpoint: row.endpoint,
      expirationTime: row.expiration_time,
      keys: {
        auth: row.auth,
        p256dh: row.p256dh,
      },
    }
  }

  insertSubscription(endpoint, auth, p256dh, expirationTime) {
    const stmt = this.#db.prepare(`
      INSERT INTO push_subscriptions (endpoint, auth, p256dh, expiration_time)
      VALUES (?, ?, ?, ?)
    `)
    const info = stmt.run(endpoint, auth, p256dh, expirationTime)
    return info.lastInsertRowid
  }

  updateHomeworkNotificationSent(
    fact_key,
    notification_state = this.NOTIFICATION_STATE_SENT,
    notification_state_date_id = null
  ) {
    const stmt = this.#db.prepare(`
      UPDATE fact_homework SET
        notification_state = ?, notification_state_date_id = ?
      WHERE fact_key = ?
    `)
    const info = stmt.run(notification_state, notification_state_date_id, fact_key)
    return info.changes
  }

  /**
   * List all the temporary homeworks that have not been updated since the given date.
   * @param {DateWrapper} dateTime - The date to compare the last update date with.
   * @returns {Array} - The list of temporary homeworks that have not been updated since the given date.
   */
  reportTemporaryHomeworks(dateTime) {
    const query = `
      SELECT json
      FROM fact_homework
      WHERE temporary = 1
      AND update_first_date_id IN (
        SELECT date_id
        FROM dim_dates
        WHERE date < ?
      )
    `
    const result = this.#db.all(query, dateTime.toISOString())
    return result
  }

  /**
   * Remove all the temporary homeworks that have not been updated since the given date.
   * @param {DateWrapper} dateTime - The date to compare the last update date with.
   * @returns {number} - The number of rows deleted
   */
  removeTemporaryHomeworks(dateTime) {
    const stmt = this.#db.prepare(`
      DELETE FROM fact_homework
      WHERE temporary = 1
      AND update_first_date_id IN (
        SELECT date_id
        FROM dim_dates
        WHERE date < ?
      )
    `)
    const results = stmt.run(dateTime.toISOString())
    return results.changes
  }

  sendNotification(homework) {
    const notification = {
      title: 'Homework Reminder',
      body: `You have homework due for ${homework.subject_name} on ${homework.due_date}`,
      icon: '/path/to/icon.png',
    }

    if (Notification.permission === 'granted') {
      new Notification(notification.title, notification)
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification(notification.title, notification)
        }
      })
    }
  }

  getUserByEmail(email) {
    const stmt = this.#db.prepare('SELECT * FROM users WHERE email = ?')
    return stmt.get(email)
  }

  getUserById(userId) {
    const stmt = this.#db.prepare('SELECT * FROM users WHERE id = ?')
    return stmt.get(userId)
  }

  createUser({
    email,
    password,
    firstName,
    lastName,
    role = DataWarehouse.USER_ROLE_USER
  }) {
    const stmt = this.#db.prepare(`
      INSERT INTO users (
        email, password, firstName, lastName, role
      ) VALUES (?, ?, ?, ?, ?)
    `)
    const info = stmt.run(
      email,
      password,
      firstName,
      lastName,
      role
    )
    return info.lastInsertRowid
  }

  createPronoteAccount({
    cas_url,
    pronote_login,
    pronote_password
  }) {
    const stmt = this.#db.prepare(`
      INSERT INTO user_pronote_accounts (
        cas_url, pronote_login, pronote_password
      ) VALUES (?, ?, ?)
    `)
    const info = stmt.run(
      cas_url,
      pronote_login,
      pronote_password
    )
    return info.lastInsertRowid
  }

  linkUserAccount(userId, accountId) {
    const stmt = this.#db.prepare(`
      INSERT INTO user_accounts_link (
        user_id, account_id
      ) VALUES (?, ?)
    `)
    const info = stmt.run(userId, accountId)
    return info.changes > 0
  }

  getPronoteAccountsForUser(userId) {
    const stmt = this.#db.prepare(`
      SELECT pa.*
      FROM user_pronote_accounts pa
      JOIN user_accounts_link ua ON ua.account_id = pa.id
      WHERE ua.user_id = ?
    `)
    return stmt.all(userId)
  }

  updateUser(userId, {
    email,
    password,
    firstName,
    lastName,
    role
  }) {
    const updates = []
    const params = []

    if (email) {
      updates.push('email = ?')
      params.push(email)
    }
    if (password) {
      updates.push('password = ?')
      params.push(password)
    }
    if (firstName) {
      updates.push('firstName = ?')
      params.push(firstName)
    }
    if (lastName) {
      updates.push('lastName = ?')
      params.push(lastName)
    }
    if (role) {
      updates.push('role = ?')
      params.push(role)
    }

    if (updates.length === 0) {
      return 0
    }

    updates.push('updated_at = CURRENT_TIMESTAMP')
    params.push(userId)

    const stmt = this.#db.prepare(`
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = ?
    `)

    const info = stmt.run(...params)
    return info.changes
  }

  updatePronoteAccount(accountId, {
    cas_url,
    pronote_login,
    pronote_password
  }) {
    const updates = []
    const params = []

    if (cas_url !== undefined) {
      updates.push('cas_url = ?')
      params.push(cas_url)
    }
    if (pronote_login) {
      updates.push('pronote_login = ?')
      params.push(pronote_login)
    }
    if (pronote_password) {
      updates.push('pronote_password = ?')
      params.push(pronote_password)
    }

    if (updates.length === 0) {
      return 0
    }

    updates.push('updated_at = CURRENT_TIMESTAMP')
    params.push(accountId)

    const stmt = this.#db.prepare(`
      UPDATE user_pronote_accounts
      SET ${updates.join(', ')}
      WHERE id = ?
    `)

    const info = stmt.run(...params)
    return info.changes
  }

  listUsers() {
    const stmt = this.#db.prepare(`
      SELECT
        u.id, u.email, u.firstName, u.lastName,
        u.role, u.created_at, u.updated_at,
        json_group_array(json_object(
          'id', pa.id,
          'cas_url', pa.cas_url,
          'pronote_login', pa.pronote_login
        )) as accounts
      FROM users u
      LEFT JOIN user_accounts_link ua ON ua.user_id = u.id
      LEFT JOIN user_pronote_accounts pa ON pa.id = ua.account_id
      GROUP BY u.id
    `)
    return stmt.all()
  }
}
