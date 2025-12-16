module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  displayName: 'E2E Tests',
  testMatch: ['<rootDir>/**/*.e2e.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/setup.ts'],
  testTimeout: 30000,
  collectCoverageFrom: [
    '../../packages/*/src/**/*.ts',
    '!../../packages/*/src/**/*.d.ts',
    '!../../packages/*/src/**/*.test.ts',
    '!../../packages/*/src/**/*.spec.ts',
  ],
  coverageDirectory: '../../coverage/e2e',
  coverageReporters: ['text', 'lcov', 'html'],
  globalSetup: '<rootDir>/global-setup.ts',
  globalTeardown: '<rootDir>/global-teardown.ts',
};