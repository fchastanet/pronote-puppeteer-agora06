import webpush from 'web-push'
import path from 'path';
import fs from 'fs';

export default class PushSubscriptionService {
  #subscriptions = []
  #pushNotificationsPath
  #privatePath
  #publicKeyTargetFile
  #privateKeysTargetFile
  
  constructor(pushNotificationsPath, privatePath) {
    this.#pushNotificationsPath = pushNotificationsPath
    this.#privatePath = privatePath
    this.#publicKeyTargetFile = path.join(this.#pushNotificationsPath, 'publicVapidKey.js')
    this.#privateKeysTargetFile = path.join(this.#privatePath, 'privateVapidKey.js')
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
    return this.#subscriptions
  }

  async getSubscriptionByEndpoint(endpoint) {
    return this.#subscriptions.find(sub => sub.endpoint === endpoint)
  }

  async pushSubscription(subscription) {
    this.#subscriptions.push(subscription)
  }

  async removeSubscription(subscription) {
    this.#subscriptions = this.#subscriptions.filter(sub => sub !== subscription)
  }

  async sendNotification(payload) {
    const subscriptions = await this.getSubscriptions()
    const payloadStr = JSON.stringify(payload)
    subscriptions.forEach(subscription => {
      webpush.sendNotification(subscription, payloadStr).catch(error => console.error(error))
    })
  }

  async sendNotificationToSubscriber(subscriber, payload) {
    const payloadStr = JSON.stringify(payload)
    webpush.sendNotification(subscriber, payloadStr).catch(error => console.error(error))
  }
}