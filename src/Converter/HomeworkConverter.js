import FromTypeConverter from '#pronote/Converter/FromTypeConverter.js';

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
      uniqueId: this.computeUniqueId(item),
      description: this.fromTypeConverter.convertItem(item.descriptif, "Literal"),
      formatted: item.avecMiseEnForme,
      dueDate: this.fromTypeConverter.fromPronote(item.PourLe, "Value"),
      requiresSubmission: item?.avecRendu !== undefined ? item.avecRendu : false,
      submissionType: item.genreRendu!== undefined ? item.genreRendu : null,
      completed: item.TAFFait,
      difficultyLevel: item.niveauDifficulte,
      duration: item.duree,
      assignedDate: this.fromTypeConverter.fromPronote(item.DonneLe, "Value"),
      subject: this.fromTypeConverter.convertItem(item.Matiere, "Literal"),
      backgroundColor: item.CouleurFond,
      publicName: item.nomPublic,
      themes: item.ListeThemes ? item.ListeThemes.V.map(theme => this.fromTypeConverter.fromPronote(theme)) : [],
      attachments: item.ListePieceJointe ? item.ListePieceJointe.V.map(theme => this.fromTypeConverter.fromPronote(theme, "ListePieceJointe")) : [],
    };

    return resultItem;
  }

  computeUniqueId(item) {
    return `{item.}`;
  }
}