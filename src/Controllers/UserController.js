import DataWarehouse from '#pronote/Database/DataWarehouse.js'

export default class UserController {
  /** @type {DataWarehouse} */
  #dataWarehouse

  constructor(dataWarehouse) {
    this.#dataWarehouse = dataWarehouse
  }

  async getAccountsAction(req, res) {
    if (!req.session || !req.session.user) {
      return res.status(401).json({message: 'Unauthorized'})
    }

    try {
      const accounts = await this.#dataWarehouse.getPronoteAccountsForUser(req.session.user.id)
      // eslint-disable-next-line no-unused-vars
      const filteredAccounts = accounts.map(({pronote_password, pronote_login, ...account}) => account)
      res.json({accounts: filteredAccounts})
    } catch (error) {
      console.error('Error fetching accounts:', error)
      res.status(500).json({message: 'Internal server error'})
    }
  }
}
