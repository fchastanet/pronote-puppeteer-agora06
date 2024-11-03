import path from 'path';
import fs from 'fs';
import HomeworkConverter from "#pronote/Converter/HomeworkConverter.js";
import CourseConverter from "#pronote/Converter/CourseConverter.js";
import DataWarehouse from '#pronote/Database/DataWarehouse.js';
import DateWrapper from '#pronote/Utils/DateWrapper.js';
import Utils from '#pronote/Utils/Utils.js';

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
  #currentDate = null;
  #duplicatedIds = [];
  
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
      this.processDirectories(this.#resultsDir)
    } catch (error) {
      console.error('Unable to connect to the database:', error)
    }
  }

  processDirectories(resultsDir) {
    const subDirs = fs.readdirSync(resultsDir)

    subDirs.forEach(subDir => {
      const studentInfoPath = path.join(resultsDir, subDir, 'studentInfo.json')
      const coursesPath = path.join(resultsDir, subDir, 'cahierDeTexte-courses.json')
      const homeworksPath = path.join(resultsDir, subDir, 'cahierDeTexte-travailAFaire.json')

      if (
        !fs.existsSync(studentInfoPath) || 
        !fs.existsSync(coursesPath) || 
        !fs.existsSync(homeworksPath)
      ) {
        console.error(`Missing one or more file in directory '${subDir}'`)
        return
      }
      console.info(`Processing files in directory '${subDir}' ...`)
      this.#db.insertProcessedFile(studentInfoPath, DataWarehouse.FILE_PROCESSING_STATUS_WAITING)
      this.#db.insertProcessedFile(homeworksPath, DataWarehouse.FILE_PROCESSING_STATUS_WAITING)  
      this.#db.insertProcessedFile(coursesPath, DataWarehouse.FILE_PROCESSING_STATUS_WAITING)
      try {        
        console.info(`Processing '${studentInfoPath}' ...`)
        const studentInfoContent = JSON.parse(fs.readFileSync(studentInfoPath, 'utf8'))
        this.#currentDate = new DateWrapper(studentInfoContent.crawlDate)
        this.processStudentInfo(studentInfoContent)
      } catch (error) {
        console.error(`Unable to process file '${studentInfoPath}' :`, error)
        this.#db.insertProcessedFile(studentInfoPath, DataWarehouse.FILE_PROCESSING_STATUS_ERROR)
        return
      }
      
      if (this.#db.isFileProcessed(coursesPath)) {
        console.info(`File '${coursesPath}' already processed`)
      } else {
        try {
          console.info(`Processing '${coursesPath}' ...`)
          const coursesContent = JSON.parse(fs.readFileSync(coursesPath, 'utf8'))
          this.processCourses(coursesPath, coursesContent)
        } catch (error) {
          console.error(`Unable to process file '${coursesPath}' :`, error)
          this.#db.insertProcessedFile(coursesPath, DataWarehouse.FILE_PROCESSING_STATUS_ERROR)
          return
        }
      }
      
      if (this.#db.isFileProcessed(homeworksPath)) {
        console.info(`File '${homeworksPath}' already processed`)
      } else {
        try {
          console.info(`Processing '${homeworksPath}' ...`)
          
          const homeworksContent = JSON.parse(fs.readFileSync(homeworksPath, 'utf8'))
          this.processHomeworks(homeworksPath, homeworksContent)
        } catch (error) {
          console.error(`Unable to process file '${homeworksPath}' :`, error)
          this.#db.insertProcessedFile(homeworksPath, DataWarehouse.FILE_PROCESSING_STATUS_ERROR)
          return
        }
      }

      if (this.#duplicatedIds.length > 0) {
        const homeworksPath = path.join(resultsDir, subDir, 'duplicatedIds.json')
        console.warn(`${this.#duplicatedIds.length} duplicated IDs found in '${subDir}'`);
        fs.writeFileSync(homeworksPath, JSON.stringify(this.#duplicatedIds, null, 2), 'utf8')
      }
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
    if (this.#verbose) {
      console.debug('Converted Items:', items);
    }

    // Check if items is empty
    if (items.length === 0) {
      console.warn(`No items found in '${filePath}'`);
    }
    
    // Process each item in ListeCahierDeTextes
    for (const [_, course] of Object.entries(items.courses)) {
      this.insertCourse(
        course, 
        this.#schoolId, this.#gradeId, this.#studentId, filePath
      );
    }
  }

  processHomeworks(filePath, data) {
    this.#homeworkUniqueId = {};

    const homeworks = this.#homeworkConverter.fromPronote(data)

    // Process each homework in travailAFaire
    for (const [_, homework] of Object.entries(homeworks)) {
      this.insertHomework(
        homework,
        this.#schoolId, this.#gradeId, this.#studentId, filePath
      );
    }
  }  

  getOrInsertDate(date) {
    if (date === null) {
      return null
    }
    if (!(date instanceof DateWrapper)) {
      date = DateWrapper.parseDate(date)
    }
    let dateId = this.#db.getDateId(date)
    if (!dateId) {
      dateId = this.#db.insertDate(date)
    }
    return dateId
  }

  insertCourse(course, schoolId, gradeId, studentId, filePath) {
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
    let startDateId = this.getOrInsertDate(course?.startDate);
    let endDateId = this.getOrInsertDate(course?.endDate);
    let homeworkDateId = this.getOrInsertDate(course?.homeworkDate);
    let updateLastDateId = this.getOrInsertDate(this.#currentDate);
    
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
    } else {
      factCourseId = factCourse.fact_id;
      if (course.checksum != factCourse.checksum) {
        updateFiles = JSON.parse(factCourse.update_files);
        updateFiles.push({filePath, checksum: course.checksum, id: course.id});
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
          content_list: JSON.stringify(course.contentList, null, 2)?.replace(/\00/g,''),
          locked: course.locked,
          update_first_date_id: factCourse.update_first_date_id,
          update_last_date_id: updateLastDateId,
          update_count: factCourse.update_count + 1,
          update_files: JSON.stringify(updateFiles, null, 2)?.replace(/\00/g,''),
        });
      }
    }
    if (factCourseId !== null) {
      this.#courseIdFactMapping[course.id] = {fact_id: factCourseId, fact_key: course.key};

    }
  }

  insertHomework(homework, schoolId, gradeId, studentId, filePath) {
    // Insert homework
    let subjectId = this.#db.getSubjectId(homework.subject);
    if (!subjectId) {
      subjectId = this.#db.insertSubject({
        subject: homework.subject,
        backgroundColor: homework.backgroundColor
      });
    }

    // Insert dates
    const dueDate = homework?.dueDate ? DateWrapper.parseDate(homework.dueDate) : null;
    let dueDateId = this.getOrInsertDate(dueDate);
    const assignedDate = homework?.dueDate ? DateWrapper.parseDate(homework.assignedDate) : null;
    let assignedDateId = this.getOrInsertDate(assignedDate);
    let maxCompletionDuration = (dueDate !== null && assignedDate !== null) ? dueDate.diff(assignedDate, 'second') : null;
    let updateLastDateId = this.getOrInsertDate(this.#currentDate);

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
    let completedDateId = null
    let completionDuration = null;

    if (typeof factHomework === 'undefined') {
      if (homework.completed) {
        console.log(`Homework ${homework.id} is completed before being inserted, cannot compute completion duration`);
      }
      updateFiles.push({filePath, checksum: homework.checksum, id: homework.id});
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
        completed: homework.completed,
        completed_date_id: completedDateId, 
        submission_type: homework.submissionType,
        difficulty_level: homework.difficultyLevel,
        completion_duration: completionDuration,
        max_completion_duration: maxCompletionDuration,
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
      completionDuration = factHomework.completion_duration;
      if (homework.completed && factHomework.completed_date_id === null) {
        completedDateId = this.getOrInsertDate(this.#currentDate);
        completionDuration = this.#currentDate.diff(assignedDate, 'second');
      } else {
        completedDateId = factHomework.completed_date_id;
      }
      updateFiles = JSON.parse(factHomework.update_files);
      updateFiles.push({filePath, checksum: homework.checksum, id: homework.id});
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
        max_completion_duration: maxCompletionDuration,
        submission_type: homework.submissionType,
        difficulty_level: homework.difficultyLevel,
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
      let uniqueId = this.getHomeworkUniqueId(homework, factCourse)
      if (uniqueId in this.#homeworkUniqueId) {
        let i = 1;
        while (`${uniqueId}-${i}` in this.#homeworkUniqueId) {
          i++;
        }
        this.#duplicatedIds.push({
          homeworkId: homework.id,
          homeworkIdUsingConflictedUniqueId: this.#homeworkUniqueId[uniqueId],
          uniqueId: uniqueId,
          filePath,
          factCourse,
          homework,
        });
        uniqueId = `${uniqueId}-${i}`;
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

  getHomeworkUniqueId(homeworkItem, factCourse) {
    // if subject is changed, let's consider it's a different homework
    const data = {
      subject: homeworkItem.subject,
      dueDate: homeworkItem.dueDate,
      assignedDate: homeworkItem.assignedDate,
      submissionType: homeworkItem.submissionType,
      description: homeworkItem.description,
      courseKey: factCourse?.fact_key,
    };
    return Utils.md5sum(data);
  }


    
}
