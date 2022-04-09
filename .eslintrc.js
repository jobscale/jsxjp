module.exports = {
  extends: 'airbnb-base',
  globals: {
    logger: 'readonly',
    spawn: 'readonly',
    fetch: 'readonly',
  },
  rules: {
    indent: ['error', 2, { MemberExpression: 0 }],
    'arrow-parens': 'off',
    'no-plusplus': 'off',
    'class-methods-use-this': 'off',
    'no-await-in-loop': 'off',
    'no-param-reassign': 'off',
  },
};
