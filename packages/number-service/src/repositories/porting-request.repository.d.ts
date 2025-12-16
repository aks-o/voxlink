import { PortingRequest, PortingDocument, PortingStatusUpdate, PortingStatus, DocumentType } from '@prisma/client';
import { BaseRepository } from './base.repository';
export interface CreatePortingRequestData {
    userId: string;
    currentNumber: string;
    currentCarrier: string;
    accountNumber: string;
    pin: string;
    authorizedName: string;
    billingAddress: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
    estimatedCompletion?: Date;
    notes?: string;
}
export interface UpdatePortingRequestData {
    status?: PortingStatus;
    estimatedCompletion?: Date;
    actualCompletion?: Date;
    notes?: string;
}
export interface PortingRequestWithDetails extends PortingRequest {
    documents: PortingDocument[];
    statusHistory: PortingStatusUpdate[];
}
export interface CreateDocumentData {
    portingRequestId: string;
    type: DocumentType;
    filename: string;
    url: string;
}
export interface CreateStatusUpdateData {
    portingRequestId: string;
    status: PortingStatus;
    message: string;
    updatedBy: string;
}
export declare class PortingRequestRepository extends BaseRepository {
    /**
     * Create a new porting request
     */
    create(data: CreatePortingRequestData): Promise<PortingRequest>;
    /**
     * Find porting request by ID with details
     */
    findByIdWithDetails(id: string): Promise<PortingRequestWithDetails | null>;
    /**
     * Find porting request by ID
     */
    findById(id: string): Promise<PortingRequest | null>;
    /**
     * Find porting requests by user ID
     */
    findByUserId(userId: string, limit?: number, offset?: number): Promise<PortingRequestWithDetails[]>;
    /**
     * Find porting request by current number
     */
    findByCurrentNumber(currentNumber: string): Promise<PortingRequest | null>;
    /**
     * Find porting requests by status
     */
    findByStatus(status: PortingStatus, limit?: number, offset?: number): Promise<PortingRequestWithDetails[]>;
    /**
     * Update porting request
     */
    update(id: string, data: UpdatePortingRequestData): Promise<PortingRequest>;
    /**
     * Update porting request status
     */
    updateStatus(id: string, status: PortingStatus, message: string, updatedBy: string): Promise<PortingRequest>;
    /**
     * Add document to porting request
     */
    addDocument(data: CreateDocumentData): Promise<PortingDocument>;
    /**
     * Get documents for porting request
     */
    getDocuments(portingRequestId: string): Promise<PortingDocument[]>;
    /**
     * Delete document
     */
    deleteDocument(documentId: string): Promise<void>;
    /**
     * Add status update
     */
    addStatusUpdate(data: CreateStatusUpdateData): Promise<PortingStatusUpdate>;
    /**
     * Get status history for porting request
     */
    getStatusHistory(portingRequestId: string): Promise<PortingStatusUpdate[]>;
    /**
     * Count porting requests by user
     */
    countByUserId(userId: string): Promise<number>;
    /**
     * Count porting requests by status
     */
    countByStatus(status: PortingStatus): Promise<number>;
    /**
     * Get porting requests requiring attention (overdue or failed)
     */
    getRequestsRequiringAttention(): Promise<PortingRequestWithDetails[]>;
    /**
     * Search porting requests
     */
    search(query: string, filters?: {
        userId?: string;
        status?: PortingStatus;
        carrier?: string;
    }, limit?: number, offset?: number): Promise<PortingRequestWithDetails[]>;
}
