import { VirtualNumber, NumberConfiguration, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { NumberStatus } from '@voxlink/shared';

export interface VirtualNumberWithConfig extends VirtualNumber {
  configuration: NumberConfiguration | null;
}

export interface CreateVirtualNumberData {
  phoneNumber: string;
  countryCode: string;
  areaCode: string;
  city: string;
  region: string;
  ownerId?: string;
  monthlyRate: number;
  setupFee: number;
  features: string[];
}

export interface UpdateVirtualNumberData {
  status?: NumberStatus;
  ownerId?: string;
  activationDate?: Date;
  features?: string[];
}

export interface NumberSearchFilters {
  countryCode?: string;
  areaCode?: string;
  city?: string;
  region?: string;
  status?: NumberStatus;
  ownerId?: string;
  features?: string[];
}

export class VirtualNumberRepository extends BaseRepository {
  async create(data: CreateVirtualNumberData): Promise<VirtualNumber> {
    return this.executeWithErrorHandling(async () => {
      return await this.db.virtualNumber.create({
        data: {
          ...data,
          status: 'available',
        },
      });
    }, 'create virtual number');
  }

  async findById(id: string): Promise<VirtualNumberWithConfig | null> {
    return this.executeWithErrorHandling(async () => {
      return await this.db.virtualNumber.findUnique({
        where: { id },
        include: {
          configuration: true,
        },
      });
    }, 'find virtual number by id');
  }

  async findByPhoneNumber(phoneNumber: string): Promise<VirtualNumberWithConfig | null> {
    return this.executeWithErrorHandling(async () => {
      return await this.db.virtualNumber.findUnique({
        where: { phoneNumber },
        include: {
          configuration: true,
        },
      });
    }, 'find virtual number by phone number');
  }

  async findByOwner(ownerId: string, limit = 50, offset = 0): Promise<VirtualNumberWithConfig[]> {
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

  async search(filters: NumberSearchFilters, limit = 50, offset = 0): Promise<VirtualNumberWithConfig[]> {
    return this.executeWithErrorHandling(async () => {
      const where: Prisma.VirtualNumberWhereInput = {};

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
        where.status = filters.status as any;
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

  async update(id: string, data: UpdateVirtualNumberData): Promise<VirtualNumber> {
    return this.executeWithErrorHandling(async () => {
      return await this.db.virtualNumber.update({
        where: { id },
        data: {
          ...data,
          status: data.status as any,
          updatedAt: new Date(),
        },
      });
    }, 'update virtual number');
  }

  async updateStatus(id: string, status: NumberStatus): Promise<VirtualNumber> {
    return this.executeWithErrorHandling(async () => {
      return await this.db.virtualNumber.update({
        where: { id },
        data: {
          status: status as any,
          updatedAt: new Date(),
        },
      });
    }, 'update virtual number status');
  }

  async delete(id: string): Promise<void> {
    return this.executeWithErrorHandling(async () => {
      await this.db.virtualNumber.delete({
        where: { id },
      });
    }, 'delete virtual number');
  }

  async countByOwner(ownerId: string): Promise<number> {
    return this.executeWithErrorHandling(async () => {
      return await this.db.virtualNumber.count({
        where: { ownerId },
      });
    }, 'count virtual numbers by owner');
  }

  async countByStatus(status: NumberStatus): Promise<number> {
    return this.executeWithErrorHandling(async () => {
      return await this.db.virtualNumber.count({
        where: { status: status as any },
      });
    }, 'count virtual numbers by status');
  }

  async findAvailableNumbers(
    countryCode: string,
    areaCode?: string,
    limit = 10
  ): Promise<VirtualNumber[]> {
    return this.executeWithErrorHandling(async () => {
      const where: Prisma.VirtualNumberWhereInput = {
        status: 'available',
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

  async reserveNumber(phoneNumber: string, userId: string, expiresAt: Date): Promise<void> {
    return this.executeWithErrorHandling(async () => {
      await this.db.$transaction(async (tx) => {
        // Update number status to reserved
        await tx.virtualNumber.update({
          where: { phoneNumber },
          data: {
            status: 'reserved',
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

  async releaseReservation(phoneNumber: string): Promise<void> {
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
            status: 'available',
            updatedAt: new Date(),
          },
        });
      });
    }, 'release reservation');
  }

  async findExpiredReservations(): Promise<{ phoneNumber: string; userId: string }[]> {
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
