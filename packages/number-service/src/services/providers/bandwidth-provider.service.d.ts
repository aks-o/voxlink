import { NumberSearchRequest, NumberSearchResponse, NumberReservationRequest, NumberReservationResponse, NumberPurchaseRequest, NumberPurchaseResponse, PortingRequest, PortingResponse } from '@voxlink/shared/types/telecom-provider';
import { BaseTelecomProvider } from './base-provider.service';
export declare class BandwidthProvider extends BaseTelecomProvider {
    private client;
    constructor(provider: any);
    searchNumbers(request: NumberSearchRequest): Promise<NumberSearchResponse>;
    reserveNumber(request: NumberReservationRequest): Promise<NumberReservationResponse>;
    purchaseNumber(request: NumberPurchaseRequest): Promise<NumberPurchaseResponse>;
    portNumber(request: PortingRequest): Promise<PortingResponse>;
    checkNumberAvailability(phoneNumber: string): Promise<boolean>;
    releaseReservation(reservationId: string): Promise<boolean>;
    protected performHealthCheck(): Promise<boolean>;
    protected executeRequest<T>(method: string, endpoint: string, data?: any, options?: any): Promise<T>;
    private extractCountryCode;
    private calculateMonthlyRate;
    private calculateSetupFee;
    private getBandwidthFeatures;
}
