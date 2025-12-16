"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async () => {
    console.log('🧹 Cleaning up E2E test environment...');
    // Clean up any global resources
    // This runs after all tests are complete
    console.log('✅ E2E test environment cleaned up');
};
