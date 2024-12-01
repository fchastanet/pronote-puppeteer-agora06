import webpush from 'web-push'
import path from 'path'
import fs from 'fs'
import DataWarehouse from '#pronote/Database/DataWarehouse.js'

export default class PushSubscriptionService {
  /** @type {DataWarehouse} */
  #dataWarehouse
  #privatePath
  #privateKeysTargetFile
  #debug = false

  constructor(dataWarehouse, privatePath, debug) {
    this.#dataWarehouse = dataWarehouse
    this.#privatePath = privatePath
    this.#privateKeysTargetFile = path.join(this.#privatePath, 'privateVapidKey.js')
    this.#debug = debug
  }

  async init() {
    const {publicVapidKey, privateVapidKey} = await this.#generateVapidKeys()
    webpush.setVapidDetails('mailto:fchastanet@gmail.com', publicVapidKey, privateVapidKey)
  }

  async #generateVapidKeys() {
    if (fs.existsSync(this.#privateKeysTargetFile)) {
      console.log(`VAPID keys already exist in '${this.#privateKeysTargetFile}'`)
      const keys = await import(this.#privateKeysTargetFile)
      console.log('Public VAPID Key:', keys.publicVapidKey)
      console.log('Private VAPID Key:', keys.privateVapidKey)
      return keys
    }
    console.log('Generating VAPID keys')
    const vapidKeys = webpush.generateVAPIDKeys()
    console.log('Public VAPID Key:', vapidKeys.publicKey)
    console.log('Private VAPID Key:', vapidKeys.privateKey)

    console.log('Writing VAPID keys to files')
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
        console.error(err)
        process.exit(1)
      } else {
        console.log(`Result written into '${targetFile}'`)
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
    console.log(`Send Notification ${notificationKey} to ${subscriptions.length} subscribers`)
    subscriptions.forEach((subscription) => {
      webpush
        .sendNotification(subscription, payloadStr)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          const msg = `Notification ${notificationKey} sent successfully to subscriber ${subscription.id}`
          if (this.#debug) {
            console.log(msg, response)
          } else {
            console.log(msg)
          }
        })
        .catch((error) => {
          if (error.statusCode === 410) {
            console.error('Error endpoint has gone, removing endpoint:', subscription.endpoint)
            this.#dataWarehouse.deleteSubscriptionsByEndpoint(subscription.endpoint)
          } else {
            console.error('Error sending notification:', error)
          }
        })
    })
  }

  async sendNotificationToSubscriber(subscriber, payload) {
    const payloadStr = JSON.stringify(payload)
    webpush.sendNotification(subscriber, payloadStr).catch((error) => console.error(error))
  }

  async getPublicVapidKey() {
    const keys = await this.#generateVapidKeys()
    return keys.publicVapidKey
  }

}
