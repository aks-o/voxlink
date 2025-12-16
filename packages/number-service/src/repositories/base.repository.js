"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepository = void 0;
const database_service_1 = require("../services/database.service");
class BaseRepository {
    get db() {
        return database_service_1.DatabaseService.getClient();
    }
    handleDatabaseError(error, operation) {
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
    async executeWithErrorHandling(operation, operationName) {
        try {
            return await operation();
        }
        catch (error) {
            this.handleDatabaseError(error, operationName);
        }
    }
}
exports.BaseRepository = BaseRepository;
