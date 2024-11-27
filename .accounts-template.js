export default {
  accounts: {
    account1: {
      name: 'account1',
      firstName: 'firstName1',
      lastName: 'lastName1',
      casUrl: 'https://cas.agora06.fr/login?service=https%3A%2F%2Fl-eganaude.agora06.fr%2Fsg.do%3FPROC%3DIDENTIFICATION_FRONT',
      login: '',
      password: ''
    },
    account2: {
      name: 'account2',
      casUrl: 'https://cas.agora06.fr/login?service=https%3A%2F%2Fl-eganaude.agora06.fr%2Fsg.do%3FPROC%3DIDENTIFICATION_FRONT',
      firstName: 'firstName2',
      lastName: 'lastName2',
      login: '',
      password: ''
    }
  },
  users: {
    student1: {
      login: 'student1',
      password: 'password',
      firstName: 'firstName1',
      lastName: 'lastName1',
      role: 'user',
      accounts: ['account1'],
    },
    student2: {
      login: 'student2',
      password: 'password',
      firstName: 'firstName2',
      lastName: 'lastName2',
      role: 'user',
      accounts: ['account2'],
    },
    admin: {
      login: 'admin',
      password: 'admin',
      firstName: 'Admin',
      lastName: 'Admin',
      role: 'admin',
      accounts: ['account1', 'account2'],
    },
  }
}
