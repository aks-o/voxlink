import { VirtualNumber, NumberConfiguration } from '@prisma/client';
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
export declare class VirtualNumberRepository extends BaseRepository {
    create(data: CreateVirtualNumberData): Promise<VirtualNumber>;
    findById(id: string): Promise<VirtualNumberWithConfig | null>;
    findByPhoneNumber(phoneNumber: string): Promise<VirtualNumberWithConfig | null>;
    findByOwner(ownerId: string, limit?: number, offset?: number): Promise<VirtualNumberWithConfig[]>;
    search(filters: NumberSearchFilters, limit?: number, offset?: number): Promise<VirtualNumberWithConfig[]>;
    update(id: string, data: UpdateVirtualNumberData): Promise<VirtualNumber>;
    updateStatus(id: string, status: NumberStatus): Promise<VirtualNumber>;
    delete(id: string): Promise<void>;
    countByOwner(ownerId: string): Promise<number>;
    countByStatus(status: NumberStatus): Promise<number>;
    findAvailableNumbers(countryCode: string, areaCode?: string, limit?: number): Promise<VirtualNumber[]>;
    reserveNumber(phoneNumber: string, userId: string, expiresAt: Date): Promise<void>;
    releaseReservation(phoneNumber: string): Promise<void>;
    findExpiredReservations(): Promise<{
        phoneNumber: string;
        userId: string;
    }[]>;
}
