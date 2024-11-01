import path from 'path';
import fs from 'fs';
import HomeworkConverter from "#pronote/Converter/HomeworkConverter.js";
import CourseConverter from "#pronote/Converter/CourseConverter.js";
import DataWarehouse from '#pronote/Database/DataWarehouse.js';
import DateWrapper from '#pronote/Utils/DateWrapper.js';

export default class DataProcessor {
  /**
   * @type {DataWarehouse}
   * @private
   */
  #db
  #verbose = false
  #homeworkConverter
  #courseConverter
  #resultsDir = "";
  #studentId = null;
  #schoolId = null;
  #gradeId = null;
  #courseIdFactMapping = {};
  #homeworkUniqueId = {};
  
  constructor(db, resultsDir, verbose) {
    this.#db = db
    this.#resultsDir = resultsDir
    this.#homeworkConverter = new HomeworkConverter();
    this.#courseConverter = new CourseConverter(verbose);
    this.#courseIdFactMapping = {};
    this.#verbose = verbose;
  }

  process() {
    try {
      this.#db.createSchema()

      this.processFiles(this.#resultsDir, 'studentInfo.json', this.processStudentInfoCallback.bind(this));
      this.processFiles(this.#resultsDir, 'cahierDeTexte-courses.json', this.processCoursesCallback.bind(this));
      this.processFiles(this.#resultsDir, 'cahierDeTexte-travailAFaire.json', this.processHomeworksCallback.bind(this));
    } catch (error) {
      console.error('Unable to connect to the database:', error)
    }
  }

  processFiles(resultsDir, fileType, callback) {
    const subDirs = fs.readdirSync(resultsDir);

    subDirs.forEach(subDir => {
      const subFilePath = path.join(subDir, fileType);
      const filePath = path.join(resultsDir, subFilePath);
      if (fs.existsSync(filePath)) {
        if (this.#db.isFileProcessed(subFilePath)) {
          console.info(`File '${filePath}' already processed`);
          return;
        }
        console.info(`Processing file '${filePath}' ...`);
        this.#db.insertProcessedFile(subFilePath, DataWarehouse.FILE_PROCESSING_STATUS_WAITING);

        // Read and parse the JSON file
        const fileContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        try {
          callback(resultsDir, subDir, filePath, fileContent);
        } catch (error) {
          console.error(`Unable to process file ${filePath}:`, error)
          this.#db.insertProcessedFile(subFilePath, DataWarehouse.FILE_PROCESSING_STATUS_ERROR);
          return
        }
        this.#db.insertProcessedFile(subFilePath, DataWarehouse.FILE_PROCESSING_STATUS_PROCESSED);
      }
    });
  }

  processStudentInfoCallback(resultsDir, subDir, filePath, studentInfo) {
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

  processCoursesCallback(resultsDir, subDir, filePath, data) {
    const items = this.#courseConverter.fromPronote(data)
    // Log the items to debug
    if (this.#verbose) {
      console.debug('Converted Items:', items);
    }

    // Check if items is empty
    if (items.length === 0) {
      console.warn(`No items found in '${filePath}'`);
    }

    const targetFile = path.join(resultsDir, subDir, "courses.json")
    const jsonString = JSON.stringify(items, null, 2).replace(/\00/g,'');
    fs.writeFileSync(targetFile, jsonString, 'utf8', err => {
      if (err) {
        console.error(err);
        process.exit(1);
      } else {
        console.log(`Result written into '${targetFile}'`);
      }
    });
    
    // Process each item in ListeCahierDeTextes
    for (const [_, course] of Object.entries(items.courses)) {
      this.insertCourse(
        course, 
        data?.crawlDate ?? false, 
        this.#schoolId, this.#gradeId, this.#studentId, filePath
      );
    }
  }

  processHomeworksCallback(resultsDir, subDir, filePath, data) {
    this.#homeworkUniqueId = {};

    const homeworks = this.#homeworkConverter.fromPronote(data)

    // Process each homework in travailAFaire
    for (const [_, homework] of Object.entries(homeworks)) {
      this.insertHomework(
        homework, 
        data?.crawlDate ?? false,
        this.#schoolId, this.#gradeId, this.#studentId, filePath
      );
    }
  }

  

  insertCourse(course, crawlDate, schoolId, gradeId, studentId, filePath) {
    // Insert course
    let subjectId = this.#db.getSubjectId(course.subject);
    if (!subjectId) {
      subjectId = this.#db.insertSubject({
        subject: course.subject,
        backgroundColor: course.backgroundColor
      });
    }

    // Insert teachers
    const teacherIds = [];
    course.teacherList.forEach(teacher => {
      let teacherId = this.#db.getTeacherId(teacher, subjectId);
      if (!teacherId) {
        teacherId = this.#db.insertTeacher(teacher, subjectId);
      }
      teacherIds.push(teacherId);
    });

    // Insert dates
    let startDateId = this.#db.getDateId(course.startDate);
    if (!startDateId && course.startDate !== null) {
      const startDate = DateWrapper.parseDate(course.startDate);
      if (startDate !== null) {
        startDateId = this.#db.insertDate(startDate);
      }
    }

    let endDateId = this.#db.getDateId(course.endDate);
    if (!endDateId && course.endDate !== null) {
      const endDate = DateWrapper.parseDate(course.endDate);
      if (endDate !== null) {
        endDateId = this.#db.insertDate(endDate);
      }
    }

    let homeworkDateId = this.#db.getDateId(course.homeworkDate);
    if (!homeworkDateId && course.homeworkDate !== null) {
      const homeworkDate = DateWrapper.parseDate(course.homeworkDate);
      if (homeworkDate !== null) {
        homeworkDateId = this.#db.insertDate(homeworkDate);
      }
    }

    let updateLastDate = crawlDate ? new DateWrapper(crawlDate) : new DateWrapper();
    let updateLastDateId = this.#db.getDateId(updateLastDate);
    if (!updateLastDateId) {
      updateLastDateId = this.#db.insertDate(updateLastDate);
    }
    
    // Insert fact course
    let factCourse = this.#db.getFactCourse(course.key);
    let updateFiles = [];
    let factCourseId = null;
    if (typeof factCourse === 'undefined') {
      updateFiles.push({filePath, checksum: course.checksum, id: course.id});
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
        content_list: JSON.stringify(course.contentList, null, 2)?.replace(/\00/g,''),
        locked: course.locked,
        update_count: 1,
        update_first_date_id: updateLastDateId, 
        update_last_date_id: updateLastDateId,
        update_files: JSON.stringify(updateFiles, null, 2)?.replace(/\00/g,''),
      });
    } else if (course.checksum != factCourse.checksum) {
      updateFiles = JSON.parse(factCourse.update_files);
      updateFiles.push({filePath, checksum: course.checksum, id: course.id});
      factCourseId = this.#db.updateFactCourse({
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
        content_list: JSON.stringify(course.contentList, null, 2)?.replace(/\00/g,''),
        locked: course.locked,
        update_first_date_id: factCourse.update_first_date_id,
        update_last_date_id: updateLastDateId,
        update_count: factCourse.update_count + 1,
        update_files: JSON.stringify(updateFiles, null, 2)?.replace(/\00/g,''),
      });
    }
    if (factCourseId !== null) {
      this.#courseIdFactMapping[course.id] = {fact_id: factCourseId, fact_key: course.key};
    }
  }

  insertHomework(homework, crawlDate, schoolId, gradeId, studentId, filePath) {
    // Insert homework
    let subjectId = this.#db.getSubjectId(homework.subject);
    if (!subjectId) {
      subjectId = this.#db.insertSubject({
        subject: homework.subject,
        backgroundColor: homework.backgroundColor
      });
    }

    // Insert dates
    let dueDateId = this.#db.getDateId(homework.dueDate);
    if (!dueDateId && homework.dueDate !== null) {
      const dueDate = DateWrapper.parseDate(homework.dueDate);
      if (dueDate !== null) {
        dueDateId = this.#db.insertDate(dueDate);
      }
    }

    let assignedDateId = this.#db.getDateId(homework.assignedDate);
    if (!assignedDateId && homework.assignedDate !== null) {
      const assignedDate = DateWrapper.parseDate(homework.assignedDate);
      if (assignedDate !== null) {
        assignedDateId = this.#db.insertDate(assignedDate);
      }
    }

    let updateLastDate = crawlDate ? new DateWrapper(crawlDate) : new DateWrapper();
    let updateLastDateId = this.#db.getDateId(updateLastDate);
    if (!updateLastDateId) {
      updateLastDateId = this.#db.insertDate(updateLastDate);
    }

    const factCourseKey = this.#courseIdFactMapping?.[homework.plannedCourseId]?.fact_key;
    let factCourse = null;
    if (factCourseKey !== null) {
      factCourse = this.#db.getFactCourse(factCourseKey);
    } else {
      console.log(`Course ${homework.plannedCourseId} not found in #courseIdFactMapping`);
    }
    
    // Insert fact homework
    const homeworkKey = this.computeHomeworkUniqueId(homework, factCourse, filePath);
    let factHomework = this.#db.getFactHomework(homeworkKey);
    let updateFiles = [];
    let factHomeworkId = null;
    if (typeof factHomework === 'undefined') {
      updateFiles.push({filePath, checksum: homework.checksum, id: homework.id});
      factHomeworkId = this.#db.insertFactHomework({
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
        submission_type: homework.submissionType,
        difficulty_level: homework.difficultyLevel,
        duration: homework.duration,
        background_color: homework.backgroundColor,
        public_name: homework.publicName,
        themes: JSON.stringify(homework.themes, null, 2)?.replace(/\00/g,''),
        attachments: JSON.stringify(homework.attachments, null, 2)?.replace(/\00/g,''),
        checksum: homework.checksum,
        update_count: 1,
        update_first_date_id: updateLastDateId,
        update_last_date_id: updateLastDateId,
        update_files: JSON.stringify(updateFiles, null, 2)?.replace(/\00/g,''),
      });
    } else if (homework.checksum != factHomework.checksum) {
      updateFiles = JSON.parse(factHomework.update_files);
      updateFiles.push({filePath, checksum: homework.checksum, id: homework.id});
      factHomeworkId = this.#db.updateFactHomework({
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
        submission_type: homework.submissionType,
        difficulty_level: homework.difficultyLevel,
        duration: homework.duration,
        background_color: homework.backgroundColor,
        public_name: homework.publicName,
        themes: JSON.stringify(homework.themes, null, 2)?.replace(/\00/g,''),
        attachments: JSON.stringify(homework.attachments, null, 2)?.replace(/\00/g,''),
        checksum: homework.checksum,
        update_first_date_id: factHomework.update_first_date_id,
        update_last_date_id: updateLastDateId,
        update_count: factHomework.update_count + 1,
        update_files: JSON.stringify(updateFiles, null, 2)?.replace(/\00/g,''),
      });
    }
  }

  // TODO check if in the same travailAFaire.json we cannot generate the same uniqueId
  // for 2 different homework ids
  computeHomeworkUniqueId(homework, factCourse, filePath) {
    try {
      let uniqueId = `${homework.subject}-${homework.assignedDate}-${homework.publicName}`;
      if (factCourse == null) {
        // worst case scenario where course cannot be deduced
        // TODO could I deduce the course from assignedDate and subject ?
        uniqueId = `${homework.dueDate}-${uniqueId}`;
      } else {
        uniqueId = `${factCourse.fact_key}-${uniqueId}`;
      }
      if (uniqueId in this.#homeworkUniqueId) {
        let i = 1;
        while (`${uniqueId}-${i}` in this.#homeworkUniqueId) {
          i++;
        }
        uniqueId = `${uniqueId}-${i}`;
        console.warn(`Duplicate unique ID for homework ID '${homework.id}' in '${filePath}' - new unique ID: '${uniqueId}'`);
      }
      this.#homeworkUniqueId[uniqueId] = homework.id;
      return uniqueId;
    } catch (e) {
      console.error(e);
      throw new Error(
        `Error computing unique ID for homework ID '${homework.id}' in '${filePath}'`
      );
    }
  }
    
}
