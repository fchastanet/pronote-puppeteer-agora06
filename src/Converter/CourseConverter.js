import FromTypeConverter from '#pronote/Converter/FromTypeConverter.js'
import crypto from 'crypto'
import Utils from '#pronote/Utils/Utils.js'
import Logger from '#pronote/Services/Logger.js'

export default class CourseConverter {
  /** @type {Logger} */
  #logger
  /** @type {FromTypeConverter} */
  #fromTypeConverter

  constructor({logger}) {
    this.#fromTypeConverter = new FromTypeConverter()
    this.#logger = logger
  }

  fromPronote(data) {
    const result = {
      subjects: {},
      courses: {},
      coursesIdMapping: {},
    }
    if (data?.donneesSec?.donnees?.ListeRessourcesPedagogiques?.V?.listeMatieres?.V) {
      result.subjects = Object.fromEntries(
        Object.entries(data.donneesSec.donnees.ListeRessourcesPedagogiques.V.listeMatieres.V).map(([, item]) => [
          item.N,
          item.L,
        ])
      )
    }
    if (data?.donneesSec?.donnees?.ListeCahierDeTextes?.V) {
      for (const [, item] of Object.entries(data.donneesSec.donnees.ListeCahierDeTextes.V)) {
        const courseItem = this.fromPronoteCourseItem(item, result.subjects)
        if (courseItem === null) {
          continue
        }
        if (courseItem.id in result.coursesIdMapping) {
          this.#logger.error(`Duplicate course id: ${courseItem.id}`, courseItem)
          continue
        }
        result.coursesIdMapping[courseItem.id] = courseItem.key
        result.courses[courseItem.key] = courseItem
      }
    }
    this.#logger.debug('CourseConverter Subjects:')
    this.#logger.debug(JSON.stringify(result.subjects))
    this.#logger.debug('CourseConverter Courses:')
    this.#logger.debug(JSON.stringify(result.courses))
    return result
  }

  // // Method to convert each item in ListeCahierDeTextes
  fromPronoteCourseItem(item, subjects) {
    try {
      const subjectId = item.Matiere.V.N
      if (typeof subjects[subjectId] === 'undefined') {
        subjects[item.Matiere.V.N] = item.Matiere.V.L
      }
      const course = {
        id: item.N,
        plannedCourseId: item.cours.V.N,
        // TODO listeGroupes, listeElementsProgrammeCDT
        subject: subjects[item.Matiere.V.N],
        description: this.#fromTypeConverter.convertValueContext(item.descriptif, 'Literal'),
        backgroundColor: item.CouleurFond,
        teacherList: item.listeProfesseurs.V.map((prof) => prof.L) || [],
        startDate: item.Date.V,
        endDate: item.DateFin.V,
        homeworkDate: item.dateTAF?.V || null,
        contentList: item.listeContenus.V.map((content) => this.fromPronoteCourseItemContent(content)),
        locked: item.verrouille,
      }
      course.key = this.computeCourseItemId(course)
      course.checksum = this.computeCourseItemChecksum(course)
      return course
    } catch (e) {
      this.#logger.error(e, item)
    }
    return null
  }

  computeCourseItemId(course) {
    try {
      return `${course.subject}-${course.startDate}-${course.endDate}-${course.teacherList.join('-')}`
    } catch (e) {
      this.#logger.error(e, course)
    }
    return null
  }

  computeCourseItemChecksum(course) {
    const hash = crypto.createHash('md5')
    const contentList = Utils.removeKey(course.contentList, 'id')
    hash.update(
      JSON.stringify({
        locked: course.locked,
        subject: course.subject,
        homeworkDate: course.homeworkDate,
        contentList: contentList,
        description: course.description,
      })
    )
    return hash.digest('hex')
  }

  fromPronoteCourseItemContent(item) {
    try {
      return {
        id: item.N,
        description: this.#fromTypeConverter.convertValueContext(item.descriptif, 'Literal'),
        date: item?.Date?.V || null,
        endDate: item?.DateFin?.V || null,
        locked: item.verrouille,
        backgroundColor: item.CouleurFond,
        attachmentList: item.ListePieceJointe.V.map((attachment) => this.fromPronoteContentAttachment(attachment)),
      }
    } catch (e) {
      this.#logger.error(e, item)
    }
    return null
  }

  fromPronoteContentAttachment(item) {
    try {
      return {
        id: item.N,
        name: item.L,
        type: item.G,
        link: item.lien,
        isInternal: item.estUnLienInterne,
      }
    } catch (e) {
      this.#logger.error(e, item)
      return null
    }
  }
}
