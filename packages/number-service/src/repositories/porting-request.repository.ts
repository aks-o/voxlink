import {
  PortingRequest,
  PortingDocument,
  PortingStatusUpdate,
  PortingStatus,
  DocumentType,
  Prisma
} from '@prisma/client';
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

export class PortingRequestRepository extends BaseRepository {
  /**
   * Create a new porting request
   */
  async create(data: CreatePortingRequestData): Promise<PortingRequest> {
    return this.executeWithErrorHandling(async () => {
      const estimatedCompletion = data.estimatedCompletion ||
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default to 7 days from now

      return await this.db.portingRequest.create({
        data: {
          userId: data.userId,
          currentNumber: data.currentNumber,
          currentCarrier: data.currentCarrier,
          accountNumber: data.accountNumber,
          pin: data.pin,
          authorizedName: data.authorizedName,
          billingAddress: data.billingAddress,
          estimatedCompletion,
          notes: data.notes,
          status: 'submitted',
        },
      });
    }, 'create porting request');
  }

  /**
   * Find porting request by ID with details
   */
  async findByIdWithDetails(id: string): Promise<PortingRequestWithDetails | null> {
    return this.executeWithErrorHandling(async () => {
      return await this.db.portingRequest.findUnique({
        where: { id },
        include: {
          documents: {
            orderBy: { uploadedAt: 'desc' },
          },
          statusHistory: {
            orderBy: { timestamp: 'desc' },
          },
        },
      });
    }, 'find porting request by id with details');
  }

  /**
   * Find porting request by ID
   */
  async findById(id: string): Promise<PortingRequest | null> {
    return this.executeWithErrorHandling(async () => {
      return await this.db.portingRequest.findUnique({
        where: { id },
      });
    }, 'find porting request by id');
  }

  /**
   * Find porting requests by user ID
   */
  async findByUserId(
    userId: string,
    limit = 50,
    offset = 0
  ): Promise<PortingRequestWithDetails[]> {
    return this.executeWithErrorHandling(async () => {
      return await this.db.portingRequest.findMany({
        where: { userId },
        include: {
          documents: {
            orderBy: { uploadedAt: 'desc' },
          },
          statusHistory: {
            orderBy: { timestamp: 'desc' },
            take: 5, // Limit status history to recent entries
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });
    }, 'find porting requests by user id');
  }

  /**
   * Find porting request by current number
   */
  async findByCurrentNumber(currentNumber: string): Promise<PortingRequest | null> {
    return this.executeWithErrorHandling(async () => {
      return await this.db.portingRequest.findFirst({
        where: { currentNumber },
        orderBy: { createdAt: 'desc' },
      });
    }, 'find porting request by current number');
  }

  /**
   * Find porting requests by status
   */
  async findByStatus(
    status: PortingStatus,
    limit = 50,
    offset = 0
  ): Promise<PortingRequestWithDetails[]> {
    return this.executeWithErrorHandling(async () => {
      return await this.db.portingRequest.findMany({
        where: { status },
        include: {
          documents: {
            orderBy: { uploadedAt: 'desc' },
          },
          statusHistory: {
            orderBy: { timestamp: 'desc' },
            take: 5,
          },
        },
        orderBy: { createdAt: 'asc' }, // Oldest first for processing
        take: limit,
        skip: offset,
      });
    }, 'find porting requests by status');
  }

  /**
   * Update porting request
   */
  async update(id: string, data: UpdatePortingRequestData): Promise<PortingRequest> {
    return this.executeWithErrorHandling(async () => {
      return await this.db.portingRequest.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });
    }, 'update porting request');
  }

  /**
   * Update porting request status
   */
  async updateStatus(
    id: string,
    status: PortingStatus,
    message: string,
    updatedBy: string
  ): Promise<PortingRequest> {
    return this.executeWithErrorHandling(async () => {
      return await this.db.$transaction(async (tx) => {
        // Update the porting request status
        const updatedRequest = await tx.portingRequest.update({
          where: { id },
          data: {
            status,
            updatedAt: new Date(),
            ...(status === 'completed' && { actualCompletion: new Date() }),
          },
        });

        // Create status history entry
        await tx.portingStatusUpdate.create({
          data: {
            portingRequestId: id,
            status,
            message,
            updatedBy,
            timestamp: new Date(),
          },
        });

        return updatedRequest;
      });
    }, 'update porting request status');
  }

  /**
   * Add document to porting request
   */
  async addDocument(data: CreateDocumentData): Promise<PortingDocument> {
    return this.executeWithErrorHandling(async () => {
      return await this.db.portingDocument.create({
        data: {
          portingRequestId: data.portingRequestId,
          type: data.type,
          filename: data.filename,
          url: data.url,
          uploadedAt: new Date(),
        },
      });
    }, 'add porting document');
  }

  /**
   * Get documents for porting request
   */
  async getDocuments(portingRequestId: string): Promise<PortingDocument[]> {
    return this.executeWithErrorHandling(async () => {
      return await this.db.portingDocument.findMany({
        where: { portingRequestId },
        orderBy: { uploadedAt: 'desc' },
      });
    }, 'get porting documents');
  }

  /**
   * Delete document
   */
  async deleteDocument(documentId: string): Promise<void> {
    return this.executeWithErrorHandling(async () => {
      await this.db.portingDocument.delete({
        where: { id: documentId },
      });
    }, 'delete porting document');
  }

  /**
   * Add status update
   */
  async addStatusUpdate(data: CreateStatusUpdateData): Promise<PortingStatusUpdate> {
    return this.executeWithErrorHandling(async () => {
      return await this.db.portingStatusUpdate.create({
        data: {
          portingRequestId: data.portingRequestId,
          status: data.status,
          message: data.message,
          updatedBy: data.updatedBy,
          timestamp: new Date(),
        },
      });
    }, 'add status update');
  }

  /**
   * Get status history for porting request
   */
  async getStatusHistory(portingRequestId: string): Promise<PortingStatusUpdate[]> {
    return this.executeWithErrorHandling(async () => {
      return await this.db.portingStatusUpdate.findMany({
        where: { portingRequestId },
        orderBy: { timestamp: 'desc' },
      });
    }, 'get status history');
  }

  /**
   * Count porting requests by user
   */
  async countByUserId(userId: string): Promise<number> {
    return this.executeWithErrorHandling(async () => {
      return await this.db.portingRequest.count({
        where: { userId },
      });
    }, 'count porting requests by user id');
  }

  /**
   * Count porting requests by status
   */
  async countByStatus(status: PortingStatus): Promise<number> {
    return this.executeWithErrorHandling(async () => {
      return await this.db.portingRequest.count({
        where: { status },
      });
    }, 'count porting requests by status');
  }

  /**
   * Get porting requests requiring attention (overdue or failed)
   */
  async getRequestsRequiringAttention(): Promise<PortingRequestWithDetails[]> {
    return this.executeWithErrorHandling(async () => {
      const now = new Date();

      return await this.db.portingRequest.findMany({
        where: {
          OR: [
            {
              status: 'processing',
              estimatedCompletion: { lt: now },
            },
            {
              status: 'failed',
            },
          ],
        },
        include: {
          documents: {
            orderBy: { uploadedAt: 'desc' },
          },
          statusHistory: {
            orderBy: { timestamp: 'desc' },
            take: 5,
          },
        },
        orderBy: { estimatedCompletion: 'asc' },
      });
    }, 'get porting requests requiring attention');
  }

  /**
   * Search porting requests
   */
  async search(
    query: string,
    filters?: {
      userId?: string;
      status?: PortingStatus;
      carrier?: string;
    },
    limit = 50,
    offset = 0
  ): Promise<PortingRequestWithDetails[]> {
    return this.executeWithErrorHandling(async () => {
      const where: Prisma.PortingRequestWhereInput = {};
      const andConditions: Prisma.PortingRequestWhereInput[] = [
        {
          OR: [
            { currentNumber: { contains: query, mode: 'insensitive' } },
            { currentCarrier: { contains: query, mode: 'insensitive' } },
            { authorizedName: { contains: query, mode: 'insensitive' } },
            { accountNumber: { contains: query, mode: 'insensitive' } },
          ],
        },
      ];

      const andArray = Array.isArray(where.AND) ? where.AND : [];

      if (filters?.userId) {
        andArray.push({ userId: filters.userId });
      }

      if (filters?.status) {
        andArray.push({ status: filters.status });
      }

      if (filters?.carrier) {
        andArray.push({
          currentCarrier: { contains: filters.carrier, mode: 'insensitive' }
        });
      }

      where.AND = andArray;

      return await this.db.portingRequest.findMany({
        where,
        include: {
          documents: {
            orderBy: { uploadedAt: 'desc' },
          },
          statusHistory: {
            orderBy: { timestamp: 'desc' },
            take: 5,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });
    }, 'search porting requests');
  }
}