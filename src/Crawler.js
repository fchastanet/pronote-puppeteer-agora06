import puppeteer, {Browser} from 'puppeteer';

export default class Crawler {
  debugMode = false;

  constructor(debugMode) {
    this.debugMode = debugMode;
  }

  /**
   * @returns Promise<Browser>
   */
  async initBrowser() {
    // Launch a headless browser
    const browserArgs = {
      headless: !this.debugMode, // Set to 'false' if you want to see the browser (useful for debugging)
      executablePath: "",
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized'],
      devtools: this.debugMode,
      dumpio: false,
    };
    if (this.debugMode) {
      // slow down by 250ms
      browserArgs.slowMo = 50;
    } else {
      browserArgs.slowMo = 50;
    }

    return await puppeteer.launch(browserArgs);
  }

  /**
   * 
   * @param {Browser} browser 
   * @returns Page
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
