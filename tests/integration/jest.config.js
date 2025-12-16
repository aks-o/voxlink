module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  displayName: 'Integration Tests',
  testMatch: ['<rootDir>/**/*.integration.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/setup.ts'],
  testTimeout: 60000,
  collectCoverageFrom: [
    '../../packages/*/src/**/*.ts',
    '!../../packages/*/src/**/*.d.ts',
    '!../../packages/*/src/**/*.test.ts',
    '!../../packages/*/src/**/*.spec.ts',
  ],
  coverageDirectory: '../../coverage/integration',
  coverageReporters: ['text', 'lcov', 'html'],
  globalSetup: '<rootDir>/global-setup.ts',
  globalTeardown: '<rootDir>/global-teardown.ts',
};