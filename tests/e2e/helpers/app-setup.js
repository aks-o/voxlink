"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitForService = exports.setupTestApp = void 0;
const index_1 = require("../../../packages/api-gateway/src/index");
const index_2 = require("../../../packages/number-service/src/index");
const index_3 = require("../../../packages/billing-service/src/index");
const index_4 = require("../../../packages/notification-service/src/index");
const setupTestApp = async (service) => {
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/voxlink_test';
    switch (service) {
        case 'number-service':
            return await (0, index_2.createApp)();
        case 'billing-service':
            return await (0, index_3.createApp)();
        case 'notification-service':
            return await (0, index_4.createApp)();
        default:
            // Return API Gateway by default (which proxies to all services)
            return await (0, index_1.createApp)();
    }
};
exports.setupTestApp = setupTestApp;
const waitForService = async (app, maxRetries = 10) => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            // Try to make a health check request
            const request = require('supertest');
            await request(app).get('/health').expect(200);
            return;
        }
        catch (error) {
            if (i === maxRetries - 1) {
                throw new Error(`Service failed to start after ${maxRetries} retries`);
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
};
exports.waitForService = waitForService;
