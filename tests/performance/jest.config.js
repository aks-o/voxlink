module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  displayName: 'Performance Tests',
  testMatch: ['<rootDir>/**/*.perf.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/setup.ts'],
  testTimeout: 120000, // 2 minutes for performance tests
  collectCoverageFrom: [
    '../../packages/*/src/**/*.ts',
    '!../../packages/*/src/**/*.d.ts',
    '!../../packages/*/src/**/*.test.ts',
    '!../../packages/*/src/**/*.spec.ts',
  ],
  coverageDirectory: '../../coverage/performance',
  coverageReporters: ['text', 'lcov'],
  globalSetup: '<rootDir>/global-setup.ts',
  globalTeardown: '<rootDir>/global-teardown.ts',
};