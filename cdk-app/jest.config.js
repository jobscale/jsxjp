export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/test', '<rootDir>/lib/functions/test'],
  testMatch: ['**/*.test.js'],
  setupFilesAfterEnv: ['aws-cdk-lib/testhelpers/jest-autoclean'],
};
