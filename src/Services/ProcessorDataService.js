import path from 'path'
import fs from 'fs'
import HomeworkConverter from '#pronote/Converter/HomeworkConverter.js'
import CourseConverter from '#pronote/Converter/CourseConverter.js'
import DataWarehouse from '#pronote/Database/DataWarehouse.js'
import DateWrapper from '#pronote/Utils/DateWrapper.js'
import Utils from '#pronote/Utils/Utils.js'
import NotificationsService from '#pronote/Services/NotificationsService.js'

export default class ProcessorDataService {
  /** @type {DataWarehouse} */
  #db
  /** @type {NotificationsService} */
  #notificationsService
  #verbose = false
  #debug = false
  #homeworkConverter
  #courseConverter

  #resultsDir = ''
  #studentId = null
  #schoolId = null
  #gradeId = null
  #crawlDate = null

  #globalKnownHomeworkUniqueId = {}

  // per result directory attributes
  #courseIdFactMapping = {}
  #unknownCompletionIds = []
  #duplicatedIds = []
  #homeworkUniqueId = {}
  #homeworkIds = []
  #knownHomeworkUniqueId = {}
  #newHomeworkKeys = []
  #deletedHomeworkKeys = []

  constructor(db, notificationsService, resultsDir, debug, verbose) {
    this.#db = db
    this.#notificationsService = notificationsService
    this.#resultsDir = resultsDir
    this.#homeworkConverter = new HomeworkConverter()
    this.#courseConverter = new CourseConverter(debug, verbose)
    this.#courseIdFactMapping = {}
    this.#debug = debug
    this.#verbose = verbose
  }

  createDatabase() {
    this.#db.createSchema()
  }

  async initAccounts(accountsInitializationFile) {
    const config = await import(accountsInitializationFile)
    // Process accounts first
    const accountIds = {}
    for (const [, accountData] of Object.entries(config.default.accounts)) {
      const existingAccount = this.#db.getPronoteAccountByName(accountData.name)
      const newAccountData = {
        name: accountData.name,
        firstName: accountData.firstName,
        lastName: accountData.lastName,
        cas_url: accountData.casUrl,
        pronote_login: accountData.login,
        pronote_password: accountData.password
      }
      if (existingAccount) {
        if (this.#verbose) {
          console.log(`Updating account '${accountData.name}'`)
        }
        this.#db.updatePronoteAccount(existingAccount.id, newAccountData)
        accountIds[accountData.name] = existingAccount.id
      } else {
        if (this.#verbose) {
          console.log(`Creating account '${accountData.name}'`)
        }
        const accountId = this.#db.createPronoteAccount(newAccountData)
        accountIds[accountData.name] = accountId
      }
    }

    // Process users and link them to accounts
    for (const [, userData] of Object.entries(config.default.users)) {
      const existingUser = this.#db.getUserByLogin(userData.login)
      let userId
      const newUserData = {
        login: userData.login,
        password: userData.password,
        firstName: userData.firstName ?? userData.login,
        lastName: userData.lastName ?? userData.login,
        role: userData.role ?? 'user'
      }
      if (existingUser) {
        if (this.#verbose) {
          console.log(`Updating user '${userData.login}'`)
        }
        this.#db.updateUser(existingUser.id, newUserData)
        userId = existingUser.id
      } else {
        if (this.#verbose) {
          console.log(`Creating user '${userData.login}'`)
        }
        userId = this.#db.createUser(newUserData)
      }

      // Link user to accounts
      for (const accountKey of userData.accounts) {
        const accountId = accountIds[accountKey]
        if (accountId) {
          if (this.#verbose) {
            console.log(`Linking user '${userData.login}' to account '${accountKey}'`)
          }
          this.#db.linkUserAccount(userId, accountId)
        }
      }
    }
  }

  process() {
    try {
      this.processDirectories(this.#resultsDir)
    } catch (error) {
      console.error('Unable to connect to the database:', error)
    }
    try {
      this.#notificationsService.sendNotifications()
    } catch (error) {
      console.error('Some notifications failed to be sent:', error)
    }
  }

  processDirectories(resultsDir) {
    const subDirs = fs.readdirSync(resultsDir, {withFileTypes: true})
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name)

    subDirs.forEach((subDir) => {
      const studentInfoPath = path.join(resultsDir, subDir, 'studentInfo.json')
      const coursesPath = path.join(resultsDir, subDir, 'cahierDeTexte-courses.json')
      const homeworksPath = path.join(resultsDir, subDir, 'cahierDeTexte-travailAFaire.json')
      this.#duplicatedIds = []
      this.#unknownCompletionIds = []
      this.#courseIdFactMapping = {}

      if (!fs.existsSync(studentInfoPath) || !fs.existsSync(coursesPath) || !fs.existsSync(homeworksPath)) {
        console.error(`Missing one or more file in directory '${subDir}'`)
        return
      }

      if (
        this.#db.isFileProcessed(studentInfoPath) &&
        this.#db.isFileProcessed(coursesPath) &&
        this.#db.isFileProcessed(homeworksPath)
      ) {
        console.info(`Files in directory '${subDir}' are already processed`)
        return
      }

      console.info(`Processing files in directory '${subDir}' ...`)
      this.#db.insertProcessedFile(studentInfoPath, DataWarehouse.FILE_PROCESSING_STATUS_WAITING)
      this.#db.insertProcessedFile(homeworksPath, DataWarehouse.FILE_PROCESSING_STATUS_WAITING)
      this.#db.insertProcessedFile(coursesPath, DataWarehouse.FILE_PROCESSING_STATUS_WAITING)

      try {
        console.info(`Processing '${studentInfoPath}' ...`)
        const studentInfoContent = JSON.parse(fs.readFileSync(studentInfoPath, 'utf8'))
        this.#crawlDate = new DateWrapper(studentInfoContent.crawlDate)
        this.processStudentInfo(studentInfoContent)
      } catch (error) {
        console.error(`Unable to process file '${studentInfoPath}' :`, error)
        this.#db.insertProcessedFile(studentInfoPath, DataWarehouse.FILE_PROCESSING_STATUS_ERROR)
        return
      }

      try {
        console.info(`Processing '${coursesPath}' ...`)
        const coursesContent = JSON.parse(fs.readFileSync(coursesPath, 'utf8'))
        this.processCourses(coursesPath, coursesContent)
      } catch (error) {
        console.error(`Unable to process file '${coursesPath}' :`, error)
        this.#db.insertProcessedFile(coursesPath, DataWarehouse.FILE_PROCESSING_STATUS_ERROR)
        return
      }

      try {
        console.info(`Processing '${homeworksPath}' ...`)

        const homeworksContent = JSON.parse(fs.readFileSync(homeworksPath, 'utf8'))
        this.processHomeworks(homeworksPath, homeworksContent)
        const homeworkIdsPath = path.join(resultsDir, subDir, 'homeworkIds.json')
        console.info(`Writing ${homeworkIdsPath} ...`)
        fs.writeFileSync(homeworkIdsPath, JSON.stringify(this.#homeworkIds, null, 2), 'utf8')
      } catch (error) {
        console.error(`Unable to process file '${homeworksPath}' :`, error)
        this.#db.insertProcessedFile(homeworksPath, DataWarehouse.FILE_PROCESSING_STATUS_ERROR)
        return
      }

      if (this.#duplicatedIds.length > 0) {
        console.warn(`${this.#duplicatedIds.length} duplicated IDs found in '${subDir}'`)
      }
      if (this.#unknownCompletionIds.length > 0) {
        console.warn(
          `${this.#unknownCompletionIds.length} homeworks already completed before being inserted found in '${subDir}'`
        )
      }

      // remove Homeworks that were marked as temporary before this crawlDate and that are still temporary
      let temporaryHomeworksToRemove = this.#db.reportTemporaryHomeworks(this.#crawlDate)
      temporaryHomeworksToRemove = temporaryHomeworksToRemove.map((homework) => {
        homework.json = JSON.parse(homework.json)
        return homework
      })
      const deletedHomeworkCount = this.#db.removeTemporaryHomeworks(this.#crawlDate)
      if (deletedHomeworkCount > 0) {
        console.info(`Removed ${deletedHomeworkCount} temporary homeworks in '${subDir}'`)
      }

      // write errors report
      const errorsReportPath = path.join(resultsDir, subDir, 'errorsReport.json')
      const data = {
        duplicatedIds: this.#duplicatedIds,
        unknownCompletionIds: this.#unknownCompletionIds,
        deletedHomeworkKeys: this.#deletedHomeworkKeys,
        newHomeworkKeys: this.#newHomeworkKeys,
        temporaryHomeworksToRemove: temporaryHomeworksToRemove,
      }
      fs.writeFileSync(errorsReportPath, JSON.stringify(data, null, 2), 'utf8')
      console.info(`Writing ${errorsReportPath} ...`)

      // mark file processed only at the end as all files need to re parsed every time
      this.#db.insertProcessedFile(studentInfoPath, DataWarehouse.FILE_PROCESSING_STATUS_PROCESSED)
      this.#db.insertProcessedFile(homeworksPath, DataWarehouse.FILE_PROCESSING_STATUS_PROCESSED)
      this.#db.insertProcessedFile(coursesPath, DataWarehouse.FILE_PROCESSING_STATUS_PROCESSED)
    })
  }

  processStudentInfo(studentInfo) {
    this.#studentId = this.#db.getStudentId(studentInfo.name)
    if (!this.#studentId) {
      this.#studentId = this.#db.insertStudent(studentInfo.name)
    }
    this.#schoolId = this.#db.getSchoolId(studentInfo.school)
    if (!this.#schoolId) {
      this.#schoolId = this.#db.insertSchool(studentInfo.school)
    }
    this.#gradeId = this.#db.getGradeId(studentInfo.grade)
    if (!this.#gradeId) {
      this.#gradeId = this.#db.insertGrade(studentInfo.grade)
    }
  }

  processCourses(filePath, data) {
    const items = this.#courseConverter.fromPronote(data)
    // Log the items to debug
    if (this.#debug) {
      console.debug('Converted Items:', items)
    }

    // Check if items is empty
    if (items.length === 0) {
      console.warn(`No items found in '${filePath}'`)
    }

    // Process each item in ListeCahierDeTextes
    for (const [, course] of Object.entries(items.courses)) {
      this.insertCourse(course, this.#schoolId, this.#gradeId, this.#studentId, filePath)
    }
  }

  processHomeworks(filePath, data) {
    this.#homeworkUniqueId = {}
    this.#homeworkIds = []
    this.#knownHomeworkUniqueId = {}
    this.#newHomeworkKeys = []
    this.#deletedHomeworkKeys = []

    const homeworks = this.#homeworkConverter.fromPronote(data)

    // Process each homework in travailAFaire
    for (const [, homework] of Object.entries(homeworks)) {
      this.insertHomework(homework, this.#schoolId, this.#gradeId, this.#studentId, filePath)
    }

    // Diff globalKnownHomeworkUniqueId with knownHomeworkUniqueId
    this.#newHomeworkKeys = Object.keys(this.#knownHomeworkUniqueId).filter(
      (key) => !(key in this.#globalKnownHomeworkUniqueId)
    )
    this.#deletedHomeworkKeys = Object.keys(this.#globalKnownHomeworkUniqueId).filter(
      (key) => !(key in this.#knownHomeworkUniqueId)
    )
    console.log(`${Object.keys(this.#knownHomeworkUniqueId).length} unique IDs found in '${filePath}'`)
    if (this.#newHomeworkKeys.length > 0) {
      console.warn(`${this.#newHomeworkKeys.length} new unique IDs found in '${filePath}'`)
    }
    if (this.#deletedHomeworkKeys.length > 0) {
      console.warn(`${this.#deletedHomeworkKeys.length} unique IDs deleted in '${filePath}'`)
    }
    // add new keys to globalKnownHomeworkUniqueId
    this.#newHomeworkKeys.forEach((key) => {
      this.#globalKnownHomeworkUniqueId[key] = this.#knownHomeworkUniqueId[key]
    })
    // remove deleted keys from globalKnownHomeworkUniqueId
    this.#deletedHomeworkKeys.forEach((key) => {
      delete this.#globalKnownHomeworkUniqueId[key]
    })
  }

  insertCourse(course, schoolId, gradeId, studentId, filePath) {
    // Insert course
    let subjectId = this.#db.getSubjectId(course.subject)
    if (!subjectId) {
      subjectId = this.#db.insertSubject({
        subject: course.subject,
        backgroundColor: course.backgroundColor,
      })
    }

    // Insert teachers
    const teacherIds = []
    course.teacherList.forEach((teacher) => {
      let teacherId = this.#db.getTeacherId(teacher, subjectId)
      if (!teacherId) {
        teacherId = this.#db.insertTeacher(teacher, subjectId)
      }
      teacherIds.push(teacherId)
    })

    // Insert dates
    const startDateId = this.#db.getOrInsertDate(course?.startDate)
    const endDateId = this.#db.getOrInsertDate(course?.endDate)
    const homeworkDateId = this.#db.getOrInsertDate(course?.homeworkDate)
    const updateLastDateId = this.#db.getOrInsertDate(this.#crawlDate)

    // Insert fact course
    const factCourse = this.#db.getFactCourse(course.key)
    let updateFiles = []
    let factCourseId = null
    if (typeof factCourse === 'undefined') {
      updateFiles.push({filePath, checksum: course.checksum, id: course.id})
      factCourseId = this.#db.insertFactCourse({
        fact_key: course.key,
        student_id: studentId,
        school_id: schoolId,
        subject_id: subjectId,
        grade_id: gradeId,
        teacher_id: teacherIds.length > 0 ? teacherIds[0] : null, // Assuming only one teacher is used for simplicity
        start_date_id: startDateId,
        end_date_id: endDateId,
        checksum: course.checksum,
        homework_date_id: homeworkDateId,
        content_list: JSON.stringify(course.contentList, null, 2)?.replace(/\00/g, ''),
        locked: course.locked,
        update_count: 1,
        update_first_date_id: updateLastDateId,
        update_last_date_id: updateLastDateId,
        update_files: JSON.stringify(updateFiles, null, 2)?.replace(/\00/g, ''),
      })
    } else {
      factCourseId = factCourse.fact_id
      if (course.checksum != factCourse.checksum) {
        updateFiles = JSON.parse(factCourse.update_files)
        updateFiles.push({filePath, checksum: course.checksum, id: course.id})
        this.#db.updateFactCourse({
          fact_key: course.key,
          student_id: studentId,
          school_id: schoolId,
          subject_id: subjectId,
          grade_id: gradeId,
          teacher_id: teacherIds.length > 0 ? teacherIds[0] : null, // Assuming only one teacher is used for simplicity
          start_date_id: startDateId,
          end_date_id: endDateId,
          checksum: course.checksum,
          homework_date_id: homeworkDateId,
          content_list: JSON.stringify(course.contentList, null, 2)?.replace(/\00/g, ''),
          locked: course.locked,
          update_first_date_id: factCourse.update_first_date_id,
          update_last_date_id: updateLastDateId,
          update_count: factCourse.update_count + 1,
          update_files: JSON.stringify(updateFiles, null, 2)?.replace(/\00/g, ''),
        })
      }
    }
    if (factCourseId !== null) {
      this.#courseIdFactMapping[course.id] = {
        fact_id: factCourseId,
        fact_key: course.key,
      }
    }
  }

  insertHomework(homework, schoolId, gradeId, studentId, filePath) {
    // Insert homework
    let subjectId = this.#db.getSubjectId(homework.subject)
    if (!subjectId) {
      subjectId = this.#db.insertSubject({
        subject: homework.subject,
        backgroundColor: homework.backgroundColor,
      })
    }

    // Insert dates
    const dueDate = homework?.dueDate ? DateWrapper.parseDate(homework.dueDate) : null
    if (dueDate !== null) {
      dueDate.setHour(8)
    }
    const dueDateTolerance = dueDate ? dueDate.clone().add(1, 'days') : null
    const dueDateId = this.#db.getOrInsertDate(dueDate)
    const threeDaysAfterDueDate = dueDate.clone().add(3, 'days')
    const assignedDate = homework?.dueDate ? DateWrapper.parseDate(homework.assignedDate) : null
    if (assignedDate !== null) {
      assignedDate.setHour(8)
    }
    const assignedDateId = this.#db.getOrInsertDate(assignedDate)
    const maxCompletionDuration = dueDate !== null && assignedDate !== null ? dueDate.diff(assignedDate, 'second') : null
    const updateLastDateId = this.#db.getOrInsertDate(this.#crawlDate)

    const factCourseKey = this.#courseIdFactMapping?.[homework.plannedCourseId]?.fact_key
    let factCourse = null
    if (factCourseKey !== null) {
      factCourse = this.#db.getFactCourse(factCourseKey)
    } else {
      console.log(`Course ${homework.plannedCourseId} not found in #courseIdFactMapping`)
    }

    // Insert fact homework
    const homeworkKey = this.computeHomeworkUniqueId(homework, factCourse, filePath)
    homework.factKey = homeworkKey
    this.#knownHomeworkUniqueId[homeworkKey] = homework.id
    const factHomework = this.#db.getFactHomework(homeworkKey)
    let updateFiles = []
    let completedDateId = factHomework?.completed_date_id || null
    let completionState = factHomework?.completion_state || DataWarehouse.COMPLETION_STATE_IN_PROGRESS
    let completionDuration = factHomework?.completion_duration || null

    this.#homeworkIds.push({
      homeworkId: homework.id,
      homeworkKey: homeworkKey,
      subject: homework.subject,
      dueDate: homework.dueDate,
      assignedDate: homework.assignedDate,
      submissionType: homework.submissionType,
      description: homework.description,
      plannedCourseId: homework.plannedCourseId,
      courseKey: factCourse?.fact_key,
    })
    if (completionState === DataWarehouse.COMPLETION_STATE_IN_PROGRESS) {
      if (homework.completed) {
        if (typeof factHomework === 'undefined') {
          if (this.#verbose) {
            console.log(
              `Homework ${homework.id} is completed before being inserted, cannot compute completion duration`
            )
          }
          this.#unknownCompletionIds.push(homework.id)

          completionState = DataWarehouse.COMPLETION_STATE_UNKNOWN
        } else {
          completedDateId = this.#db.getOrInsertDate(this.#crawlDate)
          completionDuration = this.#crawlDate.diff(assignedDate, 'second')
          if (this.#crawlDate.isAfter(dueDateTolerance)) {
            completionState = DataWarehouse.COMPLETION_STATE_OVER_DUE
          } else {
            completionState = DataWarehouse.COMPLETION_STATE_COMPLETED
          }
        }
      } else if (this.#crawlDate.isAfter(threeDaysAfterDueDate)) {
        completionState = DataWarehouse.COMPLETION_STATE_OVER_DUE
        completedDateId = this.#db.getOrInsertDate(this.#crawlDate)
        completionDuration = this.#crawlDate.diff(assignedDate, 'second')
      }
    }

    if (typeof factHomework === 'undefined') {
      updateFiles.push({
        filePath,
        checksum: homework.checksum,
        id: homework.id,
      })
      this.#db.insertFactHomework({
        fact_key: homeworkKey,
        fact_course_id: factCourse?.fact_id ?? null,
        student_id: studentId,
        school_id: schoolId,
        grade_id: gradeId,
        subject_id: subjectId,
        due_date_id: dueDateId,
        assigned_date_id: assignedDateId,
        description: homework.description,
        formatted: homework.formatted,
        requires_submission: homework.requiresSubmission,
        submission_type: homework.submissionType,
        difficulty_level: homework.difficultyLevel,
        completed: homework.completed,
        completed_date_id: completedDateId,
        completion_duration: completionDuration,
        completion_state: completionState,
        max_completion_duration: maxCompletionDuration,
        background_color: homework.backgroundColor,
        public_name: homework.publicName,
        themes: JSON.stringify(homework.themes, null, 2)?.replace(/\00/g, ''),
        attachments: JSON.stringify(homework.attachments, null, 2)?.replace(/\00/g, ''),
        checksum: homework.checksum,
        notification_checksum: homework.notificationChecksum,
        update_count: 1,
        update_first_date_id: updateLastDateId,
        update_last_date_id: updateLastDateId,
        update_files: JSON.stringify(updateFiles, null, 2)?.replace(/\00/g, ''),
        json: JSON.stringify(homework.json, null, 2)?.replace(/\00/g, ''),
      })
      this.#notificationsService.stackHomeworkNotification(homework, 'new')
    } else if (homework.checksum != factHomework.checksum) {
      updateFiles = JSON.parse(factHomework.update_files)
      updateFiles.push({
        filePath,
        checksum: homework.checksum,
        id: homework.id,
      })
      this.#db.updateFactHomework({
        fact_key: homeworkKey,
        fact_course_id: factCourse?.fact_id ?? null,
        student_id: studentId,
        school_id: schoolId,
        grade_id: gradeId,
        subject_id: subjectId,
        due_date_id: dueDateId,
        assigned_date_id: assignedDateId,
        description: homework.description,
        formatted: homework.formatted,
        requires_submission: homework.requiresSubmission,
        completed: homework.completed,
        completed_date_id: completedDateId,
        completion_duration: completionDuration,
        completion_state: completionState,
        max_completion_duration: maxCompletionDuration,
        submission_type: homework.submissionType,
        difficulty_level: homework.difficultyLevel,
        background_color: homework.backgroundColor,
        public_name: homework.publicName,
        themes: JSON.stringify(homework.themes, null, 2)?.replace(/\00/g, ''),
        attachments: JSON.stringify(homework.attachments, null, 2)?.replace(/\00/g, ''),
        checksum: homework.checksum,
        notification_checksum: homework.notificationChecksum,
        temporary: 0,
        update_first_date_id: factHomework.update_first_date_id,
        update_last_date_id: updateLastDateId,
        update_count: factHomework.update_count + 1,
        update_files: JSON.stringify(updateFiles, null, 2)?.replace(/\00/g, ''),
        json: JSON.stringify(homework.json, null, 2)?.replace(/\00/g, ''),
      })
      // TODO do not send notification if only change is homework completed state
      this.#notificationsService.stackHomeworkNotification(homework, 'updated')
    } else {
      this.#db.updateFactHomeworkTemporary(homeworkKey, 0)
    }
  }

  computeHomeworkUniqueId(homework, factCourse, filePath) {
    try {
      let uniqueId = this.getHomeworkUniqueId(homework, factCourse)
      if (uniqueId in this.#homeworkUniqueId) {
        let i = 1
        while (`${uniqueId}-${i}` in this.#homeworkUniqueId) {
          i++
        }
        this.#duplicatedIds.push({
          homeworkId: homework.id,
          homeworkIdUsingConflictedUniqueId: this.#homeworkUniqueId[uniqueId],
          uniqueId: uniqueId,
          filePath,
          factCourse,
          homework,
        })
        uniqueId = `${uniqueId}-${i}`
        console.warn(
          `Duplicated unique ID for homework ID '${homework.id}' in '${filePath}' - new unique ID: '${uniqueId}'`
        )
      }
      this.#homeworkUniqueId[uniqueId] = homework.id
      return uniqueId
    } catch (e) {
      console.error(e)
      throw new Error(`Error computing unique ID for homework ID '${homework.id}' in '${filePath}'`)
    }
  }

  getHomeworkUniqueId(homeworkItem, factCourse) {
    // if subject is changed, let's consider it's a different homework
    const data = {
      subject: homeworkItem.subject,
      dueDate: homeworkItem.dueDate,
      assignedDate: homeworkItem.assignedDate,
      submissionType: homeworkItem.submissionType,
      description: homeworkItem.description,
      courseKey: factCourse?.fact_key,
    }
    return Utils.md5sum(data)
  }
}
