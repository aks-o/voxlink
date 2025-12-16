import { SearchCriteria, AvailableNumber } from '@voxlink/shared';
import { PortingRequest } from '@voxlink/shared/types/telecom-provider';
export interface NumberAvailabilityResponse {
    numbers: AvailableNumber[];
    totalCount: number;
    searchId: string;
    provider: string;
}
export declare class TelecomProviderService {
    private providerManager;
    constructor();
    /**
     * Search for available numbers from telecom providers with failover
     */
    searchAvailableNumbers(criteria: SearchCriteria): Promise<NumberAvailabilityResponse>;
    /**
     * Check if a specific number is available
     */
    checkNumberAvailability(phoneNumber: string): Promise<boolean>;
    /**
     * Reserve a number with the telecom provider
     */
    reserveNumber(phoneNumber: string, userId: string, providerId?: string): Promise<{
        success: boolean;
        reservationId?: string;
        expiresAt?: Date;
    }>;
    /**
     * Release a number reservation with the telecom provider
     */
    releaseReservation(providerId: string, reservationId: string): Promise<boolean>;
    /**
     * Purchase a reserved number
     */
    purchaseNumber(request: {
        phoneNumber: string;
        providerId: string;
        reservationId?: string;
        customerInfo: {
            name: string;
            email: string;
            address: {
                street: string;
                city: string;
                state: string;
                postalCode: string;
                country: string;
            };
            businessName?: string;
        };
    }): Promise<{
        success: boolean;
        purchaseId?: string;
        activationDate?: Date;
    }>;
    /**
     * Initiate number porting
     */
    initiatePorting(request: PortingRequest): Promise<{
        success: boolean;
        portingId?: string;
        estimatedCompletion?: Date;
    }>;
    /**
     * Get provider health and metrics
     */
    getProviderStatus(): {
        health: Record<string, {
            healthy: boolean;
            status: string;
            uptime: number;
        }>;
        metrics: Record<string, any>;
    };
    private extractCountryFromPhone;
}
