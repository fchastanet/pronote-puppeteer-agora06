import FromTypeConverter from '#pronote/Converter/FromTypeConverter.js';
import Utils from '#pronote/Utils/Utils.js';

export default class HomeworkConverter {

  constructor() {
    this.fromTypeConverter = new FromTypeConverter();
  }

  fromPronote(data) {
    if (data?.donneesSec?.donnees?.ListeTravauxAFaire?.V) {
      return data.donneesSec.donnees.ListeTravauxAFaire.V.map(item => this.fromPronoteItem(item));
    }
    return [];
  }

  // Method to convert each item in TravailAFaire
  fromPronoteItem(item) {
    const resultItem = {
      id: item.N,
      plannedCourseId: item?.cahierDeTextes?.V?.N || null,
      subject: this.fromTypeConverter.convertItem(item.Matiere, "Literal"),
      dueDate: this.fromTypeConverter.fromPronote(item.PourLe, "Value"),
      assignedDate: this.fromTypeConverter.fromPronote(item.DonneLe, "Value"),
      completed: item.TAFFait,
      formatted: item.avecMiseEnForme,
      submissionType: item.genreRendu!== undefined ? item.genreRendu : null,
      difficultyLevel: item.niveauDifficulte,
      duration: item.duree,
      requiresSubmission: item?.avecRendu !== undefined ? item.avecRendu : false,
      backgroundColor: item.CouleurFond,
      publicName: item.nomPublic,
      description: this.fromTypeConverter.convertItem(item.descriptif, "Literal"),
      themes: item.ListeThemes ? item.ListeThemes.V.map(theme => this.fromTypeConverter.fromPronote(theme)) : [],
      attachments: item.ListePieceJointe ? item.ListePieceJointe.V.map(theme => this.fromTypeConverter.fromPronote(theme, "ListePieceJointe")) : [],
      json: item,
    };
    resultItem.checksum = this.computeHomeworkItemChecksum(resultItem);

    return resultItem;
  }

  computeHomeworkItemChecksum(homeworkItem) {
    const data = {
      subject: homeworkItem.subject,
      dueDate: homeworkItem.dueDate,
      completed: homeworkItem.completed,
      submissionType: homeworkItem.submissionType,
      description: homeworkItem.description,
      requiresSubmission: homeworkItem.requiresSubmission,
      attachments: Utils.removeKey(homeworkItem.attachments, 'id'),
    };
    return Utils.md5sum(data);
  }
}