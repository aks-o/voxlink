import { setupTestDatabase } from '../e2e/setup';

beforeAll(async () => {
  await setupTestDatabase();
});