import {Browser, Page} from 'puppeteer'
import path from 'path'
import fs from 'fs'
import Utils from '#pronote/Utils/Utils.js'
import Crawler from '#pronote/Crawler/Crawler.js'
import DateWrapper from '#pronote/Utils/DateWrapper.js'
import Logger from '#pronote/Services/Logger.js'

export default class PronoteCrawler {
  /** @type {Crawler} #crawler */
  #crawler
  /** @type {Logger} */
  #logger
  /** @type {Browser} #browser */
  #browser = null
  /** @type {Page} #page */
  #page = null
  #sessionNumber = null
  // crawl session related variables
  /** @type {string} #resultDir */
  #resultDir = ''
  /** @type {DateWrapper} #currentDate */
  #currentDate = null

  constructor({crawler, logger}) {
    this.#crawler = crawler
    this.#logger = logger
  }

  async init() {
    this.#logger.info('Initializing browser')
    this.#browser = await this.#crawler.initBrowser()

    this.#logger.info('Initializing page')
    try {
      this.#page = await this.#crawler.initPage(this.#browser)
    } catch (error) {
      this.#logger.error('An error occurred during the page initialization', error)
      return
    }

    if (this.#logger.debugMode) {
      this.#page.on('console', (msg) => this.#logger.info('PAGE CONSOLE LOGS:', msg.text()))
    }

    this.#logger.info('Initializing page listeners')
    this.#page.on('request', (request) => {
      // Allow the request to be sent
      request.continue()
    })

    // Listen for response events
    this.#page.on('response', (response) => {
      const request = response.request()
      // Only check responses for XHR requests linked to "cahier de texte"
      const postData = request.postData()
      if (this.#logger.debugMode) {
        this.#logger.debug(
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

    if (this.#logger.debugMode) {
      this.#logger.debug('XHR Response', response.status(), response.url())
      // Log response headers
      this.#logger.debug('Headers', response.headers())
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
          this.#logger.error(err)
          process.exit(1)
        } else {
          this.#logger.info(`Result written into '${targetFile}'`)
        }
      })
    })
  }

  #getTargetFile(postDataObj) {
    const tab = postDataObj?.donneesSec?._Signature_?.onglet
    this.#logger.debug('Onglet', tab)
    if (tab === 88) {
      return this.#getResultFile('cahierDeTexte-travailAFaire.json')
    } else if (tab === 89) {
      return this.#getResultFile('cahierDeTexte-courses.json')
    }
    // unknown request
    return null
  }

  async crawl({
    resultDir, currentDate,
    login, password, casUrl,
  }) {
    this.#currentDate = currentDate
    this.#resultDir = resultDir

    await this.#loginToPronote({login, password, casUrl})
    await this.#extractGeneralInformation()
    await this.#navigateToCahierDeTexte()
    await this.#navigateToTravailAFaire()
  }

  async #loginToPronote({login, password, casUrl}) {
    // ---------------------------------------------------------------------------------------------------
    this.#logger.info('Step 1: Navigate to cas')
    await this.#page.goto(casUrl, {waitUntil: 'networkidle2'})
    await this.#page.waitForSelector('#idp-EDU') // Wait for the user type selector
    await this.#page.click('#idp-EDU')
    await this.#page.evaluate(() => {
      document.querySelector('#idp-EDU').click()
    })

    await this.#page.click('#button-submit')
    await this.#page.waitForNavigation({waitUntil: 'networkidle2'})

    // ---------------------------------------------------------------------------------------------------
    this.#logger.info('Step 2: Page to select the profile')
    await this.#page.waitForSelector('button#bouton_responsable')
    await this.#page.click('button#bouton_responsable')

    // ---------------------------------------------------------------------------------------------------
    this.#logger.info('Step 3: Log in')
    await this.#page.waitForSelector('#username')
    await this.#page.evaluate(
      (login, password) => {
        document.querySelector('#username').value = login
        document.querySelector('#password').value = password
      },
      login,
      password
    )
    await this.#page.click('button[type="submit"]') // Submit the login form
    await this.#page.waitForNavigation({waitUntil: 'domcontentloaded'}) // Wait for the page to navigate after login
    this.#logger.info('Logged in to CAS Agora06.')

    // ---------------------------------------------------------------------------------------------------
    this.#logger.info('Step 4: From College move to pronote')
    await this.#page.goto('https://0061670h.index-education.net/pronote/')

    // ---------------------------------------------------------------------------------------------------
    this.#logger.info('Step 5: Wait for Pronote page to load after CAS login')
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
    this.#logger.info('Step 6: Extract information from the Pronote dashboard')
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

    this.#logger.info('Student Info:', studentInfo)
    this.#sessionNumber = studentInfo.sessionNumber
    const targetFile = this.#getResultFile('studentInfo.json')
    fs.writeFile(targetFile, JSON.stringify(studentInfo, null, '  '), (err) => {
      if (err) {
        this.#logger.error(err)
        process.exit(1)
      } else {
        this.#logger.info(`Result written into '${targetFile}'`)
      }
    })
  }

  async #navigateToCahierDeTexte() {
    // by default page "Contenu et ressource" is displayed
    this.#logger.info('click on "Cahier de texte" menu')
    await this.#page.evaluate(() => {
      const sel = '.objetBandeauEntete_menu div.onglets-wrapper ul li:nth-child(2) div.label-menu_niveau0'
      document.querySelector(sel).click()
    })
    await this.#page.waitForSelector('.conteneur-CDT')
    await Utils.delay(2000) // wait some time to let the page to be fully loaded
    this.#logger.info('change date to 1st september')
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
    this.#logger.info('click on "travail à faire"')
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
