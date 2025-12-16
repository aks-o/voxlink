import { PrismaClient, NotificationPreference } from '@prisma/client';
export interface CreatePreferenceInput {
    userId: string;
    emailEnabled?: boolean;
    smsEnabled?: boolean;
    pushEnabled?: boolean;
    webhookEnabled?: boolean;
    email?: string;
    phoneNumber?: string;
    webhookUrl?: string;
    callNotifications?: boolean;
    smsNotifications?: boolean;
    billingNotifications?: boolean;
    systemNotifications?: boolean;
    portingNotifications?: boolean;
    quietHoursEnabled?: boolean;
    quietHoursStart?: string;
    quietHoursEnd?: string;
    quietHoursTimezone?: string;
}
export interface UpdatePreferenceInput extends Partial<CreatePreferenceInput> {
}
export declare class PreferenceService {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * Create notification preferences for user
     */
    createPreferences(input: CreatePreferenceInput): Promise<NotificationPreference>;
    /**
     * Get notification preferences for user
     */
    getPreferences(userId: string): Promise<NotificationPreference | null>;
    /**
     * Update notification preferences
     */
    updatePreferences(userId: string, updates: UpdatePreferenceInput): Promise<NotificationPreference>;
    /**
     * Delete notification preferences
     */
    deletePreferences(userId: string): Promise<void>;
    /**
     * Enable/disable specific notification type
     */
    toggleNotificationType(userId: string, type: 'call' | 'sms' | 'billing' | 'system' | 'porting', enabled: boolean): Promise<NotificationPreference>;
    /**
     * Enable/disable specific channel
     */
    toggleChannel(userId: string, channel: 'email' | 'sms' | 'push' | 'webhook', enabled: boolean): Promise<NotificationPreference>;
    /**
     * Update contact information
     */
    updateContactInfo(userId: string, contactInfo: {
        email?: string;
        phoneNumber?: string;
        webhookUrl?: string;
    }): Promise<NotificationPreference>;
    /**
     * Configure quiet hours
     */
    configureQuietHours(userId: string, config: {
        enabled: boolean;
        start?: string;
        end?: string;
        timezone?: string;
    }): Promise<NotificationPreference>;
    /**
     * Get default preferences for new user
     */
    getDefaultPreferences(userId: string): CreatePreferenceInput;
    /**
     * Validate preference data
     */
    validatePreferences(input: CreatePreferenceInput | UpdatePreferenceInput): string[];
    /**
     * Validate email format
     */
    private isValidEmail;
    /**
     * Validate phone number format (E.164)
     */
    private isValidPhoneNumber;
    /**
     * Validate URL format
     */
    private isValidUrl;
    /**
     * Validate time format (HH:MM)
     */
    private isValidTimeFormat;
}
