import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
export interface TestAppOptions {
    enableCors?: boolean;
    enableHelmet?: boolean;
    enableCompression?: boolean;
    enableWebSocket?: boolean;
    database?: PrismaClient;
}
export declare function createTestApp(serviceName: string, options?: TestAppOptions): Promise<Express>;
export declare function createTestDatabase(): Promise<PrismaClient>;
export declare function cleanupTestDatabase(prisma: PrismaClient): Promise<void>;
export declare function createAuthToken(user: any): string;
export declare function createTestUser(overrides?: any): any;
export declare function createAdminUser(overrides?: any): any;
export declare function mockExternalServices(): void;
export declare function measureApiPerformance(app: Express, endpoint: string, method?: 'GET' | 'POST' | 'PUT' | 'DELETE', data?: any, iterations?: number): Promise<{
    min: number;
    max: number;
    avg: number;
    median: number;
    p95: number;
    p99: number;
    times: number[];
}>;
export declare function createLoadTestScenario(app: Express, scenarios: Array<{
    endpoint: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    data?: any;
    weight: number;
}>, options: {
    duration: number;
    concurrency: number;
    rampUp?: number;
}): () => Promise<{
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    successRate: number;
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
    p50Duration: any;
    p95Duration: any;
    p99Duration: any;
    requestsPerSecond: number;
    results: any[];
}>;
