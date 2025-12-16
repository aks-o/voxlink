"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
exports.default = async () => {
    console.log('🚀 Setting up E2E test environment...');
    // Build all packages
    try {
        (0, child_process_1.execSync)('npm run build', { stdio: 'inherit' });
        console.log('✅ All packages built successfully');
    }
    catch (error) {
        console.error('❌ Failed to build packages:', error);
        throw error;
    }
};
