import { PrismaClient } from '@prisma/client';
export declare class DatabaseService {
    private static client;
    static initialize(): Promise<void>;
    static getClient(): PrismaClient;
    static disconnect(): Promise<void>;
    static healthCheck(): Promise<boolean>;
}
