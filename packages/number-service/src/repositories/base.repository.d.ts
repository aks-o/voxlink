import { PrismaClient } from '@prisma/client';
export declare abstract class BaseRepository {
    protected get db(): PrismaClient;
    protected handleDatabaseError(error: any, operation: string): never;
    protected executeWithErrorHandling<T>(operation: () => Promise<T>, operationName: string): Promise<T>;
}
