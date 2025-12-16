import { 
  PrismaClient, 
  Notification, 
  NotificationPreference, 
  NotificationType, 
  NotificationChannel, 
  NotificationPriority,
  NotificationStatus 
} from '@prisma/client';
import { TemplateService } from './template.service';
import { EmailService } from './delivery/email.service';
import { SMSService } from './delivery/sms.service';
import { WebhookService } from './delivery/webhook.service';
import { logger } from '../utils/logger';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  priority?: NotificationPriority;
  templateId?: string;
  subject?: string;
  content?: string;
  data?: Record<string, any>;
  scheduledAt?: Date;
  channels?: NotificationChannel[];
}

export interface NotificationWithPreference extends Notification {
  preference: NotificationPreference | null;
}

export class NotificationService {
  constructor(
    private prisma: PrismaClient,
    private templateService: TemplateService,
    private emailService: EmailService,
    private smsService: SMSService,
    private webhookService: WebhookService
  ) {}

  /**
   * Create and send notification
   */
  async createNotification(input: CreateNotificationInput): Promise<Notification[]> {
    try {
      // Get user's notification preferences
      const preference = await this.getUserPreferences(input.userId);
      
      // Determine which channels to use
      const channels = input.channels || this.getEnabledChannels(preference, input.type);
      
      if (channels.length === 0) {
        logger.info('No enabled channels for notification', {
          userId: input.userId,
          type: input.type,
        });
        return [];
      }

      // Check quiet hours
      if (this.isInQuietHours(preference)) {
        logger.info('Notification delayed due to quiet hours', {
          userId: input.userId,
          type: input.type,
        });
        // Schedule for after quiet hours
        input.scheduledAt = this.calculateNextAvailableTime(preference);
      }

      const notifications: Notification[] = [];

      // Create notification for each channel
      for (const channel of channels) {
        try {
          const notification = await this.createNotificationForChannel({
            ...input,
            channel,
            preferenceId: preference?.id,
          });
          
          notifications.push(notification);

          // Send immediately if not scheduled
          if (!input.scheduledAt) {
            await this.sendNotification(notification.id);
          }
        } catch (error) {
          logger.error('Failed to create notification for channel', {
            error: error instanceof Error ? error.message : 'Unknown error',
            userId: input.userId,
            type: input.type,
            channel,
          });
        }
      }

      return notifications;
    } catch (error) {
      logger.error('Failed to create notification', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: input.userId,
        type: input.type,
      });
      throw error;
    }
  }

  /**
   * Create notification for specific channel
   */
  private async createNotificationForChannel(
    input: CreateNotificationInput & { 
      channel: NotificationChannel; 
      preferenceId?: string;
    }
  ): Promise<Notification> {
    let subject = input.subject;
    let content = input.content;

    // Use template if provided
    if (input.templateId) {
      const rendered = await this.templateService.renderTemplate({
        templateId: input.templateId,
        variables: input.data || {},
      });
      subject = rendered.subject || subject;
      content = rendered.content;
    } else if (!content) {
      // Find default template for type and channel
      const templates = await this.templateService.getTemplatesByTypeAndChannel(
        input.type,
        input.channel
      );
      
      if (templates.length > 0) {
        const rendered = await this.templateService.renderTemplate({
          templateId: templates[0].id,
          variables: input.data || {},
        });
        subject = rendered.subject || subject;
        content = rendered.content;
      }
    }

    if (!content) {
      throw new Error(`No content provided for notification: ${input.type} - ${input.channel}`);
    }

    return this.prisma.notification.create({
      data: {
        userId: input.userId,
        preferenceId: input.preferenceId,
        type: input.type,
        channel: input.channel,
        priority: input.priority || 'NORMAL',
        subject,
        content,
        data: input.data || {},
        scheduledAt: input.scheduledAt,
        status: input.scheduledAt ? 'SCHEDULED' : 'PENDING',
      },
    });
  }

  /**
   * Send notification
   */
  async sendNotification(notificationId: string): Promise<boolean> {
    try {
      const notification = await this.prisma.notification.findUnique({
        where: { id: notificationId },
        include: { preference: true },
      });

      if (!notification) {
        throw new Error(`Notification not found: ${notificationId}`);
      }

      if (notification.status !== 'PENDING' && notification.status !== 'SCHEDULED') {
        logger.warn('Notification not in sendable state', {
          notificationId,
          status: notification.status,
        });
        return false;
      }

      // Update status to sent
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: 'SENT',
          sentAt: new Date(),
        },
      });

      // Create delivery attempt
      const attempt = await this.prisma.notificationDeliveryAttempt.create({
        data: {
          notificationId,
          channel: notification.channel,
          status: 'PENDING',
          attemptedAt: new Date(),
        },
      });

      let success = false;
      let errorMessage: string | undefined;

      // Send via appropriate channel
      switch (notification.channel) {
        case 'EMAIL':
          success = await this.sendEmailNotification(notification as NotificationWithPreference, attempt.id);
          break;
        case 'SMS':
          success = await this.sendSMSNotification(notification as NotificationWithPreference, attempt.id);
          break;
        case 'WEBHOOK':
          success = await this.sendWebhookNotification(notification as NotificationWithPreference, attempt.id);
          break;
        case 'PUSH':
          // TODO: Implement push notification
          logger.warn('Push notifications not yet implemented');
          break;
        default:
          errorMessage = `Unsupported channel: ${notification.channel}`;
      }

      // Update delivery attempt
      await this.prisma.notificationDeliveryAttempt.update({
        where: { id: attempt.id },
        data: {
          status: success ? 'DELIVERED' : 'FAILED',
          completedAt: new Date(),
          errorMessage,
        },
      });

      // Update notification status
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: success ? 'DELIVERED' : 'FAILED',
          deliveredAt: success ? new Date() : undefined,
          failedAt: success ? undefined : new Date(),
          errorMessage,
        },
      });

      return success;
    } catch (error) {
      logger.error('Failed to send notification', {
        error: error instanceof Error ? error.message : 'Unknown error',
        notificationId,
      });

      // Update notification as failed
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: 'FAILED',
          failedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      return false;
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    notification: NotificationWithPreference,
    attemptId: string
  ): Promise<boolean> {
    const email = notification.preference?.email;
    if (!email) {
      logger.warn('No email address for user', { userId: notification.userId });
      return false;
    }

    const result = await this.emailService.sendEmail({
      to: email,
      subject: notification.subject || 'VoxLink Notification',
      content: notification.content,
    });

    if (result.messageId) {
      await this.prisma.notificationDeliveryAttempt.update({
        where: { id: attemptId },
        data: { providerRef: result.messageId },
      });
    }

    return result.success;
  }

  /**
   * Send SMS notification
   */
  private async sendSMSNotification(
    notification: NotificationWithPreference,
    attemptId: string
  ): Promise<boolean> {
    const phoneNumber = notification.preference?.phoneNumber;
    if (!phoneNumber) {
      logger.warn('No phone number for user', { userId: notification.userId });
      return false;
    }

    const result = await this.smsService.sendSMS({
      to: phoneNumber,
      content: notification.content,
    });

    if (result.messageId) {
      await this.prisma.notificationDeliveryAttempt.update({
        where: { id: attemptId },
        data: { providerRef: result.messageId },
      });
    }

    return result.success;
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(
    notification: NotificationWithPreference,
    attemptId: string
  ): Promise<boolean> {
    const webhookUrl = notification.preference?.webhookUrl;
    if (!webhookUrl) {
      logger.warn('No webhook URL for user', { userId: notification.userId });
      return false;
    }

    const payload = {
      id: notification.id,
      type: notification.type,
      userId: notification.userId,
      timestamp: new Date().toISOString(),
      data: notification.data,
      content: notification.content,
      subject: notification.subject,
    };

    const result = await this.webhookService.sendWebhookWithRetry({
      url: webhookUrl,
      payload,
      retries: notification.maxRetries,
    });

    if (result.statusCode) {
      await this.prisma.notificationDeliveryAttempt.update({
        where: { id: attemptId },
        data: { 
          responseCode: result.statusCode.toString(),
          responseBody: result.responseBody,
        },
      });
    }

    return result.success;
  }

  /**
   * Get user notification preferences
   */
  async getUserPreferences(userId: string): Promise<NotificationPreference | null> {
    return this.prisma.notificationPreference.findUnique({
      where: { userId },
    });
  }

  /**
   * Get enabled channels for user and notification type
   */
  private getEnabledChannels(
    preference: NotificationPreference | null,
    type: NotificationType
  ): NotificationChannel[] {
    if (!preference) {
      return ['EMAIL']; // Default to email if no preferences
    }

    const channels: NotificationChannel[] = [];

    // Check if notification type is enabled
    const typeEnabled = this.isNotificationTypeEnabled(preference, type);
    if (!typeEnabled) {
      return [];
    }

    // Add enabled channels
    if (preference.emailEnabled && preference.email) {
      channels.push('EMAIL');
    }
    if (preference.smsEnabled && preference.phoneNumber) {
      channels.push('SMS');
    }
    if (preference.webhookEnabled && preference.webhookUrl) {
      channels.push('WEBHOOK');
    }
    if (preference.pushEnabled) {
      channels.push('PUSH');
    }

    return channels;
  }

  /**
   * Check if notification type is enabled for user
   */
  private isNotificationTypeEnabled(
    preference: NotificationPreference,
    type: NotificationType
  ): boolean {
    switch (type) {
      case 'CALL_RECEIVED':
      case 'CALL_MISSED':
        return preference.callNotifications;
      case 'SMS_RECEIVED':
        return preference.smsNotifications;
      case 'BILLING_INVOICE':
      case 'BILLING_PAYMENT_FAILED':
      case 'BILLING_PAYMENT_SUCCESS':
        return preference.billingNotifications;
      case 'SYSTEM_MAINTENANCE':
      case 'SYSTEM_OUTAGE':
      case 'ACCOUNT_SUSPENDED':
        return preference.systemNotifications;
      case 'PORTING_STARTED':
      case 'PORTING_COMPLETED':
      case 'PORTING_FAILED':
        return preference.portingNotifications;
      default:
        return true; // Enable by default for unknown types
    }
  }

  /**
   * Check if current time is in user's quiet hours
   */
  private isInQuietHours(preference: NotificationPreference | null): boolean {
    if (!preference || !preference.quietHoursEnabled) {
      return false;
    }

    if (!preference.quietHoursStart || !preference.quietHoursEnd) {
      return false;
    }

    // TODO: Implement proper timezone-aware quiet hours check
    // For now, return false
    return false;
  }

  /**
   * Calculate next available time after quiet hours
   */
  private calculateNextAvailableTime(preference: NotificationPreference | null): Date {
    // TODO: Implement proper quiet hours calculation
    // For now, schedule for 1 hour from now
    return new Date(Date.now() + 60 * 60 * 1000);
  }

  /**
   * Get notifications for user
   */
  async getUserNotifications(
    userId: string,
    limit = 50,
    offset = 0
  ): Promise<{ notifications: Notification[]; total: number }> {
    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.notification.count({
        where: { userId },
      }),
    ]);

    return { notifications, total };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { 
        // Add read status to schema if needed
        updatedAt: new Date(),
      },
    });
  }
}