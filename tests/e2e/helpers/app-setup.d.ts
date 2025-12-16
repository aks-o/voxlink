import { Express } from 'express';
export declare const setupTestApp: (service?: string) => Promise<Express>;
export declare const waitForService: (app: Express, maxRetries?: number) => Promise<void>;
