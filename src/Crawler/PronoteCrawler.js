import {Browser, Page} from 'puppeteer'
import path from 'path'
import fs from 'fs'
import Utils from '#pronote/Utils/Utils.js'
import Crawler from '#pronote/Crawler/Crawler.js'
import DateWrapper from '#pronote/Utils/DateWrapper.js'

export default class PronoteCrawler {
  /** @type {Crawler} #crawler */
  #crawler
  /** @type {Browser} #browser */
  #browser = null
  /** @type {Page} #page */
  #page = null
  /** @type {boolean} #debugMode */
  #debugMode = false
  /** @type {boolean} #verbose */
  #verbose = false
  /** @type {string} #login */
  #login = ''
  /** @type {string} #password */
  #password = ''
  /** @type {string} #casUrl */
  #casUrl = ''
  #sessionNumber = null
  // crawl session related variables
  /** @type {string} #resultDir */
  #resultDir = ''
  /** @type {DateWrapper} #currentDate */
  #currentDate = null

  constructor({crawler, login, password, casUrl, debugMode, verbose}) {
    this.#crawler = crawler
    this.#verbose = verbose
    this.#debugMode = debugMode
    this.#login = login
    this.#password = password
    this.#casUrl = casUrl
  }

  async init() {
    console.log('Initializing browser')
    this.#browser = await this.#crawler.initBrowser()

    console.log('Initializing page')
    try {
      this.#page = await this.#crawler.initPage(this.#browser)
    } catch (error) {
      console.error('An error occurred during the page initialization', error)
      return
    }

    if (this.#verbose) {
      this.#page.on('console', (msg) => console.log('PAGE CONSOLE LOGS:', msg.text()))
    }

    console.log('Initializing page listeners')
    this.#page.on('request', (request) => {
      // Allow the request to be sent
      request.continue()
    })

    // Listen for response events
    this.#page.on('response', (response) => {
      const request = response.request()
      // Only check responses for XHR requests linked to "cahier de texte"
      const postData = request.postData()
      if (this.#debugMode) {
        console.log(
          'Response',
          'resourceType',
          request.resourceType(),
          'requestUrl',
          request.url().substring(0, 50),
          'matchingUrl',
          request.url().includes('pronote/appelfonction/2/'),
          'postData',
          postData,
          'postData.nom',
          postData?.nom
        )
      }
      if (request.resourceType() === 'xhr' && request.url().includes('pronote/appelfonction/2/')) {
        const postDataObj = JSON.parse(postData)
        if (postDataObj?.nom === 'PageCahierDeTexte') {
          this.#writeCahierDeTexte(response, postDataObj)
        }
      }
    })
  }

  close() {
    if (this.#browser !== null) {
      this.#browser.close()
    }
  }

  #getResultFile(name) {
    if (this.#sessionNumber === null) {
      throw new Error('missing session number')
    }
    const dir = `${this.#resultDir}-${this.#sessionNumber}`
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {recursive: true})
    }
    return path.join(dir, name)
  }

  #writeCahierDeTexte(response, postDataObj) {
    // Log response status and URL

    if (this.#debugMode) {
      console.log('XHR Response', response.status(), response.url())
      // Log response headers
      console.log('Headers', response.headers())
    }
    const targetFile = this.#getTargetFile(postDataObj)
    if (targetFile === null) {
      return
    }
    // Write response body
    response.text().then((text) => {
      const json = JSON.parse(text)
      json.crawlDate = this.#currentDate.toISOString()
      fs.writeFile(targetFile, JSON.stringify(json, null, '  '), (err) => {
        if (err) {
          console.error(err)
          process.exit(1)
        } else {
          console.log(`Result written into '${targetFile}'`)
        }
      })
    })
  }

  #getTargetFile(postDataObj) {
    const tab = postDataObj?.donneesSec?._Signature_?.onglet
    if (this.#debugMode) {
      console.log('Onglet', tab)
    }
    if (tab === 88) {
      return this.#getResultFile('cahierDeTexte-travailAFaire.json')
    } else if (tab === 89) {
      return this.#getResultFile('cahierDeTexte-courses.json')
    }
    // unknown request
    return null
  }

  async crawl(resultDir, currentDate) {
    this.#currentDate = currentDate
    this.#resultDir = resultDir

    await this.#loginToPronote()
    await this.#extractGeneralInformation()
    await this.#navigateToCahierDeTexte()
    await this.#navigateToTravailAFaire()
  }

  async #loginToPronote() {
    // ---------------------------------------------------------------------------------------------------
    console.info('Step 1: Navigate to cas')
    await this.#page.goto(this.#casUrl, {waitUntil: 'networkidle2'})
    await this.#page.waitForSelector('#idp-EDU') // Wait for the user type selector
    await this.#page.click('#idp-EDU')
    await this.#page.evaluate(() => {
      document.querySelector('#idp-EDU').click()
    })

    await this.#page.click('#button-submit')
    await this.#page.waitForNavigation({waitUntil: 'networkidle2'})

    // ---------------------------------------------------------------------------------------------------
    console.info('Step 2: Page to select the profile')
    await this.#page.waitForSelector('button#bouton_responsable')
    await this.#page.click('button#bouton_responsable')

    // ---------------------------------------------------------------------------------------------------
    console.info('Step 3: Log in')
    await this.#page.waitForSelector('#username')
    await this.#page.evaluate(
      (login, password) => {
        document.querySelector('#username').value = login
        document.querySelector('#password').value = password
      },
      this.#login,
      this.#password
    )
    await this.#page.click('button[type="submit"]') // Submit the login form
    await this.#page.waitForNavigation({waitUntil: 'domcontentloaded'}) // Wait for the page to navigate after login
    console.log('Logged in to CAS Agora06.')

    // ---------------------------------------------------------------------------------------------------
    console.info('Step 4: From College move to pronote')
    await this.#page.goto('https://0061670h.index-education.net/pronote/')

    // ---------------------------------------------------------------------------------------------------
    console.info('Step 5: Wait for Pronote page to load after CAS login')
    await this.#page.waitForSelector('#id_body') // Adjust the selector according to the Pronote dashboard
    await this.#page.waitForSelector('.label-membre')
  }

  #extractStartParams(paramsString) {
    // https://regex101.com/r/ckPf3q/1
    const startParams = paramsString.match(/Start ?\((?<startParams>{[^}]*})\)/)?.groups?.startParams
    if (typeof startParams === 'undefined') {
      throw new Error('startParams not found')
    }
    return JSON.parse(Utils.convertToJsonString(startParams))
  }

  async #extractGeneralInformation() {
    console.info('Step 6: Extract information from the Pronote dashboard')
    const studentInfo = await this.#page.evaluate(() => {
      const fullName = document.querySelector('.label-membre').innerText // Adjust selector based on the page's structure
      const reMatches = fullName.match(/^(?<name>.*) \((?<grade>[^)]+)\)$/)
      const school = document.querySelector('.ibe_centre .ibe_etab').innerText // Adjust selector as needed
      const sessionNumber = window.GParametres.application.communication.NumeroDeSession
      const startParams = document.querySelector('body')?.getAttribute('onload')
      return {
        fullName,
        name: reMatches.groups.name,
        grade: reMatches.groups.grade,
        school,
        sessionNumber,
        startParams,
      }
    })
    studentInfo.startParams = this.#extractStartParams(studentInfo.startParams)
    studentInfo.crawlDate = this.#currentDate.toISOString()

    console.log('Student Info:', studentInfo)
    this.#sessionNumber = studentInfo.sessionNumber
    const targetFile = this.#getResultFile('studentInfo.json')
    fs.writeFile(targetFile, JSON.stringify(studentInfo, null, '  '), (err) => {
      if (err) {
        console.error(err)
        process.exit(1)
      } else {
        console.log(`Result written into '${targetFile}'`)
      }
    })
  }

  async #navigateToCahierDeTexte() {
    // by default page "Contenu et ressource" is displayed
    console.log('click on "Cahier de texte" menu')
    await this.#page.evaluate(() => {
      const sel = '.objetBandeauEntete_menu div.onglets-wrapper ul li:nth-child(2) div.label-menu_niveau0'
      document.querySelector(sel).click()
    })
    await this.#page.waitForSelector('.conteneur-CDT')
    await Utils.delay(2000) // wait some time to let the page to be fully loaded
    console.log('change date to 1st september')
    await this.#page.evaluate(() => {
      // start date selector
      document.getElementById('GInterface.Instances[2].Instances[2].cellule_Edit').click()
      // september selection
      document.querySelector('.ObjetFenetre_Date_racine .liste-as-options li:first-child div').click()
      // 1st active day of the month
      document.querySelector('.ObjetFenetre_Date_racine .date.actif').click()
    })
    await Utils.delay(2000) // wait some time to let the page to be fully loaded before screenshot
    await this.#page.screenshot({
      path: this.#getResultFile('cahierDeTexte-courses.png'),
      fullPage: true,
    })
  }

  async #navigateToTravailAFaire() {
    console.log('click on "travail à faire"')
    await this.#page.evaluate(() => {
      document
        .querySelector('.objetBandeauEntete_secondmenu ul li:nth-child(2)')
        .dispatchEvent(new Event('click', {bubbles: true}))
    })
    await this.#page.waitForSelector('.conteneur-CDT')
    await Utils.delay(2000) // wait some time to let the page to be fully loaded before screenshot
    await this.#page.screenshot({
      path: this.#getResultFile('cahierDeTexte-travailAFaire.png'),
      fullPage: true,
    })
  }
}
