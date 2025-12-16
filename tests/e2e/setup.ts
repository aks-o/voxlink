import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { Client } from 'pg';
import Redis from 'ioredis';

declare global {
  var __POSTGRES_CONTAINER__: StartedTestContainer;
  var __REDIS_CONTAINER__: StartedTestContainer;
  var __POSTGRES_CLIENT__: Client;
  var __REDIS_CLIENT__: Redis;
}

export const setupTestDatabase = async () => {
  // Start PostgreSQL container
  const postgresContainer = await new GenericContainer('postgres:15')
    .withEnvironment({
      POSTGRES_DB: 'voxlink_test',
      POSTGRES_USER: 'test',
      POSTGRES_PASSWORD: 'test',
    })
    .withExposedPorts(5432)
    .start();

  global.__POSTGRES_CONTAINER__ = postgresContainer;

  // Start Redis container
  const redisContainer = await new GenericContainer('redis:7-alpine')
    .withExposedPorts(6379)
    .start();

  global.__REDIS_CONTAINER__ = redisContainer;

  // Create database client
  const postgresClient = new Client({
    host: postgresContainer.getHost(),
    port: postgresContainer.getMappedPort(5432),
    database: 'voxlink_test',
    user: 'test',
    password: 'test',
  });

  await postgresClient.connect();
  global.__POSTGRES_CLIENT__ = postgresClient;

  // Create Redis client
  const redisClient = new Redis({
    host: redisContainer.getHost(),
    port: redisContainer.getMappedPort(6379),
  });

  global.__REDIS_CLIENT__ = redisClient;

  // Set environment variables for tests
  process.env.DATABASE_URL = `postgresql://test:test@${postgresContainer.getHost()}:${postgresContainer.getMappedPort(5432)}/voxlink_test`;
  process.env.REDIS_URL = `redis://${redisContainer.getHost()}:${redisContainer.getMappedPort(6379)}`;
  process.env.NODE_ENV = 'test';
};

export const teardownTestDatabase = async () => {
  if (global.__POSTGRES_CLIENT__) {
    await global.__POSTGRES_CLIENT__.end();
  }
  
  if (global.__REDIS_CLIENT__) {
    await global.__REDIS_CLIENT__.quit();
  }

  if (global.__POSTGRES_CONTAINER__) {
    await global.__POSTGRES_CONTAINER__.stop();
  }

  if (global.__REDIS_CONTAINER__) {
    await global.__REDIS_CONTAINER__.stop();
  }
};

beforeAll(async () => {
  await setupTestDatabase();
});

afterAll(async () => {
  await teardownTestDatabase();
});