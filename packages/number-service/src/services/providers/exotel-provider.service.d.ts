import { NumberSearchRequest, NumberSearchResponse, NumberReservationRequest, NumberReservationResponse, NumberPurchaseRequest, NumberPurchaseResponse, PortingRequest, PortingResponse } from '@voxlink/shared/types/telecom-provider';
import { BaseTelecomProvider } from './base-provider.service';
/**
 * Exotel Provider Service
 *
 * TRAI/DoT Compliant provider for India (+91) virtual numbers
 * - UL-VNO Licensed
 * - DLT Registration for SMS
 * - Pan-India coverage
 *
 * API Documentation: https://developer.exotel.com/api/
 */
export declare class ExotelProvider extends BaseTelecomProvider {
    private client;
    private subdomain;
    private callerId;
    constructor(provider: any);
    /**
     * Search available virtual numbers in India
     * Exotel primarily assigns numbers, so this returns pre-configured numbers
     */
    searchNumbers(request: NumberSearchRequest): Promise<NumberSearchResponse>;
    /**
     * Reserve a number temporarily
     */
    reserveNumber(request: NumberReservationRequest): Promise<NumberReservationResponse>;
    /**
     * Purchase/Activate a virtual number
     * Note: In Exotel, numbers are typically provisioned through their dashboard
     */
    purchaseNumber(request: NumberPurchaseRequest): Promise<NumberPurchaseResponse>;
    /**
     * Port a number to Exotel
     */
    portNumber(request: PortingRequest): Promise<PortingResponse>;
    /**
     * Check if a number is available
     */
    checkNumberAvailability(phoneNumber: string): Promise<boolean>;
    /**
     * Release a reservation
     */
    releaseReservation(reservationId: string): Promise<boolean>;
    /**
     * Make an outbound call via Exotel
     */
    makeCall(from: string, to: string, callerId?: string): Promise<any>;
    /**
     * Send SMS via Exotel (DLT Compliant)
     */
    sendSms(from: string, to: string, body: string, templateId?: string): Promise<any>;
    /**
     * Get call details
     */
    getCallDetails(callSid: string): Promise<any>;
    /**
     * Get call recordings
     */
    getCallRecording(callSid: string): Promise<string | null>;
    /**
     * Health check for Exotel API
     */
    protected performHealthCheck(): Promise<boolean>;
    protected executeRequest<T>(method: string, endpoint: string, data?: any, options?: any): Promise<T>;
    private extractIndianCircle;
    private getCircleName;
    private calculateMonthlyRate;
    private calculateSetupFee;
    private mapExotelFeatures;
    private getSampleAvailableNumbers;
}
