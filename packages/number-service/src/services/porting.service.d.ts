import { PortingRequest, PortingStatus, DocumentType } from '@prisma/client';
import { PortingRequestRepository, CreatePortingRequestData, PortingRequestWithDetails } from '../repositories/porting-request.repository';
import { VirtualNumberRepository } from '../repositories/virtual-number.repository';
import { NumberConfigurationRepository } from '../repositories/number-configuration.repository';
export interface PortingValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}
export interface PortingEstimate {
    estimatedDays: number;
    estimatedCompletion: Date;
    factors: string[];
}
export interface CarrierInfo {
    name: string;
    portingTimeEstimate: number;
    requiredDocuments: DocumentType[];
    specialRequirements?: string[];
}
export interface PortingProgress {
    currentStep: string;
    completedSteps: string[];
    remainingSteps: string[];
    estimatedCompletion: Date;
    lastUpdate: Date;
}
export declare class PortingService {
    private portingRepo;
    private numberRepo;
    private configRepo;
    constructor(portingRepo: PortingRequestRepository, numberRepo: VirtualNumberRepository, configRepo: NumberConfigurationRepository);
    /**
     * Initiate a new porting request
     */
    initiatePorting(data: CreatePortingRequestData): Promise<PortingRequest>;
    /**
     * Validate porting request data
     */
    validatePortingRequest(data: CreatePortingRequestData): Promise<PortingValidationResult>;
    /**
     * Update porting request status
     */
    updatePortingStatus(portingRequestId: string, status: PortingStatus, message: string, updatedBy: string): Promise<PortingRequest>;
    /**
     * Handle status change actions
     */
    private handleStatusChange;
    /**
     * Handle porting approved
     */
    private handlePortingApproved;
    /**
     * Handle porting completed
     */
    private handlePortingCompleted;
    /**
     * Handle porting failed
     */
    private handlePortingFailed;
    /**
     * Handle porting cancelled
     */
    private handlePortingCancelled;
    /**
     * Get porting progress for a request
     */
    getPortingProgress(portingRequestId: string): Promise<PortingProgress>;
    /**
     * Get carrier information
     */
    private getCarrierInfo;
    /**
     * Calculate porting estimate
     */
    private calculatePortingEstimate;
    /**
     * Validate carrier-specific requirements
     */
    private validateCarrierSpecificRequirements;
    /**
     * Initiate carrier porting process (mock implementation)
     */
    private initiateCarrierPorting;
    /**
     * Get porting steps
     */
    private getPortingSteps;
    /**
     * Get current step index based on status
     */
    private getCurrentStepIndex;
    /**
     * Utility methods
     */
    private isValidPhoneNumber;
    private extractCountryCode;
    private extractAreaCode;
    private isBusinessNumber;
    private isComplexCarrier;
    /**
     * Get user's porting requests
     */
    getUserPortingRequests(userId: string, limit?: number, offset?: number): Promise<{
        requests: PortingRequestWithDetails[];
        total: number;
    }>;
    /**
     * Cancel porting request
     */
    cancelPortingRequest(portingRequestId: string, reason: string, cancelledBy: string): Promise<PortingRequest>;
}
