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
      const sessionData = {userId: authData.id, role: authData.role}
      req.session.user = sessionData
      res.cookie('pronoteUser', login, this.#cookieOptions)
      res.cookie('pronoteLogged', true, this.#cookieOptions)
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
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({message: 'Logout failed'})
      }
      res.clearCookie('pronoteUser')
      res.clearCookie('pronoteLogged')
      res.json({
        status: 'success',
        message: 'Logged out successfully'
      })
    })
  }

  checkLoggedInAction = async (req, res) => {
    const pronoteUserCookie = req.cookies?.pronoteUser
    const pronoteLoggedCookie = req.cookies?.pronoteLogged

    if (!pronoteUserCookie || !pronoteLoggedCookie || !req.session?.user) {
      if (this.#verbose) {
        console.debug('Login check failed:', {
          pronoteUserCookie: !!pronoteUserCookie,
          pronoteLoggedCookie: !!pronoteLoggedCookie,
          sessionUser: !!req.session?.user
        })
      }
      return res.status(401).json({
        isLoggedIn: false,
        message: 'Not logged in'
      })
    }

    try {
      // Verify the cookie matches the session user
      if (req.session.user.userId !== (await this.#authService.validateSession(pronoteUserCookie)).id) {
        throw new Error('Session mismatch')
      }

      return res.json({
        isLoggedIn: true,
        user: {
          id: req.session.user.userId,
          role: req.session.user.role,
          login: pronoteUserCookie
        }
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
