import DateWrapper from '#pronote/Utils/DateWrapper.js';
import DatabaseConnection from './DatabaseConnection.js';

export default class DataWarehouse {
  static FILE_PROCESSING_STATUS_WAITING = 0;
  static FILE_PROCESSING_STATUS_PROCESSED = 1;
  static FILE_PROCESSING_STATUS_ERROR = 0;

  static COMPLETION_STATE_IN_PROGRESS = 0;
  static COMPLETION_STATE_COMPLETED = 1;
  static COMPLETION_STATE_OVER_DUE = 2;
  static COMPLETION_STATE_UNKNOWN = 3;

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
    `;
    const createDimSchoolsTable = `
      CREATE TABLE IF NOT EXISTS dim_schools (
        school_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(50)
      );
      CREATE INDEX IF NOT EXISTS idx_schools_name ON dim_schools(name);
    `;
    const createDimGradesTable = `
      CREATE TABLE IF NOT EXISTS dim_grades (
        grade_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(50)
      );
      CREATE INDEX IF NOT EXISTS idx_grades_name ON dim_grades(name);
    `;
    const createDimSubjectsTable = `
      CREATE TABLE IF NOT EXISTS dim_subjects (
        subject_id INTEGER PRIMARY KEY AUTOINCREMENT,
        subject TEXT,
        backgroundColor TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_courses_subject ON dim_subjects(subject);
    `;
    const createDimTeachersTable = `
      CREATE TABLE IF NOT EXISTS dim_teachers (
        teacher_id INTEGER PRIMARY KEY AUTOINCREMENT,
        subject_id INTEGER,
        name VARCHAR(50),
        FOREIGN KEY (subject_id) REFERENCES dim_subjects(subject_id)
      );
      CREATE INDEX IF NOT EXISTS idx_teachers_name ON dim_teachers(name);
    `;
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
    `;
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
    `;

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
        update_count INTEGER DEFAULT 1,
        update_first_date_id INTEGER,   -- FK dim_dates
        update_last_date_id INTEGER,    -- FK dim_dates
        update_files TEXT,
        temporary INTEGER DEFAULT 1,    -- boolean
        json TEXT,

        FOREIGN KEY (student_id) REFERENCES dim_students(student_id),
        FOREIGN KEY (school_id) REFERENCES dim_schools(school_id),
        FOREIGN KEY (grade_id) REFERENCES dim_grades(grade_id),
        FOREIGN KEY (fact_course_id) REFERENCES fact_courses(fact_id),
        FOREIGN KEY (subject_id) REFERENCES dim_subjects(subject_id),
        FOREIGN KEY (due_date_id) REFERENCES dim_dates(date_id),
        FOREIGN KEY (assigned_date_id) REFERENCES dim_dates(date_id),
        FOREIGN KEY (completed_date_id) REFERENCES dim_dates(date_id),
        FOREIGN KEY (update_first_date_id) REFERENCES dim_dates(date_id),
        FOREIGN KEY (update_last_date_id) REFERENCES dim_dates(date_id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_fact_homework_fact_key ON fact_homework(fact_key);
      CREATE INDEX IF NOT EXISTS idx_fact_homework_subject_id ON fact_homework(subject_id);
      CREATE INDEX IF NOT EXISTS idx_fact_homework_student_id ON fact_courses(student_id);
      CREATE INDEX IF NOT EXISTS idx_fact_homework_school_id ON fact_courses(school_id);
      CREATE INDEX IF NOT EXISTS idx_fact_homework_grade_id ON fact_courses(grade_id);
      CREATE INDEX IF NOT EXISTS idx_fact_homework_due_date_id ON fact_homework(due_date_id);
      CREATE INDEX IF NOT EXISTS idx_fact_homework_assigned_date_id ON fact_homework(assigned_date_id);
    `;

    const createProcessedFilesTable = `
      CREATE TABLE IF NOT EXISTS processed_files (
        file_id TEXT PRIMARY KEY,
        processing_status INTEGER DEFAULT 0  -- enum (0: not processed, 1: processed, 2: error)
      );
    `;
    
    this.#db.exec(createDimStudentsTable);
    this.#db.exec(createDimSchoolsTable);
    this.#db.exec(createDimGradesTable);
    this.#db.exec(createDimSubjectsTable);
    this.#db.exec(createDimTeachersTable);
    this.#db.exec(createDimDatesTable);
    this.#db.exec(createFactCoursesTable);
    this.#db.exec(createFactHomeworkTable);
    this.#db.exec(createProcessedFilesTable);
  }

  getStudentId(name) {
    const stmt = this.#db.prepare('SELECT student_id FROM dim_students WHERE name = ?');
    const row = stmt.get(name);
    return row ? row.student_id : null;
  }

  getSubjectId(subject) {
    const stmt = this.#db.prepare('SELECT subject_id FROM dim_subjects WHERE subject = ?');
    const row = stmt.get(subject);
    return row ? row.subject_id : null;
  }
  
  getSchoolId(name) {
    const stmt = this.#db.prepare('SELECT school_id FROM dim_schools WHERE name = ?');
    const row = stmt.get(name);
    return row ? row.school_id : null;
  }

  getGradeId(name) {
    const stmt = this.#db.prepare('SELECT grade_id FROM dim_grades WHERE name = ?');
    const row = stmt.get(name);
    return row ? row.grade_id : null;
  }

  getTeacherId(name, subjectId) {
    const stmt = this.#db.prepare('SELECT teacher_id FROM dim_teachers WHERE name = ? AND subject_id = ?');
    const row = stmt.get(name, subjectId);
    return row ? row.teacher_id : null;
  }

  getDateId(date) {
    if (date === null) {
      return null;
    }
    if (typeof date?.toISOString === 'function') {
      date = date.toISOString();
    }
    const stmt = this.#db.prepare('SELECT date_id FROM dim_dates WHERE date = ?');
    const row = stmt.get(date);
    return row ? row.date_id : null;
  }

  getContentId(contentId) {
    const stmt = this.#db.prepare('SELECT id FROM content WHERE id = ?');
    const row = stmt.get(contentId);
    return row ? row.id : null;
  }

  getAttachmentId(attachmentId) {
    const stmt = this.#db.prepare('SELECT id FROM attachments WHERE id = ?');
    const row = stmt.get(attachmentId);
    return row ? row.id : null;
  }

  insertStudent(name) {
    const stmt = this.#db.prepare('INSERT INTO dim_students (name) VALUES (?)');
    const info = stmt.run(name);
    return info.lastInsertRowid;
  }

  insertSchool(name) {
    const stmt = this.#db.prepare('INSERT INTO dim_schools (name) VALUES (?)');
    const info = stmt.run(name);
    return info.lastInsertRowid;
  }

  insertGrade(name) {
    const stmt = this.#db.prepare('INSERT INTO dim_grades (name) VALUES (?)');
    const info = stmt.run(name);
    return info.lastInsertRowid;
  }

  insertSubject({subject, backgroundColor}) {
    const stmt = this.#db.prepare('INSERT INTO dim_subjects (subject, backgroundColor) VALUES (?, ?)');
    const info = stmt.run(subject, backgroundColor);
    return info.lastInsertRowid;
  }

  insertTeacher(name, subjectId) {
    const stmt = this.#db.prepare('INSERT INTO dim_teachers (name, subject_id) VALUES (?, ?)');
    const info = stmt.run(name, subjectId);
    return info.lastInsertRowid;
  }

  /**
   * 
   * @param {DateWrapper} date 
   * @returns 
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
        date_time_formatted, date.getYear(), date.getMonth(), 
        date.getWeekOfTheYear(), date.getWeekDay(), date.getDayOfTheMonth(), 
        date.getHour(), date.getMinute(), date.getSecond(), date.getMilliSecond(), unixTimestamp
      ]
      const info = stmt.run(...data)
      return info.lastInsertRowid
    } catch(e) {
      console.log('Error inserting date', date_time_formatted, e)
      throw e
    }
  }

  getFactCourse(fact_key) {
    const stmt = this.#db.prepare('SELECT * FROM fact_courses WHERE fact_key = ?');
    return stmt.get(fact_key);
  }

  insertFactCourse({
    fact_key, subject_id, student_id, school_id, grade_id,
    teacher_id, start_date_id, end_date_id, homework_date_id,
    content_list, checksum, locked,
    update_first_date_id, update_last_date_id, update_count, update_files
  }) {
    const stmt = this.#db.prepare(`
      INSERT INTO fact_courses (
        fact_key, subject_id, student_id, school_id, grade_id, 
        teacher_id, start_date_id, end_date_id, homework_date_id, 
        content_list, checksum, locked,
        update_first_date_id, update_last_date_id, update_count, update_files
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      fact_key, 
      subject_id, student_id, school_id, grade_id, 
      teacher_id, start_date_id, end_date_id, homework_date_id, 
      content_list, checksum, locked ? 1 : 0,
      update_first_date_id, update_last_date_id, update_count, update_files
    );
    return info.lastInsertRowid;
  }

  updateFactCourse({
    fact_key, subject_id, student_id, school_id, grade_id,
    teacher_id, start_date_id, end_date_id, homework_date_id,
    content_list, checksum, locked,
    update_first_date_id, update_last_date_id, update_count, update_files
  }) {
    const stmt = this.#db.prepare(`
      UPDATE fact_courses SET 
        subject_id = ?, student_id = ?, school_id = ?, grade_id = ?, 
        teacher_id = ?, start_date_id = ?, end_date_id = ?, homework_date_id = ?, 
        content_list = ?, checksum = ?, locked = ?,
        update_first_date_id = ?, update_last_date_id = ?, update_count = ?, update_files = ?
      WHERE fact_key = ?
    `);
    const info = stmt.run(
      subject_id, student_id, school_id, grade_id, 
      teacher_id, start_date_id, end_date_id, homework_date_id, 
      content_list, checksum, locked ? 1 : 0,
      update_first_date_id, update_last_date_id, update_count, update_files,
      fact_key
    );
    return info.lastInsertRowid;
  }

  getFactHomework(fact_key) {
    const stmt = this.#db.prepare('SELECT * FROM fact_homework WHERE fact_key = ?');
    return stmt.get(fact_key);
  }

  insertFactHomework(data) {
    const {
      fact_key, fact_course_id, student_id, school_id, grade_id,
      subject_id, due_date_id, assigned_date_id, description, formatted, requires_submission, 
      completed, completed_date_id, submission_type, difficulty_level, completion_duration, max_completion_duration,
      background_color, public_name, themes, attachments, 
      checksum, update_count, update_first_date_id, update_last_date_id, update_files, completion_state,
      temporary = 1, json
    } = data
    const stmt = this.#db.prepare(`
      INSERT INTO fact_homework (
        fact_key, fact_course_id, student_id, school_id, grade_id,
        subject_id, due_date_id, assigned_date_id, description, formatted, requires_submission, 
        completed, completed_date_id, completion_duration, completion_state, max_completion_duration,
        submission_type, difficulty_level, background_color, public_name, themes, attachments, 
        checksum, update_count, update_first_date_id, update_last_date_id, update_files, temporary,
        json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    try {
      const info = stmt.run(
        fact_key, fact_course_id, student_id, school_id, grade_id,
        subject_id, due_date_id, assigned_date_id, description, formatted ? 1 : 0, requires_submission ? 1 : 0, 
        completed ? 1 : 0, completed_date_id, completion_duration, completion_state, max_completion_duration,
        submission_type, difficulty_level, background_color, public_name, themes, attachments, 
        checksum, update_count, update_first_date_id, update_last_date_id, update_files, 
        temporary ? 1 : 0, json
      );
      return info.lastInsertRowid;
    } catch (e) {
      console.log(e, data);
      throw e;
    }
    
  }

  updateFactHomework(data) {
    const {
      fact_key, fact_course_id, student_id, school_id, grade_id,
      subject_id, due_date_id, assigned_date_id, description, formatted, requires_submission, 
      completed, completed_date_id, completion_duration, completion_state, max_completion_duration,
      submission_type, difficulty_level, background_color, public_name, themes, attachments, 
      checksum, update_count, update_first_date_id, update_last_date_id, update_files,
      temporary = 0, json

    } = data
    const stmt = this.#db.prepare(`
      UPDATE fact_homework SET
        fact_course_id = ?, student_id = ?, school_id = ?, grade_id = ?,
        subject_id = ?, due_date_id = ?, assigned_date_id = ?, description = ?, formatted = ?, requires_submission = ?, 
        completed = ?, completed_date_id = ?, completion_duration = ?, completion_state = ?, max_completion_duration = ?,
        submission_type = ?, difficulty_level = ?, background_color = ?, public_name = ?, themes = ?, attachments = ?, 
        checksum = ?, update_count = ?, update_first_date_id = ?, update_last_date_id = ?, update_files = ?, 
        temporary = ?, json = ?
      WHERE fact_key = ?
    `);
    try {
      const info = stmt.run(
        fact_course_id, student_id, school_id, grade_id,
        subject_id, due_date_id, assigned_date_id, description, formatted ? 1 : 0, requires_submission ? 1 : 0, 
        completed ? 1 : 0, completed_date_id, completion_duration, completion_state, max_completion_duration,
        submission_type, difficulty_level, background_color, public_name, themes, attachments, 
        checksum, update_count, update_first_date_id, update_last_date_id, update_files, 
        temporary ? 1 : 0, json,
        fact_key
      );
      return info.changes;
    } catch (e) {
      console.log(e, data);
      throw e;
    }
  }

  insertContent(content) {
    const stmt = this.#db.prepare(`
      INSERT INTO content (id, courseItemId, description, date, endDate)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(content.id, content.courseItemId, content.description, content.date, content.endDate);
    return info.lastInsertRowid;
  }

  insertAttachment(attachment) {
    const stmt = this.#db.prepare(`
      INSERT INTO attachments (id, contentId, name, type, isInternal)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(attachment.id, attachment.contentId, attachment.name, attachment.type, attachment.isInternal);
    return info.lastInsertRowid;
  }
    
  /**
   * Insert a file into the processed_files table.
   * @param {string} fileId - The ID of the file to insert.
   * * @param {string} status - The processing status of the file to insert.
   */
  insertProcessedFile(fileId, status) {
    const stmt = this.#db.prepare('INSERT OR REPLACE INTO processed_files (file_id, processing_status) VALUES (?, ?)');
    stmt.run(fileId, status);
  }

  isFileProcessed(fileId) {
    const selectStmt = this.#db.prepare('SELECT processing_status FROM processed_files WHERE file_id = ?');
    const result = selectStmt.get(fileId);
    return result?.processing_status == DataWarehouse.FILE_PROCESSING_STATUS_PROCESSED;
  }

  /**
   * @param {DateWrapper} dateTime 
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
    const result = this.#db.all(query, dateTime.toISOString());
    return result;
  }

  /**
   * @param {DateWrapper} dateTime 
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
}
