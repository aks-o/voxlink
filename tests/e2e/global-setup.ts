import { execSync } from 'child_process';

export default async () => {
  console.log('🚀 Setting up E2E test environment...');
  
  // Build all packages
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ All packages built successfully');
  } catch (error) {
    console.error('❌ Failed to build packages:', error);
    throw error;
  }
};