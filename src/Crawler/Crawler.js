import puppeteer, {Browser, Page} from 'puppeteer';

export default class Crawler {
  #debugMode = false;
  #browsers = [];

  constructor(debugMode) {
    this.#debugMode = debugMode;
  }

  async close() {
    this.#browsers.forEach(async browser => {
      await browser.close();
    });
  }
  /**
   * @returns Promise<Browser>
   */
  async initBrowser() {
    // Launch a headless browser
    const browserArgs = {
      headless: !this.#debugMode, // Set to 'false' if you want to see the browser (useful for debugging)
      executablePath: "",
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized'],
      devtools: this.#debugMode,
      dumpio: false,
    };
    if (this.#debugMode) {
      // slow down by 250ms
      browserArgs.slowMo = 50;
    } else {
      browserArgs.slowMo = 50;
    }

    const browser = await puppeteer.launch(browserArgs);
    this.#browsers.push(browser);
    return browser;
  }

  /**
   * 
   * @param {Browser} browser 
   * @returns {Page}
   */
  async initPage(browser) {
    // Create a new page (tab)
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1572});
    page.setDefaultNavigationTimeout(0);
    
    // Enable Request Interception
    await page.setRequestInterception(true);

    return page;
  }
}
