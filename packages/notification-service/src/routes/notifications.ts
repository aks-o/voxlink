import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/database.service';
import { TemplateService } from '../services/template.service';
import { NotificationService } from '../services/notification.service';
import { PreferenceService } from '../services/preference.service';
import { EmailService } from '../services/delivery/email.service';
import { SMSService } from '../services/delivery/sms.service';
import { WebhookService } from '../services/delivery/webhook.service';
import { asyncHandler, NotFoundError, ValidationError } from '../middleware/error-handler';

export const notificationsRouter = Router();

// Initialize services
const prisma = DatabaseService.getClient();
const templateService = new TemplateService(prisma);
const emailService = new EmailService();
const smsService = new SMSService();
const webhookService = new WebhookService();
const notificationService = new NotificationService(
  prisma,
  templateService,
  emailService,
  smsService,
  webhookService
);
const preferenceService = new PreferenceService(prisma);

// Create notification
notificationsRouter.post('/', asyncHandler(async (req: Request, res: Response) => {
  const {
    userId,
    type,
    priority,
    templateId,
    subject,
    content,
    data,
    scheduledAt,
    channels,
  } = req.body;

  if (!userId || !type) {
    throw new ValidationError('userId and type are required');
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
notificationsRouter.get('/user/:userId', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { limit = '50', offset = '0' } = req.query;

  const result = await notificationService.getUserNotifications(
    userId,
    parseInt(limit as string, 10),
    parseInt(offset as string, 10)
  );

  res.json({
    success: true,
    data: result.notifications,
    pagination: {
      total: result.total,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    },
  });
}));

// Send notification by ID
notificationsRouter.post('/:id/send', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const success = await notificationService.sendNotification(id);

  res.json({
    success,
    message: success ? 'Notification sent successfully' : 'Failed to send notification',
  });
}));

// Mark notification as read
notificationsRouter.put('/:id/read', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  await notificationService.markAsRead(id);

  res.json({
    success: true,
    message: 'Notification marked as read',
  });
}));

// Get notification preferences
notificationsRouter.get('/preferences/:userId', asyncHandler(async (req: Request, res: Response) => {
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
notificationsRouter.put('/preferences/:userId', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const updates = req.body;

  // Validate preferences
  const errors = preferenceService.validatePreferences(updates);
  if (errors.length > 0) {
    throw new ValidationError(`Validation errors: ${errors.join(', ')}`);
  }

  const preferences = await preferenceService.updatePreferences(userId, updates);

  res.json({
    success: true,
    data: preferences,
  });
}));

// Toggle notification type
notificationsRouter.put('/preferences/:userId/types/:type', asyncHandler(async (req: Request, res: Response) => {
  const { userId, type } = req.params;
  const { enabled } = req.body;

  if (typeof enabled !== 'boolean') {
    throw new ValidationError('enabled must be a boolean');
  }

  const validTypes = ['call', 'sms', 'billing', 'system', 'porting'];
  if (!validTypes.includes(type)) {
    throw new ValidationError(`Invalid notification type. Must be one of: ${validTypes.join(', ')}`);
  }

  const preferences = await preferenceService.toggleNotificationType(
    userId,
    type as any,
    enabled
  );

  res.json({
    success: true,
    data: preferences,
  });
}));

// Toggle notification channel
notificationsRouter.put('/preferences/:userId/channels/:channel', asyncHandler(async (req: Request, res: Response) => {
  const { userId, channel } = req.params;
  const { enabled } = req.body;

  if (typeof enabled !== 'boolean') {
    throw new ValidationError('enabled must be a boolean');
  }

  const validChannels = ['email', 'sms', 'push', 'webhook'];
  if (!validChannels.includes(channel)) {
    throw new ValidationError(`Invalid channel. Must be one of: ${validChannels.join(', ')}`);
  }

  const preferences = await preferenceService.toggleChannel(
    userId,
    channel as any,
    enabled
  );

  res.json({
    success: true,
    data: preferences,
  });
}));

// Update contact information
notificationsRouter.put('/preferences/:userId/contact', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { email, phoneNumber, webhookUrl } = req.body;

  const contactInfo = { email, phoneNumber, webhookUrl };
  
  // Validate contact info
  const errors = preferenceService.validatePreferences(contactInfo);
  if (errors.length > 0) {
    throw new ValidationError(`Validation errors: ${errors.join(', ')}`);
  }

  const preferences = await preferenceService.updateContactInfo(userId, contactInfo);

  res.json({
    success: true,
    data: preferences,
  });
}));

// Configure quiet hours
notificationsRouter.put('/preferences/:userId/quiet-hours', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { enabled, start, end, timezone } = req.body;

  if (typeof enabled !== 'boolean') {
    throw new ValidationError('enabled must be a boolean');
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
notificationsRouter.post('/test/:channel', asyncHandler(async (req: Request, res: Response) => {
  const { channel } = req.params;
  const { to, message } = req.body;

  if (!to) {
    throw new ValidationError('to parameter is required');
  }

  let result;
  switch (channel) {
    case 'email':
      if (!message) {
        result = await emailService.sendTestEmail(to);
      } else {
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
      throw new ValidationError('Invalid channel. Must be one of: email, sms, webhook');
  }

  res.json({
    success: result.success,
    data: result,
  });
}));