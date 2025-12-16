import { PrismaClient } from '@prisma/client';
declare class DatabaseServiceClass {
    private prisma;
    initialize(): Promise<void>;
    disconnect(): Promise<void>;
    getClient(): PrismaClient;
    healthCheck(): Promise<boolean>;
    runMigrations(): Promise<void>;
}
export declare const DatabaseService: DatabaseServiceClass;
export {};
