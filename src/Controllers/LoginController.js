import AuthService from '#pronote/Services/AuthService.js'

export default class LoginController {
  /** @type {AuthService} */
  #authService
  #verbose
  #cookieOptions

  constructor({authService, cookieOptions, verbose}) {
    this.#authService = authService
    this.#verbose = verbose
    this.#cookieOptions = Object.assign({
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax'
    }, cookieOptions)
  }

  async loginAction(req, res) {
    if (this.#verbose) {
      console.debug('Attempting login ...')
    }
    const {login, password} = req.body
    const authData = await this.#authService.login(login, password)

    if (authData.authenticated) {
      const sessionData = {id: authData.id, login: login, role: authData.role}
      req.session.user = sessionData
      res.json({message: 'Login successful'})
    } else {
      res.status(401).json({message: 'Invalid login or password'})
    }

    if (this.#verbose) {
      console.debug('Login result:', authData)
    }
    return authData
  }

  logoutAction(req, res) {
    if (!req.session || !req.session.user) {
      console.info('Logout failed: Not logged in')
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

  checkLoggedInAction = async (req, res) => {
    const sessionUser = req?.session.user
    if (!sessionUser) {
      if (this.#verbose) {
        console.debug('Login check failed:', {sessionUser: !!sessionUser})
      }
      return res.status(401).json({
        isLoggedIn: false,
        message: 'Not logged in'
      })
    }

    try {
      // Verify session user matches the user in the database
      const user = await this.#authService.validateSession(sessionUser.login)
      if (sessionUser.id !== user.id) {
        throw new Error('Session mismatch')
      }

      return res.json({
        isLoggedIn: true,
        user: sessionUser
      })
    } catch (error) {
      if (this.#verbose) {
        console.debug('Session validation failed:', error.message)
      }
      return res.status(401).json({
        isLoggedIn: false,
        message: 'Invalid session'
      })
    }
  }
}
