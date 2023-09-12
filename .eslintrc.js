module.exports = {
  extends: 'airbnb-base',
  globals: {
    Vue: 'readonly',
  },
  env: {
    node: true,
    browser: true,
  },
  parserOptions: {
    ecmaVersion: 2023,
  },
  rules: {
    indent: ['error', 2, { MemberExpression: 0 }],
    'no-trailing-spaces': 'error',
    'arrow-parens': 'off',
    'no-plusplus': 'off',
    'class-methods-use-this': 'off',
    'no-await-in-loop': 'off',
    'no-param-reassign': 'off',
  },
};
