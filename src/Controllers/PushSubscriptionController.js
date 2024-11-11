import PushSubscriptionService from "#pronote/Services/PushSubscriptionService.js"

export default class PushSubscriptionController {
  /** @type {PushSubscriptionService} */
  #pushSubscriptionService

  constructor(pushSubscriptionService) {
    this.#pushSubscriptionService = pushSubscriptionService
  }
  
  postSubscription(req, res, next) {
    try {
      const body = req.body
      if (body?.old?.endpoint) {
        console.log('old subscription added : ', body.old)
        this.#pushSubscriptionService.removeSubscriptionByEndpoint(body.old.endpoint)  
      }
      this.#pushSubscriptionService.pushSubscription(body.new)
      console.log('Subscription added : ', body.new)
      this.#pushSubscriptionService.sendNotificationToSubscriber(
        body.new,
        { title: 'Notification System', body: 'Subscription added' }
      )
      // Send 201 - resource created
      res.status(201).json(body.new);
    } catch (e) {
      console.error('Error adding subscription', e);
      next(e);
    }
  }

  async deleteSubscription(req, res, next) {
    try {
      const endpoint = req.query.endpoint?.toString();
      if (!endpoint) {
        res.sendStatus(400);
        return;
      }
      const subscription = await this.#pushSubscriptionService.getSubscriptionByEndpoint(endpoint)
      if (!subscription) {
        // subscription not found, consider subscription removed successfully
        res.sendStatus(200);
        return;
      }
      this.#pushSubscriptionService.removeSubscriptionByEndpoint(subscription.endpoint)
      console.log('Subscription removed : ', endpoint)
      this.#pushSubscriptionService.sendNotificationToSubscriber(
        subscription,
        { title: 'Notification System', body: 'Subscription removed' }
      )
      // Send 204 - no content
      res.status(204).json({});
    } catch (e) {
      console.error('Error removing subscription', e);
      next(e);
    }
  }

  getNotificationTest(req, res) {
    const homework = { 
      title: 'New Homework', 
      body: 'A new homework has been added' 
    }
    this.#pushSubscriptionService.sendNotification(homework)
    res.status(200).json({ message: 'Notification sent' })
  }

  getPublicVapidKey(req, res) {
    const publicVapidKeyFile = this.#pushSubscriptionService.getPublicVapidKeyFile()
    res.sendFile(publicVapidKeyFile)
  }
}
