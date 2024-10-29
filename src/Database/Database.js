import { default as SqliteDatabase} from 'better-sqlite3'
import Utils from '#pronote/Utils/Utils.js'

export default class Database {
  db = null

  async init({databaseFile, verbose}) {
    const opts = {}
    if (verbose) {
      opts.verbose = console.log
    }
    this.db = new SqliteDatabase(databaseFile, opts)
    this.db.pragma('journal_mode = WAL') // it is generally important to set the WAL pragma for performance reasons.
  }

  close() {
    if (this.db) {
      this.db.close()
    }
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
        day INTEGER,
        weekday INTEGER,
        hour INTEGER,
        minute INTEGER,
        second INTEGER,
        millisecond INTEGER
      );
      CREATE INDEX IF NOT EXISTS idx_dates_date ON dim_dates(date);
      CREATE INDEX IF NOT EXISTS idx_dates_year_month_day ON dim_dates(year, month, day);
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
        description TEXT,
        formatted INTEGER,              -- boolean
        requires_submission INTEGER,    -- boolean
        completed INTEGER,              -- boolean
        submission_type TEXT,           -- enum
        difficulty_level INTEGER,       -- enum
        duration INTEGER,
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

        FOREIGN KEY (student_id) REFERENCES dim_students(student_id),
        FOREIGN KEY (school_id) REFERENCES dim_schools(school_id),
        FOREIGN KEY (grade_id) REFERENCES dim_grades(grade_id),
        FOREIGN KEY (fact_course_id) REFERENCES fact_courses(fact_id),
        FOREIGN KEY (subject_id) REFERENCES dim_subjects(subject_id),
        FOREIGN KEY (due_date_id) REFERENCES dim_dates(date_id),
        FOREIGN KEY (assigned_date_id) REFERENCES dim_dates(date_id),
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

    this.db.exec(createDimStudentsTable);
    this.db.exec(createDimSchoolsTable);
    this.db.exec(createDimGradesTable);
    this.db.exec(createDimSubjectsTable);
    this.db.exec(createDimTeachersTable);
    this.db.exec(createDimDatesTable);
    this.db.exec(createFactCoursesTable);
    this.db.exec(createFactHomeworkTable);
  }

  getStudentId(name) {
    const stmt = this.db.prepare('SELECT student_id FROM dim_students WHERE name = ?');
    const row = stmt.get(name);
    return row ? row.student_id : null;
  }

  getSubjectId(subject) {
    const stmt = this.db.prepare('SELECT subject_id FROM dim_subjects WHERE subject = ?');
    const row = stmt.get(subject);
    return row ? row.subject_id : null;
  }
  
  getSchoolId(name) {
    const stmt = this.db.prepare('SELECT school_id FROM dim_schools WHERE name = ?');
    const row = stmt.get(name);
    return row ? row.school_id : null;
  }

  getGradeId(name) {
    const stmt = this.db.prepare('SELECT grade_id FROM dim_grades WHERE name = ?');
    const row = stmt.get(name);
    return row ? row.grade_id : null;
  }

  getTeacherId(name, subjectId) {
    const stmt = this.db.prepare('SELECT teacher_id FROM dim_teachers WHERE name = ? AND subject_id = ?');
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
    const stmt = this.db.prepare('SELECT date_id FROM dim_dates WHERE date = ?');
    const row = stmt.get(date);
    return row ? row.date_id : null;
  }

  getContentId(contentId) {
    const stmt = this.db.prepare('SELECT id FROM content WHERE id = ?');
    const row = stmt.get(contentId);
    return row ? row.id : null;
  }

  getAttachmentId(attachmentId) {
    const stmt = this.db.prepare('SELECT id FROM attachments WHERE id = ?');
    const row = stmt.get(attachmentId);
    return row ? row.id : null;
  }

  insertStudent(name) {
    const stmt = this.db.prepare('INSERT INTO dim_students (name) VALUES (?)');
    const info = stmt.run(name);
    return info.lastInsertRowid;
  }

  insertSchool(name) {
    const stmt = this.db.prepare('INSERT INTO dim_schools (name) VALUES (?)');
    const info = stmt.run(name);
    return info.lastInsertRowid;
  }

  insertGrade(name) {
    const stmt = this.db.prepare('INSERT INTO dim_grades (name) VALUES (?)');
    const info = stmt.run(name);
    return info.lastInsertRowid;
  }

  insertSubject({subject, backgroundColor}) {
    const stmt = this.db.prepare('INSERT INTO dim_subjects (subject, backgroundColor) VALUES (?, ?)');
    const info = stmt.run(subject, backgroundColor);
    return info.lastInsertRowid;
  }

  insertTeacher(name, subjectId) {
    const stmt = this.db.prepare('INSERT INTO dim_teachers (name, subject_id) VALUES (?, ?)');
    const info = stmt.run(name, subjectId);
    return info.lastInsertRowid;
  }

  insertDate(date) {
    let date_time_formatted = null
    if (date) {
      date_time_formatted = Utils.formatFullDate(date);
    } else {
      throw new Exception('Date is null');
    }
    const stmt = this.db.prepare('INSERT INTO dim_dates (date, year, month, day, weekday, hour, minute, second, millisecond) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const info = stmt.run(
      date_time_formatted, 
      date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getDay(), 
      date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds()
    );
    return info.lastInsertRowid;
  }

  getFactCourse(fact_key) {
    const stmt = this.db.prepare('SELECT * FROM fact_courses WHERE fact_key = ?');
    return stmt.get(fact_key);
  }

  insertFactCourse({
    fact_key, subject_id, student_id, school_id, grade_id,
    teacher_id, start_date_id, end_date_id, homework_date_id,
    content_list, checksum, locked,
    update_first_date_id, update_last_date_id, update_count, update_files
  }) {
    const stmt = this.db.prepare(`
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
    const stmt = this.db.prepare(`
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
    const stmt = this.db.prepare('SELECT * FROM fact_homework WHERE fact_key = ?');
    return stmt.get(fact_key);
  }

  insertFactHomework({
    fact_key, fact_course_id, student_id, school_id, grade_id,
    subject_id, due_date_id, assigned_date_id, description, formatted, requires_submission, 
    completed, submission_type, difficulty_level, duration, background_color, 
    public_name, themes, attachments, 
    checksum, update_count, update_first_date_id, update_last_date_id, update_files
  }) {
    const stmt = this.db.prepare(`
      INSERT INTO fact_homework (
        fact_key, fact_course_id, student_id, school_id, grade_id,
        subject_id, due_date_id, assigned_date_id, description, formatted, requires_submission, 
        completed, submission_type, difficulty_level, duration, background_color, 
        public_name, themes, attachments, 
        checksum, update_count, update_first_date_id, update_last_date_id, update_files
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    try {
      const info = stmt.run(
        fact_key, fact_course_id, student_id, school_id, grade_id,
        subject_id, due_date_id, assigned_date_id, description, formatted ? 1 : 0, requires_submission ? 1 : 0, 
        completed ? 1 : 0, submission_type, difficulty_level, duration, background_color, public_name, 
        themes, attachments, 
        checksum, update_count, update_first_date_id, update_last_date_id, update_files
      );
      return info.lastInsertRowid;
    } catch (e) {
      console.log(e, fact_key, fact_course_id, student_id, school_id, grade_id,
        subject_id, due_date_id, assigned_date_id, description, formatted ? 1 : 0, requires_submission ? 1 : 0, 
        completed ? 1 : 0, submission_type, difficulty_level, duration, background_color, public_name, 
        themes, attachments, 
        checksum, update_count, update_first_date_id, update_last_date_id, update_files);
      throw e;
    }
    
  }

  updateFactHomework({
    fact_key, fact_course_id, student_id, school_id, grade_id,
    subject_id, due_date_id, assigned_date_id, description, formatted, requires_submission, 
    completed, submission_type, difficulty_level, duration, background_color, 
    public_name, themes, attachments, 
    checksum, update_count, update_first_date_id, update_last_date_id, update_files
  }) {
    const stmt = this.db.prepare(`
      UPDATE fact_homework SET
        fact_course_id = ?, student_id = ?, school_id = ?, grade_id = ?,
        subject_id = ?, due_date_id = ?, assigned_date_id = ?, description = ?, formatted = ?, requires_submission = ?, 
        completed = ?, submission_type = ?, difficulty_level = ?, duration = ?, background_color = ?, 
        public_name = ?, themes = ?, attachments = ?, 
        checksum = ?, update_count = ?, update_first_date_id = ?, update_last_date_id = ?, update_files = ?
      WHERE fact_key = ?
    `);
    try {
      const info = stmt.run(
        fact_course_id, student_id, school_id, grade_id,
        subject_id, due_date_id, assigned_date_id, description, formatted ? 1 : 0, requires_submission ? 1 : 0, 
        completed ? 1 : 0, submission_type, difficulty_level, duration, background_color, 
        public_name, themes, attachments, 
        checksum, update_count, update_first_date_id, update_last_date_id, update_files, 
        fact_key
      );
      return info.changes;
    } catch (e) {
      console.log(e, fact_course_id, student_id, school_id, grade_id,
        subject_id, due_date_id, assigned_date_id, description, formatted ? 1 : 0, requires_submission ? 1 : 0, 
        completed ? 1 : 0, submission_type, difficulty_level, duration, background_color, 
        public_name, themes, attachments, 
        checksum, update_count, update_first_date_id, update_last_date_id, update_files, 
        fact_key);
      throw e;
    }
  }

  insertContent(content) {
    const stmt = this.db.prepare(`
      INSERT INTO content (id, courseItemId, description, date, endDate)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(content.id, content.courseItemId, content.description, content.date, content.endDate);
    return info.lastInsertRowid;
  }

  insertAttachment(attachment) {
    const stmt = this.db.prepare(`
      INSERT INTO attachments (id, contentId, name, type, isInternal)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(attachment.id, attachment.contentId, attachment.name, attachment.type, attachment.isInternal);
    return info.lastInsertRowid;
  }

}