interface PortingRequest {
    id: string;
    phoneNumber: string;
    carrier: string;
    status: 'submitted' | 'processing' | 'approved' | 'completed' | 'failed';
    estimatedCompletion: Date;
    updates: Array<{
        step: string;
        completedAt: Date;
        notes?: string;
    }>;
}
declare class CarrierAPIMock {
    private portingRequests;
    private numberPortability;
    approvePortingRequest(portingRequestId: string): void;
    rejectPortingRequest(portingRequestId: string, reason: string): void;
    updatePortingStatus(portingRequestId: string, status: string): void;
    private completePortingRequest;
    setNumberPortability(phoneNumber: string, portable: boolean): void;
    isNumberPortable(phoneNumber: string): boolean;
    submitPortingRequest(data: {
        phoneNumber: string;
        carrier: string;
        accountNumber: string;
        pin: string;
        authorizedName: string;
    }): PortingRequest;
    private processPortingRequest;
    getPortingStatus(portingRequestId: string): PortingRequest | null;
    simulateCarrierDelay(carrier: string): number;
    simulateCarrierFailure(carrier: string): boolean;
    reset(): void;
    getAllPortingRequests(): PortingRequest[];
    getPortingRequestsByStatus(status: string): PortingRequest[];
}
export declare const mockCarrierAPI: CarrierAPIMock;
export {};
