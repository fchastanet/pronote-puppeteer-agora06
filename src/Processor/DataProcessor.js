import path from 'path';
import fs from 'fs';
import Utils from '#pronote/Utils/Utils.js';
import Database from "#pronote/Database/Database.js";
import HomeworkConverter from "#pronote/Converter/HomeworkConverter.js";
import CourseConverter from "#pronote/Converter/CourseConverter.js";

export default class DataProcessor {
  /**
   * @type {Database}
   * @private
   */
  #db
  #homeworkConverter
  #courseConverter
  #resultsDir = "";
  #studentId = null;
  #schoolId = null;
  #gradeId = null;
  
  constructor(db, resultsDir) {
    this.#db = db
    this.#resultsDir = resultsDir
    this.#homeworkConverter = new HomeworkConverter();
    this.#courseConverter = new CourseConverter();
  }

  process() {
    try {
      this.#db.createSchema()

      // TODO
      this.processStudentInfo(this.#resultsDir);
      this.processCourses(this.#resultsDir);
      //this.processHomeworks(this.#resultsDir);
    } catch (error) {
      console.error('Unable to connect to the database:', error)
    } finally {
      this.#db.close()
    }
  }

  processStudentInfo(resultsDir) {
    const subDirs = fs.readdirSync(resultsDir);

    subDirs.forEach(subDir => {
      const filePath = path.join(resultsDir, subDir, 'studentInfo.json');
      if (fs.existsSync(filePath)) {
        // Read and parse the JSON file
        const studentInfo = JSON.parse(fs.readFileSync(filePath, 'utf8'));
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
    });
  }

  processHomeworks(resultsDir) {
    const subDirs = fs.readdirSync(resultsDir);

    subDirs.forEach(subDir => {
      const filePath = path.join(resultsDir, subDir, 'cahierDeTexte-travailAFaire.json');
      if (fs.existsSync(filePath)) {
        // Read and parse the JSON file
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        const items = this.#homeworkConverter.fromPronote(data)

        // Process each item in ListeCahierDeTextes
        items.forEach(item => {
          // Insert item into your desired data structure or database
          this.insertItem(item);
        });
      }
    });
  }

  processCourses(resultsDir) {
    const subDirs = fs.readdirSync(resultsDir);

    subDirs.forEach(subDir => {
      const filePath = path.join(resultsDir, subDir, 'cahierDeTexte-courses.json');
      if (fs.existsSync(filePath)) {
        // Read and parse the JSON file
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        const items = this.#courseConverter.fromPronote(data)
        // Log the items to debug
        console.log('Converted Items:', items);

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
        for (const [key, course] of Object.entries(items.courses)) {
          this.insertCourse(course, this.#schoolId, this.#gradeId, this.#studentId, filePath);
        }
      }
    });
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
    let startDateId = this.#db.getDateId(course.startDate);
    if (!startDateId && course.startDate !== null) {
      const startDate = Utils.parseFrenchDate(course.startDate);
      if (startDate !== null) {
        startDateId = this.#db.insertDate(startDate);
      }
    }

    let endDateId = this.#db.getDateId(course.endDate);
    if (!endDateId && course.endDate !== null) {
      const endDate = Utils.parseFrenchDate(course.endDate);
      if (endDate !== null) {
        endDateId = this.#db.insertDate(endDate, endDate.getFullYear(), endDate.getMonth() + 1, endDate.getDate(), endDate.getDay());
      }
    }

    let homeworkDateId = this.#db.getDateId(course.homeworkDate);
    if (!homeworkDateId && course.homeworkDate !== null) {
      const homeworkDate = Utils.parseFrenchDate(course.homeworkDate);
      if (homeworkDate !== null) {
        homeworkDateId = this.#db.insertDate(homeworkDate, homeworkDate.getFullYear(), homeworkDate.getMonth() + 1, homeworkDate.getDate(), homeworkDate.getDay());
      }
    }

    let updateLastDate = course?.crawlDate ? new Date(course.crawlDate) : new Date();
    let updateLastDateId = this.#db.getDateId(course.crawlDate);
    if (!updateLastDateId) {
      updateLastDateId = this.#db.insertDate(updateLastDate, updateLastDate.getFullYear(), updateLastDate.getMonth() + 1, updateLastDate.getDate(), updateLastDate.getDay());
    }
    
    // Insert fact course
    let factCourse = this.#db.getFactCourse(course.id);
    let updateFiles = [];
    let factCourseId = null;
    if (typeof factCourse === 'undefined') {
      updateFiles.push(filePath);
      factCourseId = this.#db.insertFactCourse({
        fact_key: course.id,
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
      updateFiles.push(filePath);
      this.#db.updateFactCourse({
        fact_key: course.id,
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
        

    // Insert content and attachments
    /*item.contentList.forEach(content => {
      if (!this.#db.getContentId(content.id)) {
        this.#db.insertContent({
          id: content.id,
          courseItemId: item.courseItemId,
          description: content.description,
          date: content.date,
          endDate: content.endDate
        });
      }

      content.attachmentList.forEach(attachment => {
        if (!this.#db.getAttachmentId(attachment.id)) {
          this.#db.insertAttachment({
            id: attachment.id,
            contentId: content.id,
            name: attachment.name,
            type: attachment.type,
            isInternal: attachment.isInternal
          });
        }
      });
    });*/
  }
    
}
