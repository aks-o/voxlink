"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.teardownTestDatabase = exports.setupTestDatabase = void 0;
const testcontainers_1 = require("testcontainers");
const pg_1 = require("pg");
const ioredis_1 = __importDefault(require("ioredis"));
const setupTestDatabase = async () => {
    // Start PostgreSQL container
    const postgresContainer = await new testcontainers_1.GenericContainer('postgres:15')
        .withEnvironment({
        POSTGRES_DB: 'voxlink_test',
        POSTGRES_USER: 'test',
        POSTGRES_PASSWORD: 'test',
    })
        .withExposedPorts(5432)
        .start();
    global.__POSTGRES_CONTAINER__ = postgresContainer;
    // Start Redis container
    const redisContainer = await new testcontainers_1.GenericContainer('redis:7-alpine')
        .withExposedPorts(6379)
        .start();
    global.__REDIS_CONTAINER__ = redisContainer;
    // Create database client
    const postgresClient = new pg_1.Client({
        host: postgresContainer.getHost(),
        port: postgresContainer.getMappedPort(5432),
        database: 'voxlink_test',
        user: 'test',
        password: 'test',
    });
    await postgresClient.connect();
    global.__POSTGRES_CLIENT__ = postgresClient;
    // Create Redis client
    const redisClient = new ioredis_1.default({
        host: redisContainer.getHost(),
        port: redisContainer.getMappedPort(6379),
    });
    global.__REDIS_CLIENT__ = redisClient;
    // Set environment variables for tests
    process.env.DATABASE_URL = `postgresql://test:test@${postgresContainer.getHost()}:${postgresContainer.getMappedPort(5432)}/voxlink_test`;
    process.env.REDIS_URL = `redis://${redisContainer.getHost()}:${redisContainer.getMappedPort(6379)}`;
    process.env.NODE_ENV = 'test';
};
exports.setupTestDatabase = setupTestDatabase;
const teardownTestDatabase = async () => {
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
exports.teardownTestDatabase = teardownTestDatabase;
beforeAll(async () => {
    await (0, exports.setupTestDatabase)();
});
afterAll(async () => {
    await (0, exports.teardownTestDatabase)();
});
