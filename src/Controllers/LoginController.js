import AuthService from '#pronote/Services/AuthService.js'

export default class LoginController {
  /** @type {Logger} */
  #logger
  /** @type {AuthService} */
  #authService
  #verbose

  constructor({authService, logger}) {
    this.#authService = authService
    this.#logger = logger
  }

  async loginAction(req, res) {
    this.#logger.verbose('Attempting login ...')
    const {login, password} = req.body
    const authData = await this.#authService.login(login, password)

    if (authData.authenticated) {
      const sessionData = {id: authData.id, login: login, role: authData.role}
      req.session.user = sessionData
      res.json(authData)
    } else {
      res.status(401).json({message: 'Invalid login or password'})
    }

    this.#logger.verbose('Login result:', authData)
    return authData
  }

  async logoutAction(req, res) {
    if (!req.session || !req.session.user) {
      this.#logger.info('Logout failed: Not logged in')
      return res.status(200).json({message: 'Not logged in'})
    }
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({message: 'Logout failed'})
      }
      res.clearCookie('connect.sid')
      res.json({
        status: 'success',
        message: 'Logged out successfully'
      })
    })
  }

  async checkLoggedInAction(req, res) {
    const sessionUser = req?.session.user
    if (!sessionUser) {
      this.#logger.verbose('Login check failed:', {sessionUser: !!sessionUser})
      return res.status(401).json({
        isLoggedIn: false,
        message: 'Not logged in'
      })
    }

    try {
      // Verify session user matches the user in the database
      const authData = await this.#authService.validateSession(sessionUser.login)
      if (sessionUser.id !== authData.id) {
        throw new Error('Session mismatch')
      }

      return res.json(authData)
    } catch (error) {
      this.#logger.verbose('Session validation failed:', error.message)
      return res.status(401).json({
        isLoggedIn: false,
        message: 'Invalid session'
      })
    }
  }
}
