"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configurationRouter = void 0;
const express_1 = require("express");
const configuration_service_1 = require("../services/configuration.service");
const error_handler_1 = require("../middleware/error-handler");
exports.configurationRouter = (0, express_1.Router)();
const configService = new configuration_service_1.ConfigurationService();
// Get complete configuration for a number
exports.configurationRouter.get('/:numberId', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { numberId } = req.params;
    const { userId } = req.query;
    if (!userId) {
        throw new error_handler_1.ValidationError('userId query parameter is required');
    }
    const configuration = await configService.getConfiguration(numberId, userId);
    res.json({
        success: true,
        data: configuration,
    });
}));
// Update call forwarding configuration
exports.configurationRouter.put('/:numberId/call-forwarding', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { numberId } = req.params;
    const { userId } = req.query;
    const config = req.body;
    if (!userId) {
        throw new error_handler_1.ValidationError('userId query parameter is required');
    }
    const updatedConfig = await configService.updateCallForwarding(numberId, userId, config);
    res.json({
        success: true,
        data: updatedConfig,
        message: 'Call forwarding configuration updated successfully',
    });
}));
// Update voicemail configuration
exports.configurationRouter.put('/:numberId/voicemail', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { numberId } = req.params;
    const { userId } = req.query;
    const config = req.body;
    if (!userId) {
        throw new error_handler_1.ValidationError('userId query parameter is required');
    }
    const updatedConfig = await configService.updateVoicemail(numberId, userId, config);
    res.json({
        success: true,
        data: updatedConfig,
        message: 'Voicemail configuration updated successfully',
    });
}));
// Update business hours configuration
exports.configurationRouter.put('/:numberId/business-hours', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { numberId } = req.params;
    const { userId } = req.query;
    const config = req.body;
    if (!userId) {
        throw new error_handler_1.ValidationError('userId query parameter is required');
    }
    const updatedConfig = await configService.updateBusinessHours(numberId, userId, config);
    res.json({
        success: true,
        data: updatedConfig,
        message: 'Business hours configuration updated successfully',
    });
}));
// Update notification configuration
exports.configurationRouter.put('/:numberId/notifications', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { numberId } = req.params;
    const { userId } = req.query;
    const config = req.body;
    if (!userId) {
        throw new error_handler_1.ValidationError('userId query parameter is required');
    }
    const updatedConfig = await configService.updateNotifications(numberId, userId, config);
    res.json({
        success: true,
        data: updatedConfig,
        message: 'Notification configuration updated successfully',
    });
}));
// Test configuration
exports.configurationRouter.post('/:numberId/test', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { numberId } = req.params;
    const { userId } = req.query;
    if (!userId) {
        throw new error_handler_1.ValidationError('userId query parameter is required');
    }
    const testResults = await configService.testConfiguration(numberId, userId);
    const allPassed = testResults.every(result => result.success);
    const passedCount = testResults.filter(result => result.success).length;
    res.json({
        success: true,
        data: testResults,
        summary: {
            allPassed,
            totalTests: testResults.length,
            passed: passedCount,
            failed: testResults.length - passedCount,
        },
        message: allPassed
            ? 'All configuration tests passed'
            : `${passedCount}/${testResults.length} tests passed`,
    });
}));
// Reset configuration to defaults
exports.configurationRouter.post('/:numberId/reset', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { numberId } = req.params;
    const { userId } = req.query;
    if (!userId) {
        throw new error_handler_1.ValidationError('userId query parameter is required');
    }
    const defaultConfig = await configService.resetToDefaults(numberId, userId);
    res.json({
        success: true,
        data: defaultConfig,
        message: 'Configuration reset to defaults successfully',
    });
}));
// Get configuration templates
exports.configurationRouter.get('/templates/:type', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { type } = req.params;
    const templates = {
        'business': {
            name: 'Business Hours',
            description: 'Standard business configuration with 9-5 hours and voicemail',
            callForwarding: {
                enabled: true,
                timeout: 30,
            },
            voicemail: {
                enabled: true,
                emailNotifications: true,
                transcriptionEnabled: true,
                maxDuration: 180,
            },
            businessHours: {
                timezone: 'America/New_York',
                schedule: {
                    monday: { open: '09:00', close: '17:00', enabled: true },
                    tuesday: { open: '09:00', close: '17:00', enabled: true },
                    wednesday: { open: '09:00', close: '17:00', enabled: true },
                    thursday: { open: '09:00', close: '17:00', enabled: true },
                    friday: { open: '09:00', close: '17:00', enabled: true },
                    saturday: { open: '10:00', close: '14:00', enabled: false },
                    sunday: { open: '10:00', close: '14:00', enabled: false },
                },
            },
            notifications: {
                callNotifications: true,
                smsNotifications: true,
                emailNotifications: true,
                notificationChannels: ['email', 'sms'],
            },
        },
        'personal': {
            name: 'Personal Use',
            description: 'Simple configuration for personal use',
            callForwarding: {
                enabled: false,
            },
            voicemail: {
                enabled: true,
                emailNotifications: true,
                transcriptionEnabled: false,
                maxDuration: 120,
            },
            businessHours: {
                timezone: 'America/New_York',
                schedule: {
                    monday: { open: '08:00', close: '20:00', enabled: true },
                    tuesday: { open: '08:00', close: '20:00', enabled: true },
                    wednesday: { open: '08:00', close: '20:00', enabled: true },
                    thursday: { open: '08:00', close: '20:00', enabled: true },
                    friday: { open: '08:00', close: '20:00', enabled: true },
                    saturday: { open: '09:00', close: '18:00', enabled: true },
                    sunday: { open: '10:00', close: '16:00', enabled: true },
                },
            },
            notifications: {
                callNotifications: true,
                smsNotifications: true,
                emailNotifications: true,
                notificationChannels: ['email'],
            },
        },
        '24-7': {
            name: '24/7 Service',
            description: 'Always-on configuration for round-the-clock service',
            callForwarding: {
                enabled: true,
                timeout: 20,
            },
            voicemail: {
                enabled: true,
                emailNotifications: true,
                transcriptionEnabled: true,
                maxDuration: 300,
            },
            businessHours: {
                timezone: 'UTC',
                schedule: {
                    monday: { open: '00:00', close: '23:59', enabled: true },
                    tuesday: { open: '00:00', close: '23:59', enabled: true },
                    wednesday: { open: '00:00', close: '23:59', enabled: true },
                    thursday: { open: '00:00', close: '23:59', enabled: true },
                    friday: { open: '00:00', close: '23:59', enabled: true },
                    saturday: { open: '00:00', close: '23:59', enabled: true },
                    sunday: { open: '00:00', close: '23:59', enabled: true },
                },
            },
            notifications: {
                callNotifications: true,
                smsNotifications: true,
                emailNotifications: true,
                notificationChannels: ['email', 'sms', 'webhook'],
            },
        },
    };
    const template = templates[type];
    if (!template) {
        throw new error_handler_1.NotFoundError(`Configuration template '${type}' not found`);
    }
    res.json({
        success: true,
        data: template,
    });
}));
// List all available templates
exports.configurationRouter.get('/templates', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const templates = [
        {
            type: 'business',
            name: 'Business Hours',
            description: 'Standard business configuration with 9-5 hours and voicemail',
            suitable_for: ['Small businesses', 'Professional services', 'Consultants'],
        },
        {
            type: 'personal',
            name: 'Personal Use',
            description: 'Simple configuration for personal use',
            suitable_for: ['Individual users', 'Personal projects', 'Side businesses'],
        },
        {
            type: '24-7',
            name: '24/7 Service',
            description: 'Always-on configuration for round-the-clock service',
            suitable_for: ['Emergency services', 'Global businesses', 'Support hotlines'],
        },
    ];
    res.json({
        success: true,
        data: templates,
    });
}));
