import { setupTestDatabase } from '../e2e/setup';

// Reuse the same database setup for performance tests
beforeAll(async () => {
  await setupTestDatabase();
});

// Performance test specific setup
global.performance = global.performance || {
  now: () => Date.now(),
  mark: () => {},
  measure: () => {},
};