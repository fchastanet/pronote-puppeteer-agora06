import globals from 'globals'
import js from '@eslint/js'
import stylisticJs from '@stylistic/eslint-plugin-js'
import jsdoc from 'eslint-plugin-jsdoc'
import html from 'eslint-plugin-html'

export default [
  js.configs.recommended,
  jsdoc.configs['flat/recommended'],
  {
    files: ['**/*.js'],
    plugins: {
      jsdoc,
      html,
      '@stylistic/js': stylisticJs,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      quotes: ['error', 'single'],
      semi: ['error', 'never'],
      '@stylistic/js/indent': ['error', 2, {SwitchCase: 1}],
      'no-var': 'error',
      'prefer-const': 'error',
      'arrow-parens': ['error', 'always'],
      'jsdoc/require-description': 'warn',
    },
  },
]
