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
      CREATE TABLE IF NOT EXISTS dimStudents (
        studentId INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        fullName TEXT,
        firstName TEXT,
        lastName TEXT,
        pronoteCasUrl TEXT,
        pronoteLogin TEXT,
        pronotePassword TEXT
      );
      CREATE INDEX IF NOT EXISTS idxStudentsName ON dimStudents(name);
    `
    const createDimSchoolsTable = `
      CREATE TABLE IF NOT EXISTS dimSchools (
        schoolId INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT
      );
      CREATE INDEX IF NOT EXISTS idxSchoolsName ON dimSchools(name);
    `
    const createDimGradesTable = `
      CREATE TABLE IF NOT EXISTS dimGrades (
        gradeId INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT
      );
      CREATE INDEX IF NOT EXISTS idxGradesName ON dimGrades(name);
    `
    const createDimSubjectsTable = `
      CREATE TABLE IF NOT EXISTS dimSubjects (
        subjectId INTEGER PRIMARY KEY AUTOINCREMENT,
        subject TEXT,
        backgroundColor TEXT
      );
      CREATE INDEX IF NOT EXISTS idxCoursesSubject ON dimSubjects(subject);
    `
    const createDimTeachersTable = `
      CREATE TABLE IF NOT EXISTS dimTeachers (
        teacherId INTEGER PRIMARY KEY AUTOINCREMENT,
        subjectId INTEGER,
        name TEXT,
        FOREIGN KEY (subjectId) REFERENCES dimSubjects(subjectId)
      );
      CREATE INDEX IF NOT EXISTS idxTeachersName ON dimTeachers(name);
    `
    const createDimDatesTable = `
      CREATE TABLE IF NOT EXISTS dimDates (
        dateId INTEGER PRIMARY KEY AUTOINCREMENT,
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
        unixTimestamp INTEGER
      );
      CREATE INDEX IF NOT EXISTS idxDatesDate ON dimDates(date);
      CREATE INDEX IF NOT EXISTS idxDatesYearMonthWeekDay ON dimDates(year, month, week, weekday, day);
    `
    const createFactCoursesTable = `
      CREATE TABLE IF NOT EXISTS factCourses (
        factId INTEGER PRIMARY KEY AUTOINCREMENT,
        factKey TEXT,
        subjectId INTEGER,
        studentId INTEGER,
        schoolId INTEGER,
        gradeId INTEGER,
        teacherId INTEGER,
        startDateId INTEGER,
        endDateId INTEGER,
        homeworkDateId INTEGER,
        contentList TEXT,
        locked INTEGER,
        -- update fields
        checksum TEXT,
        updateCount INTEGER DEFAULT 1,
        updateFirstDateId INTEGER,
        updateLastDateId INTEGER,
        updateFiles TEXT,
        FOREIGN KEY (subjectId) REFERENCES dimSubjects(subjectId),
        FOREIGN KEY (studentId) REFERENCES dimStudents(studentId),
        FOREIGN KEY (schoolId) REFERENCES dimSchools(schoolId),
        FOREIGN KEY (gradeId) REFERENCES dimGrades(gradeId),
        FOREIGN KEY (teacherId) REFERENCES dimTeachers(teacherId),
        FOREIGN KEY (startDateId) REFERENCES dimDates(dateId),
        FOREIGN KEY (endDateId) REFERENCES dimDates(dateId),
        FOREIGN KEY (homeworkDateId) REFERENCES dimDates(dateId)
        FOREIGN KEY (updateFirstDateId) REFERENCES dimDates(dateId),
        FOREIGN KEY (updateLastDateId) REFERENCES dimDates(dateId)
      );
      CREATE INDEX IF NOT EXISTS idxFactCoursesId ON factCourses(factKey);
      CREATE INDEX IF NOT EXISTS idxFactCoursesSubjectId ON factCourses(subjectId);
      CREATE INDEX IF NOT EXISTS idxFactCoursesStudentId ON factCourses(studentId);
      CREATE INDEX IF NOT EXISTS idxFactCoursesSchoolId ON factCourses(schoolId);
      CREATE INDEX IF NOT EXISTS idxFactCoursesGradeId ON factCourses(gradeId);
      CREATE INDEX IF NOT EXISTS idxFactCoursesTeacherId ON factCourses(teacherId);
      CREATE INDEX IF NOT EXISTS idxFactCoursesStartDateId ON factCourses(startDateId);
      CREATE INDEX IF NOT EXISTS idxFactCoursesEndDateId ON factCourses(endDateId);
      CREATE INDEX IF NOT EXISTS idxFactCoursesUpdateFirstDateId ON factCourses(updateFirstDateId);
      CREATE INDEX IF NOT EXISTS idxFactCoursesUpdateLastDateId ON factCourses(updateLastDateId);
      CREATE INDEX IF NOT EXISTS idxFactCoursesHomeworkDateId ON factCourses(homeworkDateId);
    `

    const createFactHomeworkTable = `
      CREATE TABLE IF NOT EXISTS factHomework (
        factId INTEGER PRIMARY KEY AUTOINCREMENT,
        factKey TEXT,
        studentId INTEGER,                   -- FK dimStudents
        schoolId INTEGER,                    -- FK dimSchools
        gradeId INTEGER,                     -- FK dimGrades
        factCourseId INTEGER,                -- FK factCourses
        subjectId INTEGER,                   -- FK dimSubjects
        dueDateId INTEGER,                   -- FK dimDates
        assignedDateId INTEGER,              -- FK dimDates
        completed INTEGER,                   -- boolean
        completedDateId INTEGER,             -- FK dimDates
        completionDuration INTEGER,
        completionState INTEGER,             -- 3 possible states
        maxCompletionDuration INTEGER,
        description TEXT,
        formatted INTEGER,                   -- boolean
        requiresSubmission INTEGER,          -- boolean
        submissionType TEXT,                 -- enum
        difficultyLevel INTEGER,             -- enum
        backgroundColor TEXT,
        publicName TEXT,
        themes TEXT,                         -- Storing as JSON string or comma-separated values
        attachments TEXT,                    -- Storing as JSON string or comma-separated values
        -- update fields
        checksum TEXT,
        notificationChecksum TEXT,
        updateCount INTEGER DEFAULT 1,
        updateFirstDateId INTEGER,           -- FK dimDates
        updateLastDateId INTEGER,            -- FK dimDates
        updateFiles TEXT,
        temporary INTEGER DEFAULT 1,         -- boolean
        json TEXT,
        notificationState INTEGER DEFAULT 0, -- boolean
        notificationStateDateId INTEGER,     -- FK dimDates
        FOREIGN KEY (studentId) REFERENCES dimStudents(studentId),
        FOREIGN KEY (schoolId) REFERENCES dimSchools(schoolId),
        FOREIGN KEY (gradeId) REFERENCES dimGrades(gradeId),
        FOREIGN KEY (factCourseId) REFERENCES factCourses(factId),
        FOREIGN KEY (subjectId) REFERENCES dimSubjects(subjectId),
        FOREIGN KEY (dueDateId) REFERENCES dimDates(dateId),
        FOREIGN KEY (assignedDateId) REFERENCES dimDates(dateId),
        FOREIGN KEY (completedDateId) REFERENCES dimDates(dateId),
        FOREIGN KEY (updateFirstDateId) REFERENCES dimDates(dateId),
        FOREIGN KEY (updateLastDateId) REFERENCES dimDates(dateId),
        FOREIGN KEY (notificationStateDateId) REFERENCES dimDates(dateId)
      );

      CREATE INDEX IF NOT EXISTS idxFactHomeworkFactKey ON factHomework(factKey);
      CREATE INDEX IF NOT EXISTS idxFactHomeworkSubjectId ON factHomework(subjectId);
      CREATE INDEX IF NOT EXISTS idxFactHomeworkStudentId ON factCourses(studentId);
      CREATE INDEX IF NOT EXISTS idxFactHomeworkSchoolId ON factCourses(schoolId);
      CREATE INDEX IF NOT EXISTS idxFactHomeworkGradeId ON factCourses(gradeId);
      CREATE INDEX IF NOT EXISTS idxFactHomeworkDueDateId ON factHomework(dueDateId);
      CREATE INDEX IF NOT EXISTS idxFactHomeworkAssignedDateId ON factHomework(assignedDateId);
    `

    const createProcessedFilesTable = `
      CREATE TABLE IF NOT EXISTS processedFiles (
        fileId TEXT PRIMARY KEY,
        processingStatus INTEGER DEFAULT 0  -- enum (0: not processed, 1: processed, 2: error)
      );
    `

    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        login TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        firstName TEXT,
        lastName TEXT,
        role TEXT DEFAULT 'user',
        pushEndpoint TEXT,
        pushAuth TEXT,
        pushP256dh TEXT,
        pushExpirationTime DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idxUsersLogin ON users(login);
      CREATE INDEX IF NOT EXISTS idxUsersPushEndpoint ON users(pushEndpoint);
    `

    const createUserStudentsLinkTable = `
      CREATE TABLE IF NOT EXISTS userStudentsLink (
        userId INTEGER, -- PK
        studentId INTEGER, -- PK
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (userId, studentId),
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (studentId) REFERENCES dimStudents(studentId) ON DELETE CASCADE
      );
    `

    const createViewQuery = `
      DROP VIEW IF EXISTS viewHomework;
      CREATE VIEW viewHomework AS
      SELECT
        hw.factId AS factId,
        hw.factKey AS factKey,
        hw.description AS description,
        dd.date AS dueDate,
        ad.date AS assignedDate,
        hw.completed AS completed,
        cd.date AS completedDate,
        hw.completionDuration AS completionDuration,
        hw.completionState AS completionState,
        hw.maxCompletionDuration AS maxCompletionDuration,
        hw.formatted AS formatted,
        hw.requiresSubmission AS requiresSubmission,
        hw.submissionType AS submissionType,
        hw.difficultyLevel AS difficultyLevel,
        hw.backgroundColor AS backgroundColor,
        hw.publicName AS publicName,
        hw.themes AS themes,
        hw.attachments AS attachments,
        hw.checksum AS checksum,
        hw.updateCount AS updateCount,
        ufd.date AS updateFirstDate,
        uld.date AS updateLastDate,
        hw.updateFiles AS updateFiles,
        hw.temporary AS temporary,
        hw.json AS json,
        s.name AS studentName,
        sc.name AS schoolName,
        g.name AS gradeName,
        sub.subject AS subjectName,
        t.name AS teacherName,
        sd.date AS courseStartDate,
        ed.date AS courseEndDate
      FROM factHomework hw
      LEFT JOIN dimStudents s ON hw.studentId = s.studentId
      LEFT JOIN dimSchools sc ON hw.schoolId = sc.schoolId
      LEFT JOIN dimSubjects sub ON hw.subjectId = sub.subjectId
      LEFT JOIN dimGrades g ON hw.gradeId = g.gradeId
      LEFT JOIN dimDates dd ON hw.dueDateId = dd.dateId
      LEFT JOIN dimDates ad ON hw.assignedDateId = ad.dateId
      LEFT JOIN dimDates cd ON hw.completedDateId = cd.dateId
      LEFT JOIN dimDates ufd ON hw.updateFirstDateId = ufd.dateId
      LEFT JOIN dimDates uld ON hw.updateLastDateId = uld.dateId
      LEFT JOIN factCourses c ON hw.factCourseId = c.factId
      LEFT JOIN dimTeachers t ON c.teacherId = t.teacherId
      LEFT JOIN dimDates sd ON c.startDateId = sd.dateId
      LEFT JOIN dimDates ed ON c.endDateId = ed.dateId
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
    this.#db.exec(createUsersTable)
    this.#db.exec(createUserStudentsLinkTable)
    this.#db.exec(createViewQuery)
  }

  isSchemaInitialized() {
    const stmt = this.#db.prepare(
      'SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE `type`=\'table\' AND name = ?) as tableExists'
    )
    const row = stmt.get('dimStudents')
    return row?.tableExists == 1 ? true : false
  }

  getStudentId(name) {
    const stmt = this.#db.prepare('SELECT studentId FROM dimStudents WHERE name = ?')
    const row = stmt.get(name)
    return row ? row.studentId : null
  }

  getSubjectId(subject) {
    const stmt = this.#db.prepare('SELECT subjectId FROM dimSubjects WHERE subject = ?')
    const row = stmt.get(subject)
    return row ? row.subjectId : null
  }

  getSchoolId(name) {
    const stmt = this.#db.prepare('SELECT schoolId FROM dimSchools WHERE name = ?')
    const row = stmt.get(name)
    return row ? row.schoolId : null
  }

  getGradeId(name) {
    const stmt = this.#db.prepare('SELECT gradeId FROM dimGrades WHERE name = ?')
    const row = stmt.get(name)
    return row ? row.gradeId : null
  }

  getTeacherId(name, subjectId) {
    const stmt = this.#db.prepare('SELECT teacherId FROM dimTeachers WHERE name = ? AND subjectId = ?')
    const row = stmt.get(name, subjectId)
    return row ? row.teacherId : null
  }

  getDateId(date) {
    if (date === null) {
      return null
    }
    if (typeof date?.toISOString === 'function') {
      date = date.toISOString()
    }
    const stmt = this.#db.prepare('SELECT dateId FROM dimDates WHERE date = ?')
    const row = stmt.get(date)
    return row ? row.dateId : null
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
    const stmt = this.#db.prepare('INSERT INTO dimStudents (name) VALUES (?)')
    const info = stmt.run(name)
    return info.lastInsertRowid
  }

  insertSchool(name) {
    const stmt = this.#db.prepare('INSERT INTO dimSchools (name) VALUES (?)')
    const info = stmt.run(name)
    return info.lastInsertRowid
  }

  insertGrade(name) {
    const stmt = this.#db.prepare('INSERT INTO dimGrades (name) VALUES (?)')
    const info = stmt.run(name)
    return info.lastInsertRowid
  }

  insertSubject({subject, backgroundColor}) {
    const stmt = this.#db.prepare('INSERT INTO dimSubjects (subject, backgroundColor) VALUES (?, ?)')
    const info = stmt.run(subject, backgroundColor)
    return info.lastInsertRowid
  }

  insertTeacher(name, subjectId) {
    const stmt = this.#db.prepare('INSERT INTO dimTeachers (name, subjectId) VALUES (?, ?)')
    const info = stmt.run(name, subjectId)
    return info.lastInsertRowid
  }

  /**
   * Insert a date into the dimDates table.
   * @param {DateWrapper} date - The date to insert.
   * @returns {number} The ID of the inserted date.
   */
  insertDate(date) {
    let dateTimeFormatted = null
    if (date) {
      dateTimeFormatted = date.toISOString()
    } else {
      throw new Error('Date is null')
    }
    const unixTimestamp = date.getUnixTimestamp() // Assuming DateWrapper has a method getUnixTimestamp
    const stmt = this.#db.prepare(`INSERT INTO dimDates(
        date, year, month,
        week, weekday, day,
        hour, minute, second, millisecond, unixTimestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    try {
      const data = [
        dateTimeFormatted,
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
      console.log('Error inserting date', dateTimeFormatted, e)
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

  getFactCourse(factKey) {
    const stmt = this.#db.prepare('SELECT * FROM factCourses WHERE factKey = ?')
    return stmt.get(factKey)
  }

  insertFactCourse({
    factKey,
    subjectId,
    studentId,
    schoolId,
    gradeId,
    teacherId,
    startDateId,
    endDateId,
    homeworkDateId,
    contentList,
    checksum,
    locked,
    updateFirstDateId,
    updateLastDateId,
    updateCount,
    updateFiles,
  }) {
    const stmt = this.#db.prepare(`
      INSERT INTO factCourses (
        factKey, subjectId, studentId, schoolId, gradeId,
        teacherId, startDateId, endDateId, homeworkDateId,
        contentList, checksum, locked,
        updateFirstDateId, updateLastDateId, updateCount, updateFiles
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const info = stmt.run(
      factKey,
      subjectId,
      studentId,
      schoolId,
      gradeId,
      teacherId,
      startDateId,
      endDateId,
      homeworkDateId,
      contentList,
      checksum,
      locked ? 1 : 0,
      updateFirstDateId,
      updateLastDateId,
      updateCount,
      updateFiles
    )
    return info.lastInsertRowid
  }

  updateFactCourse({
    factKey,
    subjectId,
    studentId,
    schoolId,
    gradeId,
    teacherId,
    startDateId,
    endDateId,
    homeworkDateId,
    contentList,
    checksum,
    locked,
    updateFirstDateId,
    updateLastDateId,
    updateCount,
    updateFiles,
  }) {
    const stmt = this.#db.prepare(`
      UPDATE factCourses SET
        subjectId = ?, studentId = ?, schoolId = ?, gradeId = ?,
        teacherId = ?, startDateId = ?, endDateId = ?, homeworkDateId = ?,
        contentList = ?, checksum = ?, locked = ?,
        updateFirstDateId = ?, updateLastDateId = ?, updateCount = ?, updateFiles = ?
      WHERE factKey = ?
    `)
    const info = stmt.run(
      subjectId,
      studentId,
      schoolId,
      gradeId,
      teacherId,
      startDateId,
      endDateId,
      homeworkDateId,
      contentList,
      checksum,
      locked ? 1 : 0,
      updateFirstDateId,
      updateLastDateId,
      updateCount,
      updateFiles,
      factKey
    )
    return info.lastInsertRowid
  }

  getFactHomework(factKey) {
    const stmt = this.#db.prepare('SELECT * FROM factHomework WHERE factKey = ?')
    return stmt.get(factKey)
  }

  insertFactHomework(data) {
    const {
      factKey,
      factCourseId,
      studentId,
      schoolId,
      gradeId,
      subjectId,
      dueDateId,
      assignedDateId,
      description,
      formatted,
      requiresSubmission,
      completed,
      completedDateId,
      completionDuration,
      completionState,
      maxCompletionDuration,
      submissionType,
      difficultyLevel,
      backgroundColor,
      publicName,
      themes,
      attachments,
      checksum,
      notificationChecksum,
      updateCount,
      updateFirstDateId,
      updateLastDateId,
      updateFiles,
      temporary = 1,
      json,
      notificationState = this.NOTIFICATION_STATE_WAITING,
      notificationStateDateId = null,
    } = data
    const stmt = this.#db.prepare(`
      INSERT INTO factHomework (
        factKey, factCourseId, studentId, schoolId, gradeId,
        subjectId, dueDateId, assignedDateId, description, formatted, requiresSubmission,
        completed, completedDateId, completionDuration, completionState, maxCompletionDuration,
        submissionType, difficultyLevel, backgroundColor, publicName, themes, attachments,
        checksum, notificationChecksum, updateCount, updateFirstDateId, updateLastDateId, updateFiles, temporary,
        json, notificationState, notificationStateDateId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    try {
      const info = stmt.run(
        factKey,
        factCourseId,
        studentId,
        schoolId,
        gradeId,
        subjectId,
        dueDateId,
        assignedDateId,
        description,
        formatted ? 1 : 0,
        requiresSubmission ? 1 : 0,
        completed ? 1 : 0,
        completedDateId,
        completionDuration,
        completionState,
        maxCompletionDuration,
        submissionType,
        difficultyLevel,
        backgroundColor,
        publicName,
        themes,
        attachments,
        checksum,
        notificationChecksum,
        updateCount,
        updateFirstDateId,
        updateLastDateId,
        updateFiles,
        temporary ? 1 : 0,
        json,
        notificationState,
        notificationStateDateId
      )
      return info.lastInsertRowid
    } catch (e) {
      console.log(e, data)
      throw e
    }
  }

  updateFactHomework(data) {
    const {
      factKey,
      factCourseId,
      studentId,
      schoolId,
      gradeId,
      subjectId,
      dueDateId,
      assignedDateId,
      description,
      formatted,
      requiresSubmission,
      completed,
      completedDateId,
      completionDuration,
      completionState,
      maxCompletionDuration,
      submissionType,
      difficultyLevel,
      backgroundColor,
      publicName,
      themes,
      attachments,
      checksum,
      notificationChecksum,
      updateCount,
      updateFirstDateId,
      updateLastDateId,
      updateFiles,
      temporary = 0,
      json,
    } = data
    const stmt = this.#db.prepare(`
      UPDATE factHomework SET
        factCourseId = ?, studentId = ?, schoolId = ?, gradeId = ?,
        subjectId = ?, dueDateId = ?, assignedDateId = ?, description = ?, formatted = ?, requiresSubmission = ?,
        completed = ?, completedDateId = ?, completionDuration = ?, completionState = ?, maxCompletionDuration = ?,
        submissionType = ?, difficultyLevel = ?, backgroundColor = ?, publicName = ?, themes = ?, attachments = ?,
        checksum= ?, notificationChecksum = ?, updateCount = ?, updateFirstDateId = ?, updateLastDateId = ?, updateFiles = ?,
        temporary = ?, json = ?
      WHERE factKey = ?
    `)
    try {
      const info = stmt.run(
        factCourseId,
        studentId,
        schoolId,
        gradeId,
        subjectId,
        dueDateId,
        assignedDateId,
        description,
        formatted ? 1 : 0,
        requiresSubmission ? 1 : 0,
        completed ? 1 : 0,
        completedDateId,
        completionDuration,
        completionState,
        maxCompletionDuration,
        submissionType,
        difficultyLevel,
        backgroundColor,
        publicName,
        themes,
        attachments,
        checksum,
        notificationChecksum,
        updateCount,
        updateFirstDateId,
        updateLastDateId,
        updateFiles,
        temporary ? 1 : 0,
        json,
        factKey
      )
      return info.changes
    } catch (e) {
      console.log(e, data)
      throw e
    }
  }

  updateFactHomeworkTemporary(factKey, temporary) {
    const stmt = this.#db.prepare(`
      UPDATE factHomework SET
        temporary = ?
      WHERE factKey = ?
    `)
    try {
      const info = stmt.run(temporary ? 1 : 0, factKey)
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
   * Insert a file into the processedFiles table.
   * @param {string} fileId - The ID of the file to insert.
   * @param {string} status - The processing status of the file to insert.
   */
  insertProcessedFile(fileId, status) {
    const stmt = this.#db.prepare('INSERT OR REPLACE INTO processedFiles (fileId, processingStatus) VALUES (?, ?)')
    stmt.run(fileId, status)
  }

  isFileProcessed(fileId) {
    const selectStmt = this.#db.prepare('SELECT processingStatus FROM processedFiles WHERE fileId = ?')
    const result = selectStmt.get(fileId)
    return result?.processingStatus == DataWarehouse.FILE_PROCESSING_STATUS_PROCESSED
  }

  getPushSubscriptions() {
    const stmt = this.#db.prepare('SELECT id, pushEndpoint, pushAuth, pushP256dh, pushExpirationTime FROM users WHERE pushEndpoint IS NOT NULL')
    return stmt.all().map((row) => {
      return {
        id: row.id,
        endpoint: row.pushEndpoint,
        keys: {
          auth: row.pushAuth,
          p256dh: row.pushP256dh,
        },
        expirationTime: row.pushExpirationTime,
      }
    })
  }

  getUserSubscription(userId) {
    const stmt = this.#db.prepare(`
      SELECT pushEndpoint, pushAuth, pushP256dh, pushExpirationTime
      FROM users
      where id = ?
    `)
    const row = stmt.get(userId)
    if (!row) {
      return null
    }
    return {
      endpoint: row.pushEndpoint,
      expirationTime: row.pushExpirationTime,
      keys: {
        auth: row.pushAuth,
        p256dh: row.pushP256dh,
      },
    }
  }

  deleteSubscriptionsByEndpoint(endpoint) {
    const stmt = this.#db.prepare(`
      UPDATE users
      SET pushEndpoint = NULL,
          pushAuth = NULL,
          pushP256dh = NULL,
          pushExpirationTime = NULL
      WHERE pushEndpoint = ?
    `)
    const info = stmt.run(endpoint)
    return info.changes
  }

  deleteUserSubscription(userId) {
    const stmt = this.#db.prepare(`
      UPDATE users
      SET pushEndpoint = NULL,
          pushAuth = NULL,
          pushP256dh = NULL,
          pushExpirationTime = NULL
      WHERE id = ?
    `)
    const info = stmt.run(userId)
    return info.changes
  }

  updateUserSubscription(userId, endpoint, auth, p256dh, expirationTime) {
    const stmt = this.#db.prepare(`
      UPDATE users
      SET pushEndpoint = ?,
          pushAuth = ?,
          pushP256dh = ?,
          pushExpirationTime = ?
      WHERE id = ?
    `)
    // Note: You'll need to pass the user's ID. This is a simplified version
    // that updates the first user. In practice, you should pass the correct user ID
    const info = stmt.run(endpoint, auth, p256dh, expirationTime, userId)
    return info.changes
  }

  updateHomeworkNotificationSent(
    factKey,
    notificationState = this.NOTIFICATION_STATE_SENT,
    notificationStateDateId = null
  ) {
    const stmt = this.#db.prepare(`
      UPDATE factHomework SET
        notificationState = ?, notificationStateDateId = ?
      WHERE factKey = ?
    `)
    const info = stmt.run(notificationState, notificationStateDateId, factKey)
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
        FROM factHomework
        WHERE temporary = 1
        AND updateFirstDateId IN (
          SELECT dateId
          FROM dimDates
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
      DELETE FROM factHomework
      WHERE temporary = 1
      AND updateFirstDateId IN (
        SELECT dateId
        FROM dimDates
        WHERE date < ?
      )
    `)
    const results = stmt.run(dateTime.toISOString())
    return results.changes
  }

  getUserByLogin(login) {
    const stmt = this.#db.prepare('SELECT * FROM users WHERE login = ?')
    return stmt.get(login)
  }

  getUserByLoginAndPassword(login, password) {
    const stmt = this.#db.prepare('SELECT 1 as authenticated, * FROM users WHERE login = ? AND password = ?')
    return stmt.get(login, password)
  }

  getUserById(userId) {
    const stmt = this.#db.prepare('SELECT * FROM users WHERE id = ?')
    return stmt.get(userId)
  }

  createUser({
    login,
    password,
    firstName,
    lastName,
    role = DataWarehouse.USER_ROLE_USER
  }) {
    const stmt = this.#db.prepare(`
      INSERT INTO users (
        login, password, firstName, lastName, role
      ) VALUES (?, ?, ?, ?, ?)
    `)
    const info = stmt.run(
      login,
      password,
      firstName,
      lastName,
      role
    )
    return info.lastInsertRowid
  }

  updateUser(userId, {
    login,
    password,
    firstName,
    lastName,
    role = DataWarehouse.USER_ROLE_USER
  }) {
    const updates = []
    const params = []

    if (login) {
      updates.push('login = ?')
      params.push(login)
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
      throw new Error('No fields to update')
    }

    params.push(userId)

    const stmt = this.#db.prepare(`
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = ?
    `)

    const info = stmt.run(...params)
    return info.changes
  }

  createPronoteStudent({
    name,
    fullName,
    firstName,
    lastName,
    pronoteCasUrl,
    pronoteLogin,
    pronotePassword,
  }) {
    const stmt = this.#db.prepare(`
      INSERT INTO dimStudents (
        name, fullName, firstName, lastName, pronoteCasUrl, pronoteLogin, pronotePassword
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    const info = stmt.run(
      name,
      fullName,
      firstName,
      lastName,
      pronoteCasUrl,
      pronoteLogin,
      pronotePassword,
    )
    return info.lastInsertRowid
  }

  updatePronoteStudent(studentId, {
    name,
    fullName,
    firstName,
    lastName,
    pronoteCasUrl,
    pronoteLogin,
    pronotePassword,
  }) {
    const updates = []
    const params = []

    if (name !== undefined) {
      updates.push('name = ?')
      params.push(name)
    }
    if (fullName !== undefined) {
      updates.push('fullName = ?')
      params.push(fullName)
    }
    if (firstName !== undefined) {
      updates.push('firstName = ?')
      params.push(firstName)
    }
    if (lastName !== undefined) {
      updates.push('lastName = ?')
      params.push(lastName)
    }
    if (pronoteCasUrl !== undefined) {
      updates.push('pronoteCasUrl = ?')
      params.push(pronoteCasUrl)
    }
    if (pronoteLogin) {
      updates.push('pronoteLogin = ?')
      params.push(pronoteLogin)
    }
    if (pronotePassword) {
      updates.push('pronotePassword = ?')
      params.push(pronotePassword)
    }

    if (updates.length === 0) {
      return 0
    }

    params.push(studentId)

    const stmt = this.#db.prepare(`
      UPDATE dimStudents
      SET ${updates.join(', ')}
      WHERE studentId = ?
    `)

    const info = stmt.run(...params)
    return info.changes
  }

  getStudentByName(name) {
    const stmt = this.#db.prepare(`
      SELECT studentId as id, name, pronoteCasUrl,
             pronoteLogin, pronotePassword, firstName, lastName
      FROM dimStudents
      WHERE name = ?
    `)
    return stmt.get(name)
  }

  getStudents() {
    const stmt = this.#db.prepare(`
      SELECT studentId as id, name, pronoteCasUrl,
             pronoteLogin, pronotePassword, firstName, lastName
      FROM dimStudents
      WHERE pronoteLogin IS NOT NULL
    `)
    return stmt.all()
  }

  listUsers() {
    const stmt = this.#db.prepare(`
        u.role, u.createdAt, u.updatedAt
        u.id, u.login, u.firstName, u.lastName,
        u.role, u.createdAt, u.updatedAt
      FROM users u
    `)
    return stmt.all()
  }

  linkUserStudent(userId, studentId) {
    const stmt = this.#db.prepare(`
      INSERT OR IGNORE INTO userStudentsLink (userId, studentId)
      VALUES (?, ?)
    `)
    const info = stmt.run(userId, studentId)
    return info.lastInsertRowid
  }

  getStudentsForUser = (userId) => {
    const stmt = this.#db.prepare(`
      SELECT
        s.studentId as id,
        s.name, s.pronoteCasUrl,
        s.firstName, s.lastName
      FROM dimStudents s
      JOIN userStudentsLink usl ON s.studentId = usl.studentId
      WHERE usl.userId = ?
    `)
    return stmt.all(userId)
  }
}
