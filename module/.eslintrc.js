const path = require("path")
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-useless-computed-key */
// Overrides for linting of client Typescript
const off = 0;
const warn = 1;
const error = 2;

const projects = path.resolve(__dirname, "src", "tsconfig.json");

module.exports = {
  env: {
    es2020: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  plugins: ['no-only-tests'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'airbnb-base',
    'prettier/@typescript-eslint',
    'plugin:prettier/recommended',
    'plugin:react/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    project: projects,
    ecmaFeatures: {
      jsx: true, // Allows for the parsing of JSX
    },
  },
  globals: {
    window: true,
    document: true,
    localStorage: true,
    IntersectionObserver: true,
    MutationObserver: true,
    AppConfig: true,
    alert: true,
    location: true,
  },
  rules: {
    ['@typescript-eslint/no-floating-promises']: error,

    ['@typescript-eslint/no-namespace']: off,
    ['@typescript-eslint/interface-name-prefix']: off,
    ['@typescript-eslint/explicit-function-return-type']: off,
    ['@typescript-eslint/no-explicit-any']: off,
    ['@typescript-eslint/no-parameter-properties']: off,
    ['@typescript-eslint/explicit-member-accessibility']: off,
    ['@typescript-eslint/no-empty-interface']: off,
    ['@typescript-eslint/no-unused-vars']: error,
    ['@typescript-eslint/no-use-before-define']: error,

    ['import/no-unresolved']: off,
    ['import/prefer-default-export']: off,

    ['react/prop-types']: off,
    ['react/no-unescaped-entities']: off,
    ['no-unused-vars']: off,
    ['no-use-before-define']: off,
    ['no-inner-declarations']: off,
    ['class-methods-use-this']: off,
    ['no-useless-constructor']: off,
    ['no-undef']: off,
    ['global-require']: off,

    ['no-restricted-syntax']: off,
    ['no-await-in-loop']: off,
    ['no-continue']: off,
    ['import/extensions']: off,
    ['max-classes-per-file']: off,

    ['no-case-declarations']: off,

    ['no-only-tests/no-only-tests']: 'error',

    // React
    ['react/jsx-props-no-spreading']: off,
    ['react/jsx-one-expression-per-line']: off,
    ['react/display-name']: off,
    ['react/jsx-wrap-multilines']: off /* can sometimes conflict with prettier */,
    ['import/no-cycle']: off,

    // Typescript
    ['@typescript-eslint/unbound-method']: off /* allow requiring of assets */,
    ['@typescript-eslint/explicit-module-boundary-types']: off,
    ['@typescript-eslint/no-var-requires']: off,
  },
  env: {
    mocha: true,
    node: true,
  },
  settings: {
    react: {
      version: '16',
    },
  },
};
