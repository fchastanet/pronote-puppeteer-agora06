import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

function formatDate(date) {
  const yy = ('0000' + date.getFullYear()).slice(-4);
  const mm = ('00' + (date.getMonth() + 1)).slice(-2);
  const dd = ('00' + date.getDate()).slice(-2);
  const hh = ('00' + date.getHours()).slice(-2);
  return `${yy}-${mm}-${dd}_${hh}`;
}

const casUrl = process.env.CAS_URL;
const login = process.env.LOGIN;
const password = process.env.PASSWORD;
const debugMode = process.env.DEBUG_MODE === 1;
const consoleLogs = process.env.CONSOLE_LOGS === 1;
const currentDate = formatDate(new Date());
const resultDir = path.join(process.cwd(), process.env.RESULTS_DIR, currentDate);
let browser = null;

if (!fs.existsSync(resultDir)){
  fs.mkdirSync(resultDir, { recursive: true });
}

function delay(time) {
  return new Promise(function(resolve) { 
      setTimeout(resolve, time)
  });
}

// -----------------------------------------------------------------------------
// Handle process exit
// @see https://stackoverflow.com/a/14032965
// -----------------------------------------------------------------------------
process.stdin.resume(); // so the program will not close instantly

function exitHandler(options, exitCode) {
    if (options.cleanup) {
      console.log('clean before exiting');
      if (browser !== null) {
        console.log('Closing browser');
        browser.close();
      }
    }
    if (exitCode === null) {
      exitCode = 1;
    }
    if (typeof exitCode === 'error' || typeof exitCode === 'string' || exitCode instanceof Error) {
      console.error(exitCode);
      exitCode = 2;
    }
    if (options.exit) process.exit(exitCode);
}

// do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

// catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));

// catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));

// -----------------------------------------------------------------------------
async function loginToPronote() {
  // Launch a headless browser
  const browserArgs = {
    headless: !debugMode, // Set to 'false' if you want to see the browser (useful for debugging)
    executablePath: "",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized'],
    devtools: debugMode,
    dumpio: false,
  };
  if (debugMode) {
    // slow down by 250ms
    browserArgs.slowMo = 50;
  } else {
    browserArgs.slowMo = 50;
  }

  browser = await puppeteer.launch(browserArgs);

  // Create a new page (tab)
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1572});
  if (consoleLogs) {
    page.on('console', msg => console.log('PAGE CONSOLE LOGS:', msg.text()));
  }
  page.setDefaultNavigationTimeout(0);
  
  // Enable Request Interception
  await page.setRequestInterception(true);

  page.on("request", (request) => {
    // Allow the request to be sent
    request.continue();
  });
  // Listen for response events
  page.on("response", (response) => {
    const request = response.request();
    // Only check responses for XHR requests linked to "cahier de texte"
    const postData = request.postData();
    if (debugMode) {
      console.log("Response", 
        "resourceType", request.resourceType(),
        "requestUrl", request.url().substring(0, 50),
        "matchingUrl", request.url().includes("pronote/appelfonction/2/"),
        "postData", postData,
        "postData.nom", postData?.nom
      );
    }
    if (
      request.resourceType() === "xhr" &&
      request.url().includes("pronote/appelfonction/2/")
    ) {
      const postDataObj = JSON.parse(postData);
      if (postDataObj?.nom === 'PageCahierDeTexte') {
        // Log response status and URL
        let onglet = postDataObj?.donneesSec?._Signature_?.onglet;
        if (debugMode) {
          console.log("XHR Response", response.status(), response.url());
          // Log response headers
          console.log("Headers", response.headers());
          console.log("Onglet", onglet);
        }

        let targetFile = "";
        if (onglet === 88) {
          targetFile = path.join(resultDir, "cahierDeTexte-travailAFaire.json");
        } else if (onglet === 89) {
          targetFile = path.join(resultDir, "cahierDeTexte-resources.json");
        } else {
          // unknown request
          return;
        }
        // Log response body
        response.text().then((text) => {
          fs.writeFile(targetFile, text, err => {
            if (err) {
              console.error(err);
              process.exit(1);
            } else {
              console.log(`Result written into '${targetFile}'`);
            }
          });
        });
      }
    }
  });

  try {
    // ---------------------------------------------------------------------------------------------------
    console.info('Step 1: Navigate to cas');
    await page.goto(casUrl, {waitUntil: 'networkidle2'});
    await page.waitForSelector('#idp-EDU'); // Wait for the user type selector
    await page.click('#idp-EDU');
    await page.evaluate(() => {
      document.querySelector('#idp-EDU').click()
    });

    await page.click('#button-submit');
    await page.waitForNavigation({waitUntil: 'networkidle2'});

    // ---------------------------------------------------------------------------------------------------
    console.info('Step 2: Page to select the profile');
    await page.waitForSelector('button#bouton_responsable')
    await page.click('button#bouton_responsable');
    
    // ---------------------------------------------------------------------------------------------------
    console.info('Step 3: Log in');
    await page.waitForSelector('#username');
    await page.evaluate((login, password) => {
      document.querySelector('#username').value = login;
      document.querySelector('#password').value = password;
    }, login, password);
    await page.click('button[type="submit"]'); // Submit the login form
    await page.waitForNavigation({waitUntil: 'domcontentloaded'}); // Wait for the page to navigate after login
    console.log('Logged in to CAS Agora06.');

    // ---------------------------------------------------------------------------------------------------
    console.info('Step 4: From College move to pronote');
    await page.goto('https://0061670h.index-education.net/pronote/');

    // ---------------------------------------------------------------------------------------------------
    console.info('Step 5: Wait for Pronote page to load after CAS login');
    await page.waitForSelector('#id_body'); // Adjust the selector according to the Pronote dashboard
    await page.waitForSelector('.label-membre');

    // ---------------------------------------------------------------------------------------------------
    console.info('Step 6: Extract information from the Pronote dashboard');
    const studentInfo = await page.evaluate(() => {
      const name = document.querySelector('.label-membre').innerText; // Adjust selector based on the page's structure
      const school = document.querySelector('.ibe_centre .ibe_etab').innerText; // Adjust selector as needed
      const sessionNumber = window.GParametres.application.communication.NumeroDeSession
      return {name, school, sessionNumber};
    });

    console.log('Student Info:', studentInfo);
    
    // by default page "Contenu et ressource" is displayed
    console.log('click on "Cahier de texte" menu');
    await page.evaluate(() => {
      const sel = '.objetBandeauEntete_menu div.onglets-wrapper ul li:nth-child(2) div.label-menu_niveau0';
      document.querySelector(sel).click();
    });
    await page.waitForSelector('.conteneur-CDT');
    await delay(2000); // wait some time to let the page to be fully loaded before screenshot
    await page.screenshot({path: path.join(resultDir, 'cahierDeTexte-resources.png'), fullPage: true});

    console.log('click on "travail à faire"');
    await page.evaluate(() => {
      document.querySelector('.objetBandeauEntete_secondmenu ul li:nth-child(2)')
        .dispatchEvent(new Event( 'click', { bubbles: true } ));
    });
    await page.waitForSelector('.conteneur-CDT');
    await delay(2000); // wait some time to let the page to be fully loaded before screenshot
    await page.screenshot({path: path.join(resultDir, 'cahierDeTexte-travailAFaire.png'), fullPage: true});

    if (debugMode) {
      console.log("keep window opened for debugging");
      await delay(600000);
    } else {
      console.log("Wait 5 seconds for xhr request to finish");
      await delay(5000);
    }
    process.exit(0);
  } catch (error) {
    console.error('An error occurred during the login process:', error);
  }
}

// Run the function to log in and retrieve data
loginToPronote();