import { NumberSearchRequest, NumberSearchResponse, NumberReservationRequest, NumberReservationResponse, NumberPurchaseRequest, NumberPurchaseResponse, PortingRequest, PortingResponse } from '@voxlink/shared/types/telecom-provider';
import { BaseTelecomProvider } from './base-provider.service';
/**
 * Airtel Business Provider for India and other markets
 * Supports virtual numbers, SMS, and voice services in India
 */
export declare class AirtelProvider extends BaseTelecomProvider {
    private client;
    constructor(provider: any);
    searchNumbers(request: NumberSearchRequest): Promise<NumberSearchResponse>;
    private getMockNumbers;
    private getIndianState;
    private getAirtelCircle;
    reserveNumber(request: NumberReservationRequest): Promise<NumberReservationResponse>;
    purchaseNumber(request: NumberPurchaseRequest): Promise<NumberPurchaseResponse>;
    portNumber(request: PortingRequest): Promise<PortingResponse>;
    checkHealth(): Promise<boolean>;
}
