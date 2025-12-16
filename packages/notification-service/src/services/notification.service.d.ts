import { PrismaClient, Notification, NotificationPreference, NotificationType, NotificationChannel, NotificationPriority } from '@prisma/client';
import { TemplateService } from './template.service';
import { EmailService } from './delivery/email.service';
import { SMSService } from './delivery/sms.service';
import { WebhookService } from './delivery/webhook.service';
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
export declare class NotificationService {
    private prisma;
    private templateService;
    private emailService;
    private smsService;
    private webhookService;
    constructor(prisma: PrismaClient, templateService: TemplateService, emailService: EmailService, smsService: SMSService, webhookService: WebhookService);
    /**
     * Create and send notification
     */
    createNotification(input: CreateNotificationInput): Promise<Notification[]>;
    /**
     * Create notification for specific channel
     */
    private createNotificationForChannel;
    /**
     * Send notification
     */
    sendNotification(notificationId: string): Promise<boolean>;
    /**
     * Send email notification
     */
    private sendEmailNotification;
    /**
     * Send SMS notification
     */
    private sendSMSNotification;
    /**
     * Send webhook notification
     */
    private sendWebhookNotification;
    /**
     * Get user notification preferences
     */
    getUserPreferences(userId: string): Promise<NotificationPreference | null>;
    /**
     * Get enabled channels for user and notification type
     */
    private getEnabledChannels;
    /**
     * Check if notification type is enabled for user
     */
    private isNotificationTypeEnabled;
    /**
     * Check if current time is in user's quiet hours
     */
    private isInQuietHours;
    /**
     * Calculate next available time after quiet hours
     */
    private calculateNextAvailableTime;
    /**
     * Get notifications for user
     */
    getUserNotifications(userId: string, limit?: number, offset?: number): Promise<{
        notifications: Notification[];
        total: number;
    }>;
    /**
     * Mark notification as read
     */
    markAsRead(notificationId: string): Promise<void>;
}
