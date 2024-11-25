import AuthService from '#pronote/Services/AuthService.js'

export default class LoginController {
  /** @type {AuthService} */
  #authService
  #verbose

  constructor({authService, verbose}) {
    this.#authService = authService
    this.#verbose = verbose
  }

  async loginAction(req, res) {
    if (this.#verbose) {
      console.debug('Attempting login ...')
    }
    const {login, password} = req.body
    const authData = await this.#authService.login(login, password)

    if (authData.authenticated) {
      res.json({message: 'Login successful'})
    } else {
      res.status(401).json({message: 'Invalid login or password'})
    }

    if (this.#verbose) {
      console.debug('Login result:', authData)
    }
    return authData
  }
}
