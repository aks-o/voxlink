"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRouter = void 0;
const express_1 = require("express");
const router = (0, express_1.Router)();
exports.healthRouter = router;
router.get('/', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'ai-agent-service',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
    });
});
