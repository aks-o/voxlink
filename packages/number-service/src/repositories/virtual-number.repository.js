"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VirtualNumberRepository = void 0;
const base_repository_1 = require("./base.repository");
class VirtualNumberRepository extends base_repository_1.BaseRepository {
    async create(data) {
        return this.executeWithErrorHandling(async () => {
            return await this.db.virtualNumber.create({
                data: {
                    ...data,
                    status: 'AVAILABLE',
                },
            });
        }, 'create virtual number');
    }
    async findById(id) {
        return this.executeWithErrorHandling(async () => {
            return await this.db.virtualNumber.findUnique({
                where: { id },
                include: {
                    configuration: true,
                },
            });
        }, 'find virtual number by id');
    }
    async findByPhoneNumber(phoneNumber) {
        return this.executeWithErrorHandling(async () => {
            return await this.db.virtualNumber.findUnique({
                where: { phoneNumber },
                include: {
                    configuration: true,
                },
            });
        }, 'find virtual number by phone number');
    }
    async findByOwner(ownerId, limit = 50, offset = 0) {
        return this.executeWithErrorHandling(async () => {
            return await this.db.virtualNumber.findMany({
                where: { ownerId },
                include: {
                    configuration: true,
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            });
        }, 'find virtual numbers by owner');
    }
    async search(filters, limit = 50, offset = 0) {
        return this.executeWithErrorHandling(async () => {
            const where = {};
            if (filters.countryCode) {
                where.countryCode = filters.countryCode;
            }
            if (filters.areaCode) {
                where.areaCode = filters.areaCode;
            }
            if (filters.city) {
                where.city = { contains: filters.city, mode: 'insensitive' };
            }
            if (filters.region) {
                where.region = { contains: filters.region, mode: 'insensitive' };
            }
            if (filters.status) {
                where.status = filters.status;
            }
            if (filters.ownerId) {
                where.ownerId = filters.ownerId;
            }
            if (filters.features && filters.features.length > 0) {
                where.features = {
                    hasEvery: filters.features,
                };
            }
            return await this.db.virtualNumber.findMany({
                where,
                include: {
                    configuration: true,
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            });
        }, 'search virtual numbers');
    }
    async update(id, data) {
        return this.executeWithErrorHandling(async () => {
            return await this.db.virtualNumber.update({
                where: { id },
                data: {
                    ...data,
                    status: data.status,
                    updatedAt: new Date(),
                },
            });
        }, 'update virtual number');
    }
    async updateStatus(id, status) {
        return this.executeWithErrorHandling(async () => {
            return await this.db.virtualNumber.update({
                where: { id },
                data: {
                    status: status,
                    updatedAt: new Date(),
                },
            });
        }, 'update virtual number status');
    }
    async delete(id) {
        return this.executeWithErrorHandling(async () => {
            await this.db.virtualNumber.delete({
                where: { id },
            });
        }, 'delete virtual number');
    }
    async countByOwner(ownerId) {
        return this.executeWithErrorHandling(async () => {
            return await this.db.virtualNumber.count({
                where: { ownerId },
            });
        }, 'count virtual numbers by owner');
    }
    async countByStatus(status) {
        return this.executeWithErrorHandling(async () => {
            return await this.db.virtualNumber.count({
                where: { status: status },
            });
        }, 'count virtual numbers by status');
    }
    async findAvailableNumbers(countryCode, areaCode, limit = 10) {
        return this.executeWithErrorHandling(async () => {
            const where = {
                status: 'AVAILABLE',
                countryCode,
            };
            if (areaCode) {
                where.areaCode = areaCode;
            }
            return await this.db.virtualNumber.findMany({
                where,
                orderBy: { createdAt: 'asc' },
                take: limit,
            });
        }, 'find available numbers');
    }
    async reserveNumber(phoneNumber, userId, expiresAt) {
        return this.executeWithErrorHandling(async () => {
            await this.db.$transaction(async (tx) => {
                // Update number status to reserved
                await tx.virtualNumber.update({
                    where: { phoneNumber },
                    data: {
                        status: 'RESERVED',
                        updatedAt: new Date(),
                    },
                });
                // Create reservation record
                await tx.numberReservation.create({
                    data: {
                        phoneNumber,
                        userId,
                        expiresAt,
                    },
                });
            });
        }, 'reserve number');
    }
    async releaseReservation(phoneNumber) {
        return this.executeWithErrorHandling(async () => {
            await this.db.$transaction(async (tx) => {
                // Delete reservation
                await tx.numberReservation.deleteMany({
                    where: { phoneNumber },
                });
                // Update number status back to available
                await tx.virtualNumber.update({
                    where: { phoneNumber },
                    data: {
                        status: 'AVAILABLE',
                        updatedAt: new Date(),
                    },
                });
            });
        }, 'release reservation');
    }
    async findExpiredReservations() {
        return this.executeWithErrorHandling(async () => {
            const expiredReservations = await this.db.numberReservation.findMany({
                where: {
                    expiresAt: {
                        lt: new Date(),
                    },
                },
                select: {
                    phoneNumber: true,
                    userId: true,
                },
            });
            return expiredReservations;
        }, 'find expired reservations');
    }
}
exports.VirtualNumberRepository = VirtualNumberRepository;
