import { config as dotenvConfig } from 'dotenv';

// Load environment variables
dotenvConfig();

export const config = {
  env: process.env.NODE_ENV || 'development',

  server: {
    port: parseInt(process.env.NUMBER_SERVICE_PORT || '3001', 10),
  },

  database: {
    url: process.env.DATABASE_URL || 'postgresql://voxlink:voxlink_dev_password@localhost:5432/voxlink_dev',
    testUrl: process.env.TEST_DATABASE_URL || 'postgresql://voxlink:voxlink_test_password@localhost:5433/voxlink_test',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    keyPrefix: 'voxlink:numbers:',
    defaultTtl: 3600, // 1 hour
  },

  cors: {
    allowedOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },

  providers: {
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN || '',
      apiKey: process.env.TWILIO_API_KEY || '',
      enabled: process.env.TWILIO_ENABLED === 'true',
    },
    bandwidth: {
      username: process.env.BANDWIDTH_USERNAME || '',
      password: process.env.BANDWIDTH_PASSWORD || '',
      accountId: process.env.BANDWIDTH_ACCOUNT_ID || '',
      siteId: process.env.BANDWIDTH_SITE_ID || '',
      peerId: process.env.BANDWIDTH_PEER_ID || '',
      apiKey: process.env.BANDWIDTH_API_KEY || '',
      enabled: process.env.BANDWIDTH_ENABLED === 'true',
    },
    vonage: {
      apiKey: process.env.VONAGE_API_KEY || '',
      apiSecret: process.env.VONAGE_API_SECRET || '',
      enabled: process.env.VONAGE_ENABLED === 'true',
    },
    // Exotel - TRAI/DoT Compliant India Provider
    exotel: {
      apiKey: process.env.EXOTEL_API_KEY || '',
      apiToken: process.env.EXOTEL_API_TOKEN || '',
      accountSid: process.env.EXOTEL_ACCOUNT_SID || '',
      subdomain: process.env.EXOTEL_SUBDOMAIN || 'api',
      callerId: process.env.EXOTEL_CALLER_ID || '',
      enabled: process.env.EXOTEL_ENABLED === 'true',
    },
  },

  cache: {
    searchResultsTtl: 300, // 5 minutes
    numberDetailsTtl: 1800, // 30 minutes
    availabilityTtl: 60, // 1 minute
  },

  reservations: {
    timeoutMinutes: 10,
    cleanupIntervalMinutes: 5,
  },
} as const;

// Validate required environment variables in production
if (process.env.NODE_ENV === 'production') {
  const requiredEnvVars = ['DATABASE_URL'];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Required environment variable ${envVar} is not set`);
    }
  }
}