const processManagement = (cleanHandler) => {
  // -----------------------------------------------------------------------------
  // Handle process exit
  // -----------------------------------------------------------------------------
  /**
   * handle process exit
   * @param {object} options - options
   * @param {number} exitCode - exit code
   */
  const exitHandler = (options, exitCode) => {
    cleanHandler(options, exitCode)
    if (exitCode === null) {
      exitCode = 1
    }
    if (typeof exitCode === 'object' || typeof exitCode === 'string' || exitCode instanceof Error) {
      console.error(exitCode)
      exitCode = 2
    }
    if (options.exit) process.exit(exitCode)
  }

  // do something when app is closing
  process.on('exit', exitHandler.bind(null, {cleanup: true}))

  // catches ctrl+c event
  process.on('SIGINT', exitHandler.bind(null, {exit: true}))

  // catches "kill pid" (for example: nodemon restart)
  process.on('SIGUSR1', exitHandler.bind(null, {exit: true}))
  process.on('SIGUSR2', exitHandler.bind(null, {exit: true}))

  // catches uncaught exceptions
  process.on('uncaughtException', exitHandler.bind(null, {exit: true}))
}
export default processManagement
