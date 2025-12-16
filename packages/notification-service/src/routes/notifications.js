"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationsRouter = void 0;
const express_1 = require("express");
const database_service_1 = require("../services/database.service");
const template_service_1 = require("../services/template.service");
const notification_service_1 = require("../services/notification.service");
const preference_service_1 = require("../services/preference.service");
const email_service_1 = require("../services/delivery/email.service");
const sms_service_1 = require("../services/delivery/sms.service");
const webhook_service_1 = require("../services/delivery/webhook.service");
const error_handler_1 = require("../middleware/error-handler");
exports.notificationsRouter = (0, express_1.Router)();
// Initialize services
const prisma = database_service_1.DatabaseService.getClient();
const templateService = new template_service_1.TemplateService(prisma);
const emailService = new email_service_1.EmailService();
const smsService = new sms_service_1.SMSService();
const webhookService = new webhook_service_1.WebhookService();
const notificationService = new notification_service_1.NotificationService(prisma, templateService, emailService, smsService, webhookService);
const preferenceService = new preference_service_1.PreferenceService(prisma);
// Create notification
exports.notificationsRouter.post('/', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { userId, type, priority, templateId, subject, content, data, scheduledAt, channels, } = req.body;
    if (!userId || !type) {
        throw new error_handler_1.ValidationError('userId and type are required');
    }
    const notifications = await notificationService.createNotification({
        userId,
        type,
        priority,
        templateId,
        subject,
        content,
        data,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        channels,
    });
    res.status(201).json({
        success: true,
        data: notifications,
    });
}));
// Get user notifications
exports.notificationsRouter.get('/user/:userId', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { userId } = req.params;
    const { limit = '50', offset = '0' } = req.query;
    const result = await notificationService.getUserNotifications(userId, parseInt(limit, 10), parseInt(offset, 10));
    res.json({
        success: true,
        data: result.notifications,
        pagination: {
            total: result.total,
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10),
        },
    });
}));
// Send notification by ID
exports.notificationsRouter.post('/:id/send', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const success = await notificationService.sendNotification(id);
    res.json({
        success,
        message: success ? 'Notification sent successfully' : 'Failed to send notification',
    });
}));
// Mark notification as read
exports.notificationsRouter.put('/:id/read', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    await notificationService.markAsRead(id);
    res.json({
        success: true,
        message: 'Notification marked as read',
    });
}));
// Get notification preferences
exports.notificationsRouter.get('/preferences/:userId', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { userId } = req.params;
    const preferences = await preferenceService.getPreferences(userId);
    if (!preferences) {
        // Return default preferences if none exist
        const defaultPrefs = preferenceService.getDefaultPreferences(userId);
        return res.json({
            success: true,
            data: defaultPrefs,
            isDefault: true,
        });
    }
    res.json({
        success: true,
        data: preferences,
        isDefault: false,
    });
}));
// Update notification preferences
exports.notificationsRouter.put('/preferences/:userId', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { userId } = req.params;
    const updates = req.body;
    // Validate preferences
    const errors = preferenceService.validatePreferences(updates);
    if (errors.length > 0) {
        throw new error_handler_1.ValidationError(`Validation errors: ${errors.join(', ')}`);
    }
    const preferences = await preferenceService.updatePreferences(userId, updates);
    res.json({
        success: true,
        data: preferences,
    });
}));
// Toggle notification type
exports.notificationsRouter.put('/preferences/:userId/types/:type', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { userId, type } = req.params;
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') {
        throw new error_handler_1.ValidationError('enabled must be a boolean');
    }
    const validTypes = ['call', 'sms', 'billing', 'system', 'porting'];
    if (!validTypes.includes(type)) {
        throw new error_handler_1.ValidationError(`Invalid notification type. Must be one of: ${validTypes.join(', ')}`);
    }
    const preferences = await preferenceService.toggleNotificationType(userId, type, enabled);
    res.json({
        success: true,
        data: preferences,
    });
}));
// Toggle notification channel
exports.notificationsRouter.put('/preferences/:userId/channels/:channel', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { userId, channel } = req.params;
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') {
        throw new error_handler_1.ValidationError('enabled must be a boolean');
    }
    const validChannels = ['email', 'sms', 'push', 'webhook'];
    if (!validChannels.includes(channel)) {
        throw new error_handler_1.ValidationError(`Invalid channel. Must be one of: ${validChannels.join(', ')}`);
    }
    const preferences = await preferenceService.toggleChannel(userId, channel, enabled);
    res.json({
        success: true,
        data: preferences,
    });
}));
// Update contact information
exports.notificationsRouter.put('/preferences/:userId/contact', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { userId } = req.params;
    const { email, phoneNumber, webhookUrl } = req.body;
    const contactInfo = { email, phoneNumber, webhookUrl };
    // Validate contact info
    const errors = preferenceService.validatePreferences(contactInfo);
    if (errors.length > 0) {
        throw new error_handler_1.ValidationError(`Validation errors: ${errors.join(', ')}`);
    }
    const preferences = await preferenceService.updateContactInfo(userId, contactInfo);
    res.json({
        success: true,
        data: preferences,
    });
}));
// Configure quiet hours
exports.notificationsRouter.put('/preferences/:userId/quiet-hours', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { userId } = req.params;
    const { enabled, start, end, timezone } = req.body;
    if (typeof enabled !== 'boolean') {
        throw new error_handler_1.ValidationError('enabled must be a boolean');
    }
    const preferences = await preferenceService.configureQuietHours(userId, {
        enabled,
        start,
        end,
        timezone,
    });
    res.json({
        success: true,
        data: preferences,
    });
}));
// Test notification delivery
exports.notificationsRouter.post('/test/:channel', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { channel } = req.params;
    const { to, message } = req.body;
    if (!to) {
        throw new error_handler_1.ValidationError('to parameter is required');
    }
    let result;
    switch (channel) {
        case 'email':
            if (!message) {
                result = await emailService.sendTestEmail(to);
            }
            else {
                result = await emailService.sendEmail({
                    to,
                    subject: 'Test Notification',
                    content: message,
                });
            }
            break;
        case 'sms':
            result = await smsService.sendTestSMS(to);
            break;
        case 'webhook':
            result = await webhookService.testWebhook(to);
            break;
        default:
            throw new error_handler_1.ValidationError('Invalid channel. Must be one of: email, sms, webhook');
    }
    res.json({
        success: result.success,
        data: result,
    });
}));
