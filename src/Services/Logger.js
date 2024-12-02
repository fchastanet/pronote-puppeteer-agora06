
export default class Logger {
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

  getLogs(processId) {
    return this.#dataWarehouse.getProcessLogs(processId)
  }
}
