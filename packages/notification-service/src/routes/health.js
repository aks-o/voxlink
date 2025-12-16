"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRouter = void 0;
const express_1 = require("express");
const database_service_1 = require("../services/database.service");
exports.healthRouter = (0, express_1.Router)();
exports.healthRouter.get('/', async (req, res) => {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'notification-service',
        version: process.env.npm_package_version || '1.0.0',
        uptime: process.uptime(),
        checks: {
            database: false,
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
    // Determine overall health status
    const isHealthy = health.checks.database;
    health.status = isHealthy ? 'healthy' : 'unhealthy';
    const statusCode = isHealthy ? 200 : 503;
    res.status(statusCode).json(health);
});
