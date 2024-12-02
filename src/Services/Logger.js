import DataWarehouse from '#pronote/Database/DataWarehouse.js'

export const LOG_FORMAT = {
  JSON: 'json',
  TEXT: 'text'
}

export default class Logger {
  /** @param {DataWarehouse} */
  #dataWarehouse = null
  #processId = null
  #verbose

  constructor(dataWarehouse, verbose = false) {
    this.#dataWarehouse = dataWarehouse
    this.#verbose = verbose
  }

  setVerbose(verbose) {
    this.#verbose = verbose
  }

  setProcessId(processId) {
    this.#processId = processId
  }

  #log(level, ...args) {
    const message = args.join(' ')
    if (this.#processId) {
      this.#dataWarehouse.insertProcessLog(this.#processId, level, message)
    }
    return message
  }

  debug(...args) {
    if (this.#verbose) {
      console.debug(this.#log('debug', ...args))
    }
  }

  info(...args) {
    console.info(this.#log('info', ...args))
  }

  warn(...args) {
    console.warn(this.#log('warn', ...args))
  }

  error(...args) {
    console.error(this.#log('error', ...args))
  }

  getLogs(processId, format = LOG_FORMAT.JSON) {
    const logs = this.#dataWarehouse.getProcessLogs(processId)
    if (format === LOG_FORMAT.TEXT) {
      return logs.map((log) => `[${log.timestamp}] ${log.level}: ${log.message}`).join('\n')
    }
    return logs
  }
}
