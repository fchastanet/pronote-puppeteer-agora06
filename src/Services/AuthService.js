import DataWarehouse from '#pronote/Database/DataWarehouse.js'

export default class AuthService {
  /** @type {DataWarehouse} */
  #dataWarehouse

  constructor({dataWarehouse}) {
    this.#dataWarehouse = dataWarehouse
  }

  async login(login, password) {
    const authData = await this.#dataWarehouse.getUserByLoginAndPassword(login, password)
    console.log(authData)
    return authData
  }
}
