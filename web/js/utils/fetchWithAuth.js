import showToast from '../components/toastMessage/toastMessage'
import {CustomError} from './utils'

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

export {
  fetchWithAuth,
  ResponseError
}
