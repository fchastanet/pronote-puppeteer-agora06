import DataWarehouse from '#pronote/Database/DataWarehouse.js'

export default class UserController {
  /** @type {DataWarehouse} */
  #dataWarehouse

  constructor(dataWarehouse) {
    this.#dataWarehouse = dataWarehouse
  }

  async getStudentsAction(req, res) {
    if (!req.session || !req.session.user) {
      return res.status(401).json({message: 'Unauthorized'})
    }

    try {
      const students = this.#dataWarehouse.getStudentsForUser(req.session.user.id)
      res.json({students: students})
    } catch (error) {
      console.error('Error fetching students:', error)
      res.status(500).json({message: 'Internal server error'})
    }
  }
}
