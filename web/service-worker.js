//--------------------------------------------
// BEGIN OF fetchWithAuth.js content

class CustomError extends Error {
}

class ResponseError extends Error {
  response
  constructor(message, response) {
    super(message)
    this.message = message
    this.response = response
  }
}

const handleResponse = async (
  response,
  decodeJsonResponse,
  throwErrorOnResponseKO
) => {
  if (response.status === 401) {
    console.error('Unauthorized: Redirecting to login page')
    showToast('Authentication expired', false)
    const event = new CustomEvent('userLoggedOut', {detail: response})
    window.dispatchEvent(event)
    throw new ResponseError('Authentication expired')
  }
  if (response.status === 204 || response.status === 205) {
    decodeJsonResponse = false
  }
  if (throwErrorOnResponseKO && !response.ok) {
    throw new CustomError(`HTTP error! status: ${response.status}`)
  }
  return decodeJsonResponse ? response.json() : response
}

/**
 * fetch
 * @param {string} url url to fetch
 * @param {object} options fetch options
 * @param {object} responseHandlingOptions - options on how response is handled
 * @param {boolean} responseHandlingOptions.decodeJsonResponse
 *  if true decode json response, else return plain response
 * @param {boolean} responseHandlingOptions.throwErrorOnResponseKO
 *  throw ResponseError if response not ok, else manual handling
 * @returns {Promise<Response|object>} json or response
 */
const fetchWithAuth = async (
  url,
  options = {},
  responseHandlingOptions
) => {
  const defaults = {
    decodeJsonResponse: true,
    throwErrorOnResponseKO: true,
  }
  const responseHandlingOpts = {
    ...defaults,
    ...(responseHandlingOptions || {}),
  }
  options.credentials = 'include' // important for sending cookies
  options.headers = {'Content-Type': 'application/json'}
  const response = await fetch(url, options)
  return handleResponse(response, responseHandlingOpts.decodeJsonResponse, responseHandlingOpts.throwErrorOnResponseKO)
}

//--------------------------------------------
// END OF fetchWithAuth.js content

let webServiceUrl = null

self.addEventListener('install', function () {
  console.log('Service worker installed', location)
  webServiceUrl = new URL(location).searchParams.get('webService')
  console.log('webServiceUrl', webServiceUrl)
})

self.addEventListener('push', (event) => {
  try {
    const data = event.data.json()
    self.registration
      .showNotification(data.title, {
        body: data.body,
      })
      .catch((error) => {
        console.error('Error showing notification:', error)
      })
  } catch (error) {
    console.error('Error handling push event:', error)
  }
})

self.addEventListener(
  'pushsubscriptionchange',
  (event) => {
    const conv = (val) => self.btoa(String.fromCharCode.apply(null, new Uint8Array(val)))
    const getPayload = (subscription) => ({
      endpoint: subscription.endpoint,
      keys: {
        auth: conv(subscription.getKey('auth')),
        p256dh: conv(subscription.getKey('p256dh')),
      },
    })
    const subscription = self.registration.pushManager.subscribe(event.oldSubscription.options).then((subscription) =>
      fetchWithAuth(
        `${webServiceUrl}/subscription`,
        {
          method: 'post',
          body: JSON.stringify({
            old: getPayload(event.oldSubscription),
            new: getPayload(subscription),
          }),
        },
        {
          decodeJsonResponse: false,
          throwErrorOnResponseKO: true
        }
      )
    )
    event.waitUntil(subscription)
  },
  false
)
