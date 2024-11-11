import webpush from 'web-push'
import path from 'path';
import fs from 'fs';
import DataWarehouse from '#pronote/Database/DataWarehouse.js';

export default class PushSubscriptionService {
  /** @type {DataWarehouse} */
  #dataWarehouse
  #pushNotificationsPath
  #privatePath
  #publicKeyTargetFile
  #privateKeysTargetFile
  #debug = false
  
  constructor(dataWarehouse, pushNotificationsPath, privatePath, debug) {
    this.#dataWarehouse = dataWarehouse
    this.#pushNotificationsPath = pushNotificationsPath
    this.#privatePath = privatePath
    this.#publicKeyTargetFile = path.join(this.#pushNotificationsPath, 'publicVapidKey.js')
    this.#privateKeysTargetFile = path.join(this.#privatePath, 'privateVapidKey.js')
    this.#debug = debug
  }

  async init() {
    const { publicVapidKey, privateVapidKey } = await this.#generateVapidKeys()
    webpush.setVapidDetails(
      'mailto:fchastanet@gmail.com', 
      publicVapidKey, 
      privateVapidKey
    )
  }

  async #generateVapidKeys() {
    if (fs.existsSync(this.#privateKeysTargetFile) && fs.existsSync(this.#publicKeyTargetFile)) {
      console.log(`VAPID keys already exist in '${this.#privateKeysTargetFile}' and '${this.#publicKeyTargetFile}'`)
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
      this.#publicKeyTargetFile, 
      `const publicVapidKey = '${vapidKeys.publicKey}';`, 
    )
    this.#writeFile(
      this.#privateKeysTargetFile, 
      `const publicVapidKey = '${vapidKeys.publicKey}';\nconst privateVapidKey = '${vapidKeys.privateKey}';\nexport { publicVapidKey, privateVapidKey };`
    )

    return { publicVapidKey, privateVapidKey }
  }

  #writeFile(targetFile, content) {
    fs.writeFileSync(
      this.#privateKeysTargetFile, 
      content, 
      'utf8', 
      err => {
        if (err) {
          console.error(err);
          process.exit(1);
        } else {
          console.log(`Result written into '${targetFile}'`);
        }
      }
    )
  }

  getPublicVapidKeyFile() {
    return this.#publicKeyTargetFile
  }

  async getSubscriptions() {
    return this.#dataWarehouse.getPushSubscriptions()
  }

  async getSubscriptionByEndpoint(endpoint) {
    return this.#dataWarehouse.getSubscriptionByEndpoint(endpoint)
  }

  async pushSubscription(subscription) {
    this.#dataWarehouse.insertSubscription(
      subscription.endpoint, 
      subscription.keys.auth, 
      subscription.keys.p256dh, 
      subscription.expirationTime
    )
  }

  async removeSubscriptionByEndpoint(endpoint) {
    this.#dataWarehouse.deletePushSubscriptionByEndpoint(endpoint)
  }

  async sendNotification(notification, notificationKey) {
    const payloadStr = JSON.stringify(notification)
    const subscriptions = await this.getSubscriptions()
    console.log(`Send Notification ${notificationKey} to ${subscriptions.length} subscribers`);
    subscriptions.forEach(subscription => {
      webpush.sendNotification(subscription, payloadStr).then(response => {
        if (this.#debug) {
          console.log('Notification sent successfully:', response)
        } else {
          console.log('Notification sent successfully')
        }
      }).catch(error => {
        if (error.statusCode === 410) {
          console.error('Error endpoint has gone, removing endpoint:', subscription.endpoint)
          this.#dataWarehouse.deletePushSubscriptionByEndpoint(subscription.endpoint)
        } else {
          console.error('Error sending notification:', error)
        }
      })
    })
  }

  async sendNotificationToSubscriber(subscriber, payload) {
    const payloadStr = JSON.stringify(payload)
    webpush.sendNotification(subscriber, payloadStr).catch(error => console.error(error))
  }
}