"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async () => {
    console.log('🚀 Setting up Integration test environment...');
    // Set integration test environment variables
    process.env.NODE_ENV = 'integration_test';
    process.env.LOG_LEVEL = 'warn';
    console.log('✅ Integration test environment configured');
};
