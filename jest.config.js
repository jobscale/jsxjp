export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/cdk-app/lib/functions/proxy/__tests__'],
  testMatch: ['**/*.test.js'],
  collectCoverage: true,
  verbose: true,
  maxWorkers: 1,
};
