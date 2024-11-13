import DataWarehouse from '#pronote/Database/DataWarehouse.js'
import PushSubscriptionService from '#pronote/Services/PushSubscriptionService.js'
import DateWrapper from '#pronote/Utils/DateWrapper.js'
import Utils from '#pronote/Utils/Utils.js'

export default class NotificationsService {
  /** @type {DataWarehouse} */
  #dataWarehouse
  /** @type {PushSubscriptionService} */
  #pushSubscriptionService
  #verbose
  #rateLimit
  #skipNotifications
  #notificationsToSend = []

  constructor({dataWarehouse, pushSubscriptionService, verbose, skipNotifications, rateLimit}) {
    this.#dataWarehouse = dataWarehouse
    this.#pushSubscriptionService = pushSubscriptionService
    this.#verbose = verbose
    this.#skipNotifications = skipNotifications
    this.#rateLimit = rateLimit
  }

  getReasonLabel(reason) {
    const reasonLabels = {
      new: 'New',
      updated: 'Updated',
    }
    if (reasonLabels?.[reason]) {
      return `[${reasonLabels[reason]}] `
    }
    return ''
  }

  #stylizeHomeworkNotification(homework, reason, index, total) {
    const {assignedDate, dueDate, subject, teacherName} = homework
    let {description} = homework
    description = Utils.stripTags(description)
    if (description.length > 65) {
      description = description.substr(0, 60) + ' ...'
    }
    const body = []
    if (teacherName) {
      body.push(`Teacher: ${teacherName}`)
    }
    body.push(`Assigned: ${assignedDate}`)
    body.push(`Due: ${dueDate}`)
    body.push(`Description: ${description}`)
    const reasonLabel = this.getReasonLabel(reason)

    return {
      title: `${reasonLabel}Homework(${index} / ${total}) - ${subject} `,
      body: body.join('\n'),
      icon: 'http://localhost:3000/favicon.png',
      tag: 'homework',
      renotify: true,
      requireInteraction: true,
    }
  }

  async #sendHomeworkNotification(homework, reason, index, total, notificationDate, subscriptions) {
    if (this.#skipNotifications) {
      console.log('Notifications skipped')
      return new Promise((resolve) => resolve())
    }
    const homeworkNotification = this.#stylizeHomeworkNotification(homework, reason, index, total)
    console.log('Sending notification for homework:', homeworkNotification)
    await this.#pushSubscriptionService
      .sendNotification(homeworkNotification, homework.factKey, subscriptions)
      .then(() => {
        console.log('Notification sent')
        const dateId = this.#dataWarehouse.getOrInsertDate(notificationDate)
        this.#dataWarehouse.updateHomeworkNotificationSent(
          homework.factKey, DataWarehouse.NOTIFICATION_STATE_SENT, dateId
        )
      })
      .catch((error) => {
        console.error('Error sending notification:', error)
      })

    return new Promise((resolve) => resolve())
  }

  stackHomeworkNotification(homework, reason) {
    if (this.#skipNotifications) {
      console.log('Notifications skipped')
      return false
    }
    this.#notificationsToSend.push({type: 'homework', homework, reason})
    return true
  }

  async sendNotifications() {
    if (this.#skipNotifications) {
      console.log('Notifications skipped')
      return
    }
    const notificationsCount = this.#notificationsToSend.length
    if (notificationsCount === 0) {
      return
    }
    const subscriptions = await this.#dataWarehouse.getPushSubscriptions()
    if (subscriptions.length === 0) {
      console.log('No subscribers found, skipped notifications sending')
      return
    }
    if (notificationsCount > this.#rateLimit) {
      console.log(`Rate limit exceeded, sending max notifications: ${this.#rateLimit}/${notificationsCount}`)
    }
    const notificationDate = new DateWrapper()
    let i = 0
    let notificationsSent = 0
    for (const notification of this.#notificationsToSend) {
      i++
      if (i < notificationsCount - this.#rateLimit + 1) {
        // skip first notifications to respect rate limit
        if (notification.type === 'homework') {
          const dateId = this.#dataWarehouse.getOrInsertDate(notificationDate)
          this.#dataWarehouse.updateHomeworkNotificationSent(
            notification.homework.factKey,
            DataWarehouse.NOTIFICATION_STATE_RATE_LIMIT,
            dateId
          )
        }
        continue
      }
      if (notification.type === 'homework') {
        await this.#sendHomeworkNotification(notification.homework, notification.reason, i, notificationsCount, notificationDate, subscriptions)
        notificationsSent++
      }
    }
    console.log(`Sent ${notificationsSent} notifications`)

    this.#notificationsToSend = []
  }
}
