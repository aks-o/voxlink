import { StartedTestContainer } from 'testcontainers';
import { Client } from 'pg';
import Redis from 'ioredis';
declare global {
    var __POSTGRES_CONTAINER__: StartedTestContainer;
    var __REDIS_CONTAINER__: StartedTestContainer;
    var __POSTGRES_CLIENT__: Client;
    var __REDIS_CLIENT__: Redis;
}
export declare const setupIntegrationTests: () => Promise<void>;
export declare const teardownIntegrationTests: () => Promise<void>;
