export const LOG_FORMAT = {
  JSON: 'json',
  TEXT: 'text'
}

export default class Logger {
  #processId = null
  #debugMode
  #verboseMode

  constructor(debugMode = false, verboseMode = false) {
    this.#debugMode = debugMode
    this.#verboseMode = verboseMode
  }

  set debugMode(debugMode) {
    this.#debugMode = debugMode
    this.info('Logger Debug mode:', this.#debugMode)
  }

  get debugMode() {
    return this.#debugMode
  }

  set verboseMode(verboseMode) {
    this.#verboseMode = verboseMode
    this.info('Logger Verbose mode:', this.#verboseMode)
  }

  get verboseMode() {
    return this.#verboseMode
  }

  set processId(processId) {
    this.#processId = processId
  }

  get processId() {
    return this.#processId
  }

  debug(...args) {
    if (this.#debugMode) {
      console.debug('DEBUG  ', this.#processId, ...args)
    }
  }

  verbose(...args) {
    if (this.#verboseMode) {
      console.info('VERBOSE', this.#processId, ...args)
    }
  }

  info(...args) {
    console.info('INFO   ', this.#processId, ...args)
  }

  warn(...args) {
    console.warn('WARN   ', this.#processId, ...args)
  }

  error(...args) {
    console.error('ERROR  ', this.#processId, ...args)
  }

}
