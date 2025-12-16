import { TelecomProvider, NumberSearchRequest, NumberSearchResponse, NumberReservationRequest, NumberReservationResponse, NumberPurchaseRequest, NumberPurchaseResponse, PortingRequest, PortingResponse, ProviderMetrics } from '@voxlink/shared/types/telecom-provider';
export declare abstract class BaseTelecomProvider {
    protected provider: TelecomProvider;
    protected metrics: ProviderMetrics;
    constructor(provider: TelecomProvider);
    abstract searchNumbers(request: NumberSearchRequest): Promise<NumberSearchResponse>;
    abstract reserveNumber(request: NumberReservationRequest): Promise<NumberReservationResponse>;
    abstract purchaseNumber(request: NumberPurchaseRequest): Promise<NumberPurchaseResponse>;
    abstract portNumber(request: PortingRequest): Promise<PortingResponse>;
    abstract checkNumberAvailability(phoneNumber: string): Promise<boolean>;
    abstract releaseReservation(reservationId: string): Promise<boolean>;
    healthCheck(): Promise<boolean>;
    protected abstract performHealthCheck(): Promise<boolean>;
    protected makeRequest<T>(method: 'GET' | 'POST' | 'PUT' | 'DELETE', endpoint: string, data?: any, options?: {
        timeout?: number;
        retries?: number;
        headers?: Record<string, string>;
    }): Promise<T>;
    protected abstract executeRequest<T>(method: string, endpoint: string, data?: any, options?: any): Promise<T>;
    protected formatPhoneNumber(phoneNumber: string, format: 'e164' | 'national' | 'international'): string;
    protected validateRequest(request: any, requiredFields: string[]): void;
    protected extractErrorCode(error: any): string;
    protected extractErrorMessage(error: any): string;
    protected extractErrorDetails(error: any): Record<string, any>;
    protected isRetryableError(error: any): boolean;
    protected updateMetrics(success: boolean, responseTime: number): void;
    protected updateHealthMetrics(healthy: boolean, responseTime: number): void;
    getMetrics(): ProviderMetrics;
    getProvider(): TelecomProvider;
    isHealthy(): boolean;
    supportsFeature(feature: string, region?: string): boolean;
    supportsRegion(region: string): boolean;
}
