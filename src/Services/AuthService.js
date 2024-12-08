import DataWarehouse from '#pronote/Database/DataWarehouse.js'

export default class AuthService {
  /** @type {DataWarehouse} */
  #dataWarehouse
  /** @type {Logger} */
  #logger

  constructor({dataWarehouse, logger}) {
    this.#dataWarehouse = dataWarehouse
    this.#logger = logger
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
      firstName: data?.firstName ?? '',
      lastName: data?.lastName ?? '',
      welcomeMessage: data?.role === 'admin' ? 'Administrator' : `${data?.firstName} ${data?.lastName} (Role User)`,
      role: data?.role ?? 'unauthenticated',
      pushNotification: {
        enabled: (!!data?.pushEndpoint && !!data?.pushAuth && !!data?.pushP256dh),
        pushEndpoint: data?.pushEndpoint,
        pushAuth: data?.pushAuth,
        pushP256dh: data?.pushP256dh,
        pushExpirationTime: data?.pushExpirationTime,
      }
    }
    this.#logger.info(authData)
    return authData
  }
}
