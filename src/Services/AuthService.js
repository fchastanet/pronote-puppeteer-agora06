import DataWarehouse from '#pronote/Database/DataWarehouse.js'
import PushSubscriptionService from '#pronote/Services/PushSubscriptionService.js'

export default class AuthService {
  /** @type {DataWarehouse} */
  #dataWarehouse
  /** @type {Logger} */
  #logger
  /** @type {PushSubscriptionService} */
  #pushSubscriptionService

  constructor({dataWarehouse, logger, pushSubscriptionService}) {
    this.#dataWarehouse = dataWarehouse
    this.#logger = logger
    this.#pushSubscriptionService = pushSubscriptionService
  }

  async login(login, password) {
    const userData = await this.#dataWarehouse.getUserByLoginAndPassword(login, password)
    if (!userData || userData.length === 0) {
      throw new Error('Invalid login or password')
    }
    const subscription = this.#pushSubscriptionService.getUserSubscription(userData.id)
    return this.#authData(userData, subscription)
  }

  async validateSession(login) {
    const userData = await this.#dataWarehouse.getUserByLogin(login)
    if (!userData || userData.length === 0) {
      throw new Error('Invalid session')
    }
    const subscription = this.#pushSubscriptionService.getUserSubscription(userData.id)
    return this.#authData(userData, subscription)
  }

  #authData(data, subscription) {
    const authData = {
      authenticated: data?.id > 0 ?? false,
      id: data?.id ?? 0,
      login: data?.login ?? '',
      firstName: data?.firstName ?? '',
      lastName: data?.lastName ?? '',
      welcomeMessage: data?.role === 'admin' ? 'Administrator' : `${data?.firstName} ${data?.lastName} (Role User)`,
      role: data?.role ?? 'unauthenticated',
      pushNotification: {
        enabled: (!!subscription?.endpoint && !!subscription?.keys?.p256dh && !!subscription?.keys?.auth),
        pushEndpoint: subscription?.endpoint,
        pushAuth: subscription?.keys?.auth,
        pushP256dh: subscription?.keys?.p256dh,
        pushExpirationTime: subscription?.expirationTime,
      }
    }
    this.#logger.info(authData)
    return authData
  }
}
