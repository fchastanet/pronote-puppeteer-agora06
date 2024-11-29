export default {
  students: {
    student1: {
      name: 'student1',
      firstName: 'firstName1',
      lastName: 'lastName1',
      pronoteCasUrl: 'https://cas.agora06.fr/login?service=https%3A%2F%2Fl-eganaude.agora06.fr%2Fsg.do%3FPROC%3DIDENTIFICATION_FRONT',
      pronoteLogin: '',
      pronotePassword: ''
    },
    student2: {
      name: 'student2',
      firstName: 'firstName2',
      lastName: 'lastName2',
      pronoteCasUrl: 'https://cas.agora06.fr/login?service=https%3A%2F%2Fl-eganaude.agora06.fr%2Fsg.do%3FPROC%3DIDENTIFICATION_FRONT',
      pronoteLogin: '',
      pronotePassword: ''
    }
  },
  users: {
    student1: {
      login: 'student1',
      password: 'password',
      firstName: 'firstName1',
      lastName: 'lastName1',
      role: 'user',
      students: ['student1'],
    },
    student2: {
      login: 'student2',
      password: 'password',
      firstName: 'firstName2',
      lastName: 'lastName2',
      role: 'user',
      students: ['student2'],
    },
    admin: {
      login: 'admin',
      password: 'admin',
      firstName: 'Admin',
      lastName: 'Admin',
      role: 'admin',
      students: ['student1', 'student2'],
    },
  }
}
