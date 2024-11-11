import DataWarehouse from '#pronote/Database/DataWarehouse.js'
import PushSubscriptionService from '#pronote/Services/PushSubscriptionService.js'
import Utils from '#pronote/Utils/Utils.js'

export default class ProcessorNotificationsService {
  /** @type {DataWarehouse} */
  #dataWarehouse
  /** @type {PushSubscriptionService} */
  #pushSubscriptionService
  #verbose

  constructor({dataWarehouse, pushSubscriptionService, verbose}) {
    this.#verbose = verbose
    this.#pushSubscriptionService = pushSubscriptionService
    this.#dataWarehouse = dataWarehouse
  }

  #stylizeHomeworkNotification(homework) {
    const {assignedDate, dueDate, subject, teacherName} = homework
    let {description} = homework
    description = Utils.stripTags(description)
    if (description.length > 65) {
      description = description.substr(0, 60) + ' ...'
    }

    return {
      title: `Homework - ${subject}`,
      body: `Teacher: ${teacherName}\nAssigned: ${assignedDate}\nDue: ${dueDate}\nDescription: ${description}`,
      icon: 'http://localhost:3000/favicon.png',
      tag: 'homework',
      renotify: true,
      requireInteraction: true,
    }
  }

  async process() {
    //this.#dataWarehouse.updatePastFactHomeworkNotifications();
    const homeworks = this.#dataWarehouse.getHomeworksWithNotification()
    for (const homework of homeworks) {
      const homeworkNotification = this.#stylizeHomeworkNotification(homework)
      console.log('Sending notification for homework:', homeworkNotification)
      await this.#pushSubscriptionService
        .sendNotification(homeworkNotification, homework.factKey)
        .then(() => {
          console.log('Notification sent')
          this.#dataWarehouse.updateHomeworkNotificationSent(homework.factKey)
        })
        .catch((error) => {
          console.error('Error sending notification:', error)
        })
    }
    return new Promise((resolve) => resolve())
  }
}
