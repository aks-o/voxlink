import { PrismaClient } from '@prisma/client';
import { DatabaseService } from '../services/database.service';

export abstract class BaseRepository {
  protected get db(): PrismaClient {
    return DatabaseService.getClient();
  }

  protected handleDatabaseError(error: any, operation: string): never {
    // Log the error with context
    console.error(`Database error in ${operation}:`, error);
    
    // Transform Prisma errors to application errors
    if (error.code === 'P2002') {
      throw new Error(`Unique constraint violation in ${operation}`);
    }
    
    if (error.code === 'P2025') {
      throw new Error(`Record not found in ${operation}`);
    }
    
    if (error.code === 'P2003') {
      throw new Error(`Foreign key constraint violation in ${operation}`);
    }
    
    // Generic database error
    throw new Error(`Database operation failed: ${operation}`);
  }

  protected async executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      this.handleDatabaseError(error, operationName);
    }
  }
}