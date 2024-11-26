import DataWarehouse from '#pronote/Database/DataWarehouse.js'

export default class AuthService {
  /** @type {DataWarehouse} */
  #dataWarehouse

  constructor({dataWarehouse}) {
    this.#dataWarehouse = dataWarehouse
  }

  async login(login, password) {
    const authData = await this.#dataWarehouse.getUserByLoginAndPassword(login, password)
    return this.#authData(authData)
  }

  async validateSession(login) {
    const userData = await this.#dataWarehouse.getUserByLogin(login)
    if (!userData || userData.length === 0) {
      throw new Error('Invalid session')
    }

    return this.#authData(userData)
  }

  #authData(data) {
    const authData = {
      authenticated: data?.id > 0 ?? false,
      id: data?.id ?? 0,
      login: data?.login ?? '',
      role: data?.role ?? 'unauthenticated'
    }
    console.log(authData)
    return authData
  }
}
