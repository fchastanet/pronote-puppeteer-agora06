export default class ProcessorNotificationsService {
  #verbose
  constructor(verbose) {
    this.#verbose = verbose;
  }

  async process() {
    console.log('to be implemented');
    return new Promise(resolve => resolve())
  }
}