"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.teardownIntegrationTests = exports.setupIntegrationTests = void 0;
const testcontainers_1 = require("testcontainers");
const pg_1 = require("pg");
const ioredis_1 = __importDefault(require("ioredis"));
const child_process_1 = require("child_process");
const setupIntegrationTests = async () => {
    console.log('🚀 Setting up integration test containers...');
    // Start PostgreSQL container with specific configuration
    const postgresContainer = await new testcontainers_1.GenericContainer('postgres:15')
        .withEnvironment({
        POSTGRES_DB: 'voxlink_integration_test',
        POSTGRES_USER: 'test_user',
        POSTGRES_PASSWORD: 'test_password',
    })
        .withExposedPorts(5432)
        .withTmpFs({ '/var/lib/postgresql/data': 'rw,noexec,nosuid,size=1024m' })
        .start();
    global.__POSTGRES_CONTAINER__ = postgresContainer;
    // Start Redis container
    const redisContainer = await new testcontainers_1.GenericContainer('redis:7-alpine')
        .withExposedPorts(6379)
        .withCommand(['redis-server', '--maxmemory', '256mb', '--maxmemory-policy', 'allkeys-lru'])
        .start();
    global.__REDIS_CONTAINER__ = redisContainer;
    // Create database client
    const postgresClient = new pg_1.Client({
        host: postgresContainer.getHost(),
        port: postgresContainer.getMappedPort(5432),
        database: 'voxlink_integration_test',
        user: 'test_user',
        password: 'test_password',
    });
    await postgresClient.connect();
    global.__POSTGRES_CLIENT__ = postgresClient;
    // Create Redis client
    const redisClient = new ioredis_1.default({
        host: redisContainer.getHost(),
        port: redisContainer.getMappedPort(6379),
        maxRetriesPerRequest: 3,
        lazyConnect: true,
    });
    global.__REDIS_CLIENT__ = redisClient;
    // Set environment variables for tests
    process.env.DATABASE_URL = `postgresql://test_user:test_password@${postgresContainer.getHost()}:${postgresContainer.getMappedPort(5432)}/voxlink_integration_test`;
    process.env.REDIS_URL = `redis://${redisContainer.getHost()}:${redisContainer.getMappedPort(6379)}`;
    process.env.NODE_ENV = 'integration_test';
    // Run database migrations
    console.log('📊 Running database migrations...');
    try {
        // Run migrations for each service
        const services = ['number-service', 'billing-service', 'notification-service'];
        for (const service of services) {
            try {
                (0, child_process_1.execSync)(`cd packages/${service} && npx prisma migrate deploy`, {
                    stdio: 'pipe',
                    env: { ...process.env },
                });
                console.log(`✅ Migrations completed for ${service}`);
            }
            catch (error) {
                console.warn(`⚠️ Migration failed for ${service}, continuing...`);
            }
        }
    }
    catch (error) {
        console.warn('⚠️ Some migrations failed, but continuing with tests...');
    }
    console.log('✅ Integration test environment ready');
};
exports.setupIntegrationTests = setupIntegrationTests;
const teardownIntegrationTests = async () => {
    console.log('🧹 Cleaning up integration test containers...');
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
    console.log('✅ Integration test cleanup complete');
};
exports.teardownIntegrationTests = teardownIntegrationTests;
beforeAll(async () => {
    await (0, exports.setupIntegrationTests)();
}, 120000); // 2 minutes timeout for container setup
afterAll(async () => {
    await (0, exports.teardownIntegrationTests)();
}, 30000); // 30 seconds timeout for cleanup
