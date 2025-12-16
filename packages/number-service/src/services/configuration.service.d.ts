export interface CallForwardingUpdate {
    enabled: boolean;
    primaryDestination?: string;
    failoverDestination?: string;
    businessHoursDestination?: string;
    afterHoursDestination?: string;
    timeout?: number;
}
export interface VoicemailUpdate {
    enabled: boolean;
    customGreeting?: string;
    emailNotifications?: boolean;
    transcriptionEnabled?: boolean;
    maxDuration?: number;
}
export interface BusinessHoursUpdate {
    timezone: string;
    schedule: Record<string, {
        open: string;
        close: string;
        enabled: boolean;
    }>;
    holidays?: Date[];
}
export interface NotificationUpdate {
    callNotifications?: boolean;
    smsNotifications?: boolean;
    emailNotifications?: boolean;
    webhookUrl?: string;
    notificationChannels?: string[];
}
export interface ConfigurationTestResult {
    success: boolean;
    component: string;
    message: string;
    details?: any;
}
export declare class ConfigurationService {
    private configRepo;
    private numberRepo;
    constructor();
    /**
     * Update call forwarding configuration
     */
    updateCallForwarding(numberId: string, userId: string, config: CallForwardingUpdate): Promise<any>;
    /**
     * Update voicemail configuration
     */
    updateVoicemail(numberId: string, userId: string, config: VoicemailUpdate): Promise<any>;
    /**
     * Update business hours configuration
     */
    updateBusinessHours(numberId: string, userId: string, config: BusinessHoursUpdate): Promise<any>;
    /**
     * Update notification configuration
     */
    updateNotifications(numberId: string, userId: string, config: NotificationUpdate): Promise<any>;
    /**
     * Get complete configuration for a number
     */
    getConfiguration(numberId: string, userId: string): Promise<any>;
    /**
     * Test configuration components
     */
    testConfiguration(numberId: string, userId: string): Promise<ConfigurationTestResult[]>;
    /**
     * Reset configuration to defaults
     */
    resetToDefaults(numberId: string, userId: string): Promise<any>;
    /**
     * Private helper methods
     */
    private verifyNumberOwnership;
    private validateCallForwardingConfig;
    private validateVoicemailConfig;
    private validateBusinessHoursConfig;
    private validateNotificationConfig;
    private applyCallForwardingChanges;
    private applyVoicemailChanges;
    private applyBusinessHoursChanges;
    private applyDefaultConfiguration;
    private clearConfigurationCache;
    private logConfigurationChange;
    private testCallForwarding;
    private testVoicemail;
    private testBusinessHours;
    private testNotifications;
}
