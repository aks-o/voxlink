"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRouter = void 0;
const express_1 = require("express");
const database_service_1 = require("../services/database.service");
const redis_service_1 = require("../services/redis.service");
exports.healthRouter = (0, express_1.Router)();
exports.healthRouter.get('/', async (req, res) => {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'billing-service',
        version: process.env.npm_package_version || '1.0.0',
        uptime: process.uptime(),
        checks: {
            database: false,
            redis: false,
        },
        memory: {
            used: process.memoryUsage().heapUsed,
            total: process.memoryUsage().heapTotal,
            external: process.memoryUsage().external,
        },
    };
    try {
        // Check database connection
        health.checks.database = await database_service_1.DatabaseService.healthCheck();
    }
    catch (error) {
        health.checks.database = false;
    }
    try {
        // Check Redis connection
        health.checks.redis = await redis_service_1.RedisService.healthCheck();
    }
    catch (error) {
        health.checks.redis = false;
    }
    // Determine overall health status
    const isHealthy = health.checks.database && health.checks.redis;
    health.status = isHealthy ? 'healthy' : 'unhealthy';
    const statusCode = isHealthy ? 200 : 503;
    res.status(statusCode).json(health);
});
