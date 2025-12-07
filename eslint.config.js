import globals from 'globals';
import jestPlugin from 'eslint-plugin-jest';
import standard from '@jobscale/eslint-plugin-standard';

export default [{
  ignores: [
    ...standard.configs.standard.ignores,
  ],
}, {
  ...standard.configs.browser,
  name: 'browser rule',
  files: ['docs/*.js', 'public/*.js'],
  rules: {
    ...standard.configs.standard.rules,
  },
}, {
  ...standard.configs.node,
  name: 'node rule',
  files: ['app/*.js', 'src/*.js', '**/*.test.js', '**/__tests__/**/*.js'],
  rules: {
    ...standard.configs.standard.rules,
  },
}, {
  name: 'jest rule',
  files: ['**/*.test.js', '**/__tests__/**/*.js'],
  languageOptions: {
    sourceType: 'module',
    ecmaVersion: 'latest',
    globals: {
      ...globals.node,
      ...globals.jest,
    },
  },
  plugins: {
    jest: jestPlugin,
  },
  rules: {
    ...jestPlugin.configs.recommended.rules,
    'jest/no-disabled-tests': 'warn',
    'jest/no-focused-tests': 'error',
    'jest/no-identical-title': 'error',
    'jest/prefer-to-have-length': 'warn',
    'jest/valid-expect': 'error',
  },
}];
