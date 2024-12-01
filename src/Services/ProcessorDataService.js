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

  async initStudents(studentsInitializationFile) {
    const config = await import(studentsInitializationFile)
    // Process students first
    const studentIds = {}
    for (const [, studentData] of Object.entries(config.default.students)) {
      const existingStudent = this.#db.getStudentByName(studentData.name)
      const newStudentData = {
        name: studentData.name,
        fullName: `${studentData.firstName} ${studentData.lastName}`,
        firstName: studentData.firstName,
        lastName: studentData.lastName,
        pronoteCasUrl: studentData.pronoteCasUrl,
        pronoteLogin: studentData.pronoteLogin,
        pronotePassword: studentData.pronotePassword
      }
      if (existingStudent) {
        if (this.#verbose) {
          console.log(`Updating student '${studentData.name}'`)
        }
        this.#db.updatePronoteStudent(existingStudent.id, newStudentData)
        studentIds[studentData.name] = existingStudent.id
      } else {
        if (this.#verbose) {
          console.log(`Creating student '${studentData.name}'`)
        }
        const studentId = this.#db.createPronoteStudent(newStudentData)
        studentIds[studentData.name] = studentId
      }
    }

    // Process users and link them to students
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

      // Link account to students
      for (const studentKey of userData.students) {
        const studentId = studentIds[studentKey]
        if (studentId) {
          if (this.#verbose) {
            console.log(`Linking user '${userData.login}' to student '${studentKey}'`)
          }
          this.#db.linkUserStudent(userId, studentId)
        } else {
          console.error(`Student '${studentKey}' not found for user '${userData.login}'`)
        }
      }
    }
  }

  #escapePath = (filename) => {
    return path.basename(filename.replace(/ /g, '_'))
  }

  process() {
    try {
      this.#db.getStudents().forEach((student) => {
        const resultsDir = path.join(this.#resultsDir, this.#escapePath(student.name))
        if (this.#verbose) {
          console.log(`Processing results for ${student.name} in '${resultsDir}'`)
        }
        this.processDirectories(resultsDir)
      })
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
        factKey: course.key,
        studentId,
        schoolId,
        subjectId,
        gradeId,
        teacherId: teacherIds.length > 0 ? teacherIds[0] : null, // Assuming only one teacher is used for simplicity
        startDateId,
        endDateId,
        checksum: course.checksum,
        homeworkDateId,
        contentList: JSON.stringify(course.contentList, null, 2)?.replace(/\00/g, ''),
        locked: course.locked,
        updateCount: 1,
        updateFirstDateId: updateLastDateId,
        updateLastDateId: updateLastDateId,
        updateFiles: JSON.stringify(updateFiles, null, 2)?.replace(/\00/g, ''),
      })
    } else {
      factCourseId = factCourse.factId
      if (course.checksum != factCourse.checksum) {
        updateFiles = JSON.parse(factCourse.updateFiles)
        updateFiles.push({filePath, checksum: course.checksum, id: course.id})
        this.#db.updateFactCourse({
          factKey: course.key,
          studentId,
          schoolId,
          subjectId,
          gradeId,
          teacherId: teacherIds.length > 0 ? teacherIds[0] : null, // Assuming only one teacher is used for simplicity
          startDateId,
          endDateId,
          checksum: course.checksum,
          homeworkDateId,
          contentList: JSON.stringify(course.contentList, null, 2)?.replace(/\00/g, ''),
          locked: course.locked,
          updateFirstDateId: factCourse.updateFirstDateId,
          updateLastDateId: updateLastDateId,
          updateCount: factCourse.updateCount + 1,
          updateFiles: JSON.stringify(updateFiles, null, 2)?.replace(/\00/g, ''),
        })
      }
    }
    if (factCourseId !== null) {
      this.#courseIdFactMapping[course.id] = {
        factId: factCourseId,
        factKey: course.key,
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

    const factCourseKey = this.#courseIdFactMapping?.[homework.plannedCourseId]?.factKey
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
    let completedDateId = factHomework?.completedDateId || null
    let completionState = factHomework?.completionState || DataWarehouse.COMPLETION_STATE_IN_PROGRESS
    let completionDuration = factHomework?.completionDuration || null

    this.#homeworkIds.push({
      homeworkId: homework.id,
      homeworkKey: homeworkKey,
      subject: homework.subject,
      dueDate: homework.dueDate,
      assignedDate: homework.assignedDate,
      submissionType: homework.submissionType,
      description: homework.description,
      plannedCourseId: homework.plannedCourseId,
      courseKey: factCourse?.factKey,
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
        factKey: homeworkKey,
        factCourseId: factCourse?.factId ?? null,
        studentId,
        schoolId,
        gradeId,
        subjectId,
        dueDateId,
        assignedDateId,
        description: homework.description,
        formatted: homework.formatted,
        requiresSubmission: homework.requiresSubmission,
        submissionType: homework.submissionType,
        difficultyLevel: homework.difficultyLevel,
        completed: homework.completed,
        completedDateId,
        completionDuration,
        completionState,
        maxCompletionDuration,
        backgroundColor: homework.backgroundColor,
        publicName: homework.publicName,
        themes: JSON.stringify(homework.themes, null, 2)?.replace(/\00/g, ''),
        attachments: JSON.stringify(homework.attachments, null, 2)?.replace(/\00/g, ''),
        checksum: homework.checksum,
        notificationChecksum: homework.notificationChecksum,
        updateCount: 1,
        updateFirstDateId: updateLastDateId,
        updateLastDateId: updateLastDateId,
        updateFiles: JSON.stringify(updateFiles, null, 2)?.replace(/\00/g, ''),
        json: JSON.stringify(homework.json, null, 2)?.replace(/\00/g, ''),
      })
      this.#notificationsService.stackHomeworkNotification(homework, 'new')
    } else if (homework.checksum != factHomework.checksum) {
      updateFiles = JSON.parse(factHomework.updateFiles)
      updateFiles.push({
        filePath,
        checksum: homework.checksum,
        id: homework.id,
      })
      this.#db.updateFactHomework({
        factKey: homeworkKey,
        factCourseId: factCourse?.factId ?? null,
        studentId,
        schoolId,
        gradeId,
        subjectId,
        dueDateId,
        assignedDateId,
        description: homework.description,
        formatted: homework.formatted,
        requiresSubmission: homework.requiresSubmission,
        completed: homework.completed,
        completedDateId,
        completionDuration,
        completionState,
        maxCompletionDuration,
        submissionType: homework.submissionType,
        difficultyLevel: homework.difficultyLevel,
        backgroundColor: homework.backgroundColor,
        publicName: homework.publicName,
        themes: JSON.stringify(homework.themes, null, 2)?.replace(/\00/g, ''),
        attachments: JSON.stringify(homework.attachments, null, 2)?.replace(/\00/g, ''),
        checksum: homework.checksum,
        notificationChecksum: homework.notificationChecksum,
        temporary: 0,
        updateFirstDateId: factHomework.updateFirstDateId,
        updateLastDateId: updateLastDateId,
        updateCount: factHomework.updateCount + 1,
        updateFiles: JSON.stringify(updateFiles, null, 2)?.replace(/\00/g, ''),
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
      courseKey: factCourse?.factKey,
    }
    return Utils.md5sum(data)
  }
}
