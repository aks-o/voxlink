import { Router, Request, Response } from 'express';
import { 
  ConfigurationService,
  CallForwardingUpdate,
  VoicemailUpdate,
  BusinessHoursUpdate,
  NotificationUpdate
} from '../services/configuration.service';
import { asyncHandler, NotFoundError, ValidationError } from '../middleware/error-handler';

export const configurationRouter = Router();

const configService = new ConfigurationService();

// Get complete configuration for a number
configurationRouter.get('/:numberId', asyncHandler(async (req: Request, res: Response) => {
  const { numberId } = req.params;
  const { userId } = req.query;

  if (!userId) {
    throw new ValidationError('userId query parameter is required');
  }

  const configuration = await configService.getConfiguration(numberId, userId as string);

  res.json({
    success: true,
    data: configuration,
  });
}));

// Update call forwarding configuration
configurationRouter.put('/:numberId/call-forwarding', asyncHandler(async (req: Request, res: Response) => {
  const { numberId } = req.params;
  const { userId } = req.query;
  const config: CallForwardingUpdate = req.body;

  if (!userId) {
    throw new ValidationError('userId query parameter is required');
  }

  const updatedConfig = await configService.updateCallForwarding(numberId, userId as string, config);

  res.json({
    success: true,
    data: updatedConfig,
    message: 'Call forwarding configuration updated successfully',
  });
}));

// Update voicemail configuration
configurationRouter.put('/:numberId/voicemail', asyncHandler(async (req: Request, res: Response) => {
  const { numberId } = req.params;
  const { userId } = req.query;
  const config: VoicemailUpdate = req.body;

  if (!userId) {
    throw new ValidationError('userId query parameter is required');
  }

  const updatedConfig = await configService.updateVoicemail(numberId, userId as string, config);

  res.json({
    success: true,
    data: updatedConfig,
    message: 'Voicemail configuration updated successfully',
  });
}));

// Update business hours configuration
configurationRouter.put('/:numberId/business-hours', asyncHandler(async (req: Request, res: Response) => {
  const { numberId } = req.params;
  const { userId } = req.query;
  const config: BusinessHoursUpdate = req.body;

  if (!userId) {
    throw new ValidationError('userId query parameter is required');
  }

  const updatedConfig = await configService.updateBusinessHours(numberId, userId as string, config);

  res.json({
    success: true,
    data: updatedConfig,
    message: 'Business hours configuration updated successfully',
  });
}));

// Update notification configuration
configurationRouter.put('/:numberId/notifications', asyncHandler(async (req: Request, res: Response) => {
  const { numberId } = req.params;
  const { userId } = req.query;
  const config: NotificationUpdate = req.body;

  if (!userId) {
    throw new ValidationError('userId query parameter is required');
  }

  const updatedConfig = await configService.updateNotifications(numberId, userId as string, config);

  res.json({
    success: true,
    data: updatedConfig,
    message: 'Notification configuration updated successfully',
  });
}));

// Test configuration
configurationRouter.post('/:numberId/test', asyncHandler(async (req: Request, res: Response) => {
  const { numberId } = req.params;
  const { userId } = req.query;

  if (!userId) {
    throw new ValidationError('userId query parameter is required');
  }

  const testResults = await configService.testConfiguration(numberId, userId as string);

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
configurationRouter.post('/:numberId/reset', asyncHandler(async (req: Request, res: Response) => {
  const { numberId } = req.params;
  const { userId } = req.query;

  if (!userId) {
    throw new ValidationError('userId query parameter is required');
  }

  const defaultConfig = await configService.resetToDefaults(numberId, userId as string);

  res.json({
    success: true,
    data: defaultConfig,
    message: 'Configuration reset to defaults successfully',
  });
}));

// Get configuration templates
configurationRouter.get('/templates/:type', asyncHandler(async (req: Request, res: Response) => {
  const { type } = req.params;

  const templates: Record<string, any> = {
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
    throw new NotFoundError(`Configuration template '${type}' not found`);
  }

  res.json({
    success: true,
    data: template,
  });
}));

// List all available templates
configurationRouter.get('/templates', asyncHandler(async (req: Request, res: Response) => {
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