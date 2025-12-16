import { NumberStatus } from '@prisma/client';
export interface ActivationRequest {
    phoneNumber: string;
    userId: string;
    paymentInfo?: {
        paymentMethodId: string;
        billingAddress: any;
    };
    initialConfiguration?: {
        callForwarding?: {
            enabled: boolean;
            primaryDestination?: string;
            timeout?: number;
        };
        voicemail?: {
            enabled: boolean;
            customGreeting?: string;
        };
        businessHours?: {
            timezone: string;
            schedule: any;
        };
    };
}
export interface ActivationResult {
    success: boolean;
    phoneNumber: string;
    activationId: string;
    status: NumberStatus;
    configuration?: any;
    error?: string;
}
export declare class NumberActivationService {
    private virtualNumberRepo;
    private configRepo;
    private telecomProvider;
    constructor();
    /**
     * Activate a purchased number with default configuration
     */
    activateNumber(request: ActivationRequest): Promise<ActivationResult>;
    /**
     * Deactivate a number
     */
    deactivateNumber(phoneNumber: string, userId: string): Promise<ActivationResult>;
    /**
     * Get activation status
     */
    getActivationStatus(phoneNumber: string): Promise<{
        status: NumberStatus;
        activatedAt?: Date;
        configuration?: any;
    }>;
    /**
     * Bulk activate numbers
     */
    bulkActivateNumbers(requests: ActivationRequest[]): Promise<ActivationResult[]>;
    /**
     * Private helper methods
     */
    private activateWithProvider;
    private deactivateWithProvider;
    private createDefaultConfiguration;
    private updateConfiguration;
    private setupCallRouting;
    private cacheActivationStatus;
    private clearActivationCache;
    private sendActivationNotification;
    private sendDeactivationNotification;
    private getDefaultSchedule;
}
