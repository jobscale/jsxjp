export default {
  testEnvironment: 'node',
  roots: [
    '<rootDir>/test',
    '<rootDir>/lib/functions/proxy/__tests__',
  ],
  testMatch: ['**/*.test.js'],
  setupFilesAfterEnv: ['aws-cdk-lib/testhelpers/jest-autoclean'],
};
