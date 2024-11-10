import DataWarehouse from "#pronote/Database/DataWarehouse.js";
import PushSubscriptionService from "#pronote/Services/PushSubscriptionService.js";

export default class ProcessorNotificationsService {
  /** @type {DataWarehouse} */
  #dataWarehouse
  /** @type {PushSubscriptionService} */
  #pushSubscriptionService
  #verbose

  constructor({dataWarehouse, pushSubscriptionService, verbose}) {
    this.#verbose = verbose;
    this.#pushSubscriptionService = pushSubscriptionService;
    this.#dataWarehouse = dataWarehouse;
  }

  #stylizeHomeworkNotification(homework) {
    const { assignedDate, dueDate, subject, description, teacherName } = homework
    return {
      title: `Homework - ${subject}`,
      body: `Teacher: ${teacherName}\nAssigned: ${assignedDate}\nDue: ${dueDate}\nDescription: ${description}`,
      icon: 'http://localhost:3000/favicon.png'
    }
  }

  async process() {
    //this.#dataWarehouse.updatePastFactHomeworkNotifications();
    const homeworks = this.#dataWarehouse.getHomeworksWithNotification();
    homeworks.forEach(homework => {
      const homeworkNotification = this.#stylizeHomeworkNotification(homework);
      this.#pushSubscriptionService.sendNotification(homeworkNotification);
      console.log(`Send Notification for Homework ${homework.factKey}`);
    });
    return new Promise(resolve => resolve())
  }
}