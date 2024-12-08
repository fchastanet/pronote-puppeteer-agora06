import DataWarehouse from '#pronote/Database/DataWarehouse.js'

export default class UserController {
  /** @type {DataWarehouse} */
  #dataWarehouse
  /** @type {Logger} */
  #logger

  constructor({dataWarehouse, logger}) {
    this.#dataWarehouse = dataWarehouse
    this.#logger = logger
  }

  async getStudentsAction(req, res) {
    if (!req.session || !req.session.user) {
      return res.status(401).json({message: 'Unauthorized'})
    }

    try {
      const students = this.#dataWarehouse.getStudentsForUser(req.session.user.id)
      res.json({students: students})
    } catch (error) {
      this.#logger.error('Error fetching students:', error)
      res.status(500).json({message: 'Internal server error'})
    }
  }
}
