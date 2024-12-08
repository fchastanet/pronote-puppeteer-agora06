import webpush from 'web-push'
import path from 'path'
import fs from 'fs'
import DataWarehouse from '#pronote/Database/DataWarehouse.js'
import Logger from '#pronote/Services/Logger.js'

export default class PushSubscriptionService {
  /** @type {DataWarehouse} */
  #dataWarehouse
  /** @type {Logger} */
  #logger
  #privatePath
  #privateKeysTargetFile

  constructor({dataWarehouse, privatePath, logger}) {
    this.#dataWarehouse = dataWarehouse
    this.#privatePath = privatePath
    this.#privateKeysTargetFile = path.join(this.#privatePath, 'privateVapidKey.js')
    this.#logger = logger
  }

  async init() {
    const {publicVapidKey, privateVapidKey} = await this.#generateVapidKeys()
    webpush.setVapidDetails('mailto:fchastanet@gmail.com', publicVapidKey, privateVapidKey)
  }

  async #generateVapidKeys() {
    if (fs.existsSync(this.#privateKeysTargetFile)) {
      this.#logger.info(`VAPID keys already exist in '${this.#privateKeysTargetFile}'`)
      const keys = await import(this.#privateKeysTargetFile)
      this.#logger.info('Public VAPID Key:', keys.publicVapidKey)
      this.#logger.info('Private VAPID Key:', keys.privateVapidKey)
      return keys
    }
    this.#logger.info('Generating VAPID keys')
    const vapidKeys = webpush.generateVAPIDKeys()
    this.#logger.info('Public VAPID Key:', vapidKeys.publicKey)
    this.#logger.info('Private VAPID Key:', vapidKeys.privateKey)

    this.#logger.info('Writing VAPID keys to files')
    this.#writeFile(
      this.#privateKeysTargetFile,
      `const publicVapidKey = '${vapidKeys.publicKey}'\nconst privateVapidKey = '${vapidKeys.privateKey}'\nexport { publicVapidKey, privateVapidKey }`
    )

    // eslint-disable-next-line no-undef
    return {publicVapidKey: vapidKeys.publicKey, privateVapidKey: vapidKeys.privateKey}
  }

  #writeFile(targetFile, content) {
    fs.writeFileSync(this.#privateKeysTargetFile, content, 'utf8', (err) => {
      if (err) {
        this.#logger.error(err)
        process.exit(1)
      } else {
        this.#logger.info(`Result written into '${targetFile}'`)
      }
    })
  }

  async pushSubscription(userId, subscription) {
    this.#dataWarehouse.updateUserSubscription(
      userId,
      subscription.endpoint,
      subscription.keys.auth,
      subscription.keys.p256dh,
      subscription.expirationTime
    )
  }

  async removeSubscriptionByEndpoint(endpoint) {
    this.#dataWarehouse.deleteUserSubscription(endpoint)
  }

  async deleteUserSubscription(userId) {
    this.#dataWarehouse.deleteUserSubscription(userId)
  }

  async getUserSubscription(userId) {
    this.#dataWarehouse.getUserSubscription(userId)
  }

  async sendNotification(notification, notificationKey, subscriptions) {
    const payloadStr = JSON.stringify(notification)
    this.#logger.info(`Send Notification ${notificationKey} to ${subscriptions.length} subscribers`)
    subscriptions.forEach((subscription) => {
      webpush
        .sendNotification(subscription, payloadStr)
        .then((response) => {
          const msg = `Notification ${notificationKey} sent successfully to subscriber ${subscription.id}`
          if (this.#logger.debugMode) {
            this.#logger.info(msg, response)
          } else {
            this.#logger.info(msg)
          }
        })
        .catch((error) => {
          if (error.statusCode === 410) {
            this.#logger.error('Error endpoint has gone, removing endpoint:', subscription.endpoint)
            this.#dataWarehouse.deleteSubscriptionsByEndpoint(subscription.endpoint)
          } else {
            this.#logger.error('Error sending notification:', error)
          }
        })
    })
  }

  async sendNotificationToSubscriber(subscriber, payload) {
    const payloadStr = JSON.stringify(payload)
    webpush.sendNotification(subscriber, payloadStr).catch((error) => this.#logger.error(error))
  }

  async getPublicVapidKey() {
    const keys = await this.#generateVapidKeys()
    return keys.publicVapidKey
  }

}
