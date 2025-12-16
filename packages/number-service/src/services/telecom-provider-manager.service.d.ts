import { NumberSearchRequest, NumberSearchResponse, NumberReservationRequest, NumberReservationResponse, NumberPurchaseRequest, NumberPurchaseResponse, PortingRequest, PortingResponse, ProviderMetrics } from '@voxlink/shared/types/telecom-provider';
export interface ProviderFailoverConfig {
    maxRetries: number;
    retryDelay: number;
    healthCheckInterval: number;
    failoverThreshold: number;
    circuitBreakerTimeout: number;
}
export declare class TelecomProviderManager {
    private providers;
    private providerConfigs;
    private cacheService;
    private failoverConfig;
    private circuitBreakers;
    constructor();
    private initializeProviders;
    private loadProviderConfigurations;
    searchNumbers(request: NumberSearchRequest): Promise<NumberSearchResponse>;
    reserveNumber(request: NumberReservationRequest): Promise<NumberReservationResponse>;
    purchaseNumber(request: NumberPurchaseRequest): Promise<NumberPurchaseResponse>;
    portNumber(request: PortingRequest): Promise<PortingResponse>;
    checkNumberAvailability(phoneNumber: string): Promise<{
        available: boolean;
        provider?: string;
    }>;
    releaseReservation(providerId: string, reservationId: string): Promise<boolean>;
    getProviderMetrics(): Record<string, ProviderMetrics>;
    getProviderHealth(): Record<string, {
        healthy: boolean;
        status: string;
        uptime: number;
    }>;
    private getAvailableProviders;
    private getProviderById;
    private executeWithCircuitBreaker;
    private recordProviderFailure;
    private startHealthChecks;
    private extractCountryFromPhone;
}
