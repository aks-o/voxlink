"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRouter = void 0;
const express_1 = require("express");
const shared_1 = require("@voxlink/shared");
const database_service_1 = require("../services/database.service");
const redis_service_1 = require("../services/redis.service");
exports.healthRouter = (0, express_1.Router)();
// Create health check manager for Number Service
const healthManager = new shared_1.HealthCheckManager('number-service');
// Register health checks
healthManager.register('memory', shared_1.commonHealthChecks.memory(512)); // 512MB limit
healthManager.register('database', shared_1.commonHealthChecks.database(async () => {
    return await database_service_1.DatabaseService.healthCheck();
}));
healthManager.register('redis', shared_1.commonHealthChecks.redis(async () => {
    return await redis_service_1.RedisService.healthCheck();
}));
// Health check endpoints
exports.healthRouter.get('/', healthManager.healthEndpoint());
exports.healthRouter.get('/detailed', healthManager.healthEndpoint());
exports.healthRouter.get('/ready', healthManager.readinessEndpoint(['database', 'redis']));
exports.healthRouter.get('/live', healthManager.livenessEndpoint());
