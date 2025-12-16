"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PortingRequestRepository = void 0;
const base_repository_1 = require("./base.repository");
class PortingRequestRepository extends base_repository_1.BaseRepository {
    /**
     * Create a new porting request
     */
    async create(data) {
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
                    status: 'SUBMITTED',
                },
            });
        }, 'create porting request');
    }
    /**
     * Find porting request by ID with details
     */
    async findByIdWithDetails(id) {
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
    async findById(id) {
        return this.executeWithErrorHandling(async () => {
            return await this.db.portingRequest.findUnique({
                where: { id },
            });
        }, 'find porting request by id');
    }
    /**
     * Find porting requests by user ID
     */
    async findByUserId(userId, limit = 50, offset = 0) {
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
    async findByCurrentNumber(currentNumber) {
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
    async findByStatus(status, limit = 50, offset = 0) {
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
    async update(id, data) {
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
    async updateStatus(id, status, message, updatedBy) {
        return this.executeWithErrorHandling(async () => {
            return await this.db.$transaction(async (tx) => {
                // Update the porting request status
                const updatedRequest = await tx.portingRequest.update({
                    where: { id },
                    data: {
                        status,
                        updatedAt: new Date(),
                        ...(status === 'COMPLETED' && { actualCompletion: new Date() }),
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
    async addDocument(data) {
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
    async getDocuments(portingRequestId) {
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
    async deleteDocument(documentId) {
        return this.executeWithErrorHandling(async () => {
            await this.db.portingDocument.delete({
                where: { id: documentId },
            });
        }, 'delete porting document');
    }
    /**
     * Add status update
     */
    async addStatusUpdate(data) {
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
    async getStatusHistory(portingRequestId) {
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
    async countByUserId(userId) {
        return this.executeWithErrorHandling(async () => {
            return await this.db.portingRequest.count({
                where: { userId },
            });
        }, 'count porting requests by user id');
    }
    /**
     * Count porting requests by status
     */
    async countByStatus(status) {
        return this.executeWithErrorHandling(async () => {
            return await this.db.portingRequest.count({
                where: { status },
            });
        }, 'count porting requests by status');
    }
    /**
     * Get porting requests requiring attention (overdue or failed)
     */
    async getRequestsRequiringAttention() {
        return this.executeWithErrorHandling(async () => {
            const now = new Date();
            return await this.db.portingRequest.findMany({
                where: {
                    OR: [
                        {
                            status: 'PROCESSING',
                            estimatedCompletion: { lt: now },
                        },
                        {
                            status: 'FAILED',
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
    async search(query, filters, limit = 50, offset = 0) {
        return this.executeWithErrorHandling(async () => {
            const where = {
                AND: [
                    {
                        OR: [
                            { currentNumber: { contains: query, mode: 'insensitive' } },
                            { currentCarrier: { contains: query, mode: 'insensitive' } },
                            { authorizedName: { contains: query, mode: 'insensitive' } },
                            { accountNumber: { contains: query, mode: 'insensitive' } },
                        ],
                    },
                ],
            };
            if (filters?.userId) {
                where.AND.push({ userId: filters.userId });
            }
            if (filters?.status) {
                where.AND.push({ status: filters.status });
            }
            if (filters?.carrier) {
                where.AND.push({
                    currentCarrier: { contains: filters.carrier, mode: 'insensitive' }
                });
            }
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
exports.PortingRequestRepository = PortingRequestRepository;
