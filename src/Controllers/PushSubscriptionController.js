import PushSubscriptionService from '#pronote/Services/PushSubscriptionService.js'

export default class PushSubscriptionController {
  /** @type {PushSubscriptionService} */
  #pushSubscriptionService

  constructor(pushSubscriptionService) {
    this.#pushSubscriptionService = pushSubscriptionService
  }

  postSubscription(req, res, next) {
    try {
      const body = req.body
      this.#pushSubscriptionService.pushSubscription(req.session.user.id, body.new)
      console.log('Subscription added : ', body.new)
      this.#pushSubscriptionService.sendNotificationToSubscriber(body.new, {
        title: 'Notification System',
        body: 'Subscription added',
      })
      // Send 201 - resource created
      res.status(201).json(body.new)
    } catch (e) {
      console.error('Error adding subscription', e)
      next(e)
    }
  }

  async deleteSubscription(req, res, next) {
    try {
      const endpoint = req.query.endpoint?.toString()
      if (!endpoint) {
        res.sendStatus(400)
        return
      }
      const subscription = await this.#pushSubscriptionService.getUserSubscription(req.session.user.id)
      this.#pushSubscriptionService.deleteUserSubscription(req.session.user.id)
      console.log('Subscription removed : ', endpoint, 'for user', req.session.user.id)
      if (subscription) {
        this.#pushSubscriptionService.sendNotificationToSubscriber(subscription, {
          title: 'Notification System',
          body: 'Subscription removed',
        })
      }
      // Send 204 - no content
      res.status(204).json({})
    } catch (e) {
      console.error('Error removing subscription', e)
      next(e)
    }
  }

  async getPublicVapidKey(req, res) {
    const publicVapidKey = await this.#pushSubscriptionService.getPublicVapidKey()
    return res.json({publicVapidKey})
  }
}
