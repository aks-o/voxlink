"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webSocketRouter = exports.createWebSocketRouter = void 0;
const express_1 = require("express");
const websocket_service_1 = require("../services/websocket.service");
const logger_1 = require("../utils/logger");
const createWebSocketRouter = () => {
    const router = (0, express_1.Router)();
    // Get WebSocket connection statistics
    router.get('/stats', (req, res) => {
        try {
            const stats = websocket_service_1.webSocketService.getSubscriptionStats();
            res.json({
                success: true,
                data: stats
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting WebSocket stats:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get WebSocket statistics'
            });
        }
    });
    // Broadcast a test call event (for testing purposes)
    router.post('/test/call-event', (req, res) => {
        try {
            const { type, callId, agentId, metadata } = req.body;
            const callEvent = {
                type,
                callId: callId || `test-call-${Date.now()}`,
                agentId,
                customerId: `test-customer-${Date.now()}`,
                timestamp: new Date(),
                metadata: metadata || {
                    fromNumber: '+15551234567',
                    toNumber: '+15559876543'
                }
            };
            websocket_service_1.webSocketService.broadcastCallEvent(callEvent);
            res.json({
                success: true,
                message: 'Test call event broadcasted',
                data: callEvent
            });
        }
        catch (error) {
            logger_1.logger.error('Error broadcasting test call event:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to broadcast test call event'
            });
        }
    });
    // Broadcast a test notification (for testing purposes)
    router.post('/test/notification', (req, res) => {
        try {
            const { type, severity, message } = req.body;
            const notification = {
                type: type || 'alert',
                severity: severity || 'medium',
                message: message || 'This is a test notification',
                timestamp: new Date()
            };
            websocket_service_1.webSocketService.broadcastNotification(notification);
            res.json({
                success: true,
                message: 'Test notification broadcasted',
                data: notification
            });
        }
        catch (error) {
            logger_1.logger.error('Error broadcasting test notification:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to broadcast test notification'
            });
        }
    });
    // Broadcast a test performance alert (for testing purposes)
    router.post('/test/performance-alert', (req, res) => {
        try {
            const { type, metric, currentValue, threshold, affectedServices } = req.body;
            const alert = {
                type: type || 'threshold_breach',
                metric: metric || 'response_time',
                currentValue: currentValue || 1500,
                threshold: threshold || 1000,
                timestamp: new Date(),
                affectedServices: affectedServices || ['api-gateway', 'number-service']
            };
            websocket_service_1.webSocketService.broadcastPerformanceAlert(alert);
            res.json({
                success: true,
                message: 'Test performance alert broadcasted',
                data: alert
            });
        }
        catch (error) {
            logger_1.logger.error('Error broadcasting test performance alert:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to broadcast test performance alert'
            });
        }
    });
    return router;
};
exports.createWebSocketRouter = createWebSocketRouter;
exports.webSocketRouter = (0, exports.createWebSocketRouter)();
