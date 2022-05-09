module.exports = {
  root: true,
  env: {
    browser: true,
    commonjs: true,
    es2021: true
  },
  globals: {
    process: true,
    __filename: 'readonly',
  },
  extends: "eslint:recommended",
  parserOptions: {
    ecmaVersion: "latest"
  },
  rules: {
    'semi': ['error', 'never'],
    'array-bracket-spacing': ['error', 'never'],
    'block-spacing': ['error', 'always'],
    'comma-spacing': ['error', { 'before': false, 'after': true }],
    'computed-property-spacing': ['error', 'never'],
    'keyword-spacing': ['error', { 'before': true, 'after': true }],
    'rest-spread-spacing': ['error', 'never'],
    'arrow-spacing': ['error', { 'before': true, 'after': true }],
    'spaced-comment': ['error', 'always'],
    'space-unary-ops': ['error', { 'words': true, 'nonwords': false }],
    'space-in-parens': ['error', 'never'],
    'space-infix-ops': ['error'],
    'space-before-function-paren': ['error', 'always'],
    'space-before-blocks': ['error', 'always']
  }
}
