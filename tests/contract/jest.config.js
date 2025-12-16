module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  displayName: 'Contract Tests',
  testMatch: ['<rootDir>/**/*.contract.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/setup.ts'],
  testTimeout: 30000,
  collectCoverageFrom: [
    '../../packages/*/src/**/*.ts',
    '!../../packages/*/src/**/*.d.ts',
    '!../../packages/*/src/**/*.test.ts',
    '!../../packages/*/src/**/*.spec.ts',
  ],
  coverageDirectory: '../../coverage/contract',
  coverageReporters: ['text', 'lcov'],
};