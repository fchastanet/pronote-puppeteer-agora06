import puppeteer, {Browser, Page} from 'puppeteer'

export default class Crawler {
  #debug = false
  #browsers = []

  constructor(debug) {
    this.#debug = debug
  }

  setDebug(debug) {
    this.#debug = debug
  }

  async close() {
    this.#browsers.forEach(async (browser) => {
      await browser.close()
    })
  }

  /**
   * Initialize a new browser instance
   * @returns {Promise<Browser>} browser instance
   */
  async initBrowser() {
    // Launch a headless browser
    const browserArgs = {
      headless: !this.#debug, // Set to 'false' if you want to see the browser (useful for debugging)
      executablePath: '',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized'],
      devtools: this.#debug,
      dumpio: false,
    }
    if (this.#debug) {
      // slow down by 250ms
      browserArgs.slowMo = 50
    } else {
      browserArgs.slowMo = 50
    }

    const browser = await puppeteer.launch(browserArgs)
    this.#browsers.push(browser)
    return browser
  }

  /**
   * Initialize a new page instance
   * @param {Browser} browser - browser instance
   * @returns {Page} page instance
   */
  async initPage(browser) {
    // Create a new page (tab)
    const page = await browser.newPage()
    await page.setViewport({width: 1920, height: 1572})
    page.setDefaultNavigationTimeout(0)

    // Enable Request Interception
    await page.setRequestInterception(true)

    return page
  }
}
