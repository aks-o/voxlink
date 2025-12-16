import express, { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

// Import service configurations
import { createNumberServiceApp } from '../../../packages/number-service/src/index';
import { createApiGatewayApp } from '../../../packages/api-gateway/src/index';
import { createBillingServiceApp } from '../../../packages/billing-service/src/index';
import { createNotificationServiceApp } from '../../../packages/notification-service/src/index';

export interface TestAppOptions {
  enableCors?: boolean;
  enableHelmet?: boolean;
  enableCompression?: boolean;
  enableWebSocket?: boolean;
  database?: PrismaClient;
}

export async function createTestApp(
  serviceName: string,
  options: TestAppOptions = {}
): Promise<Express> {
  const {
    enableCors = true,
    enableHelmet = true,
    enableCompression = true,
    enableWebSocket = false,
  } = options;

  let app: Express;

  // Create service-specific app
  switch (serviceName) {
    case 'number-service':
      app = await createNumberServiceApp();
      break;
    case 'api-gateway':
      app = await createApiGatewayApp();
      break;
    case 'billing-service':
      app = await createBillingServiceApp();
      break;
    case 'notification-service':
      app = await createNotificationServiceApp();
      break;
    default:
      // Create generic Express app for testing
      app = express();
      break;
  }

  // Apply middleware
  if (enableHelmet) {
    app.use(helmet({
      contentSecurityPolicy: false, // Disable for testing
    }));
  }

  if (enableCors) {
    app.use(cors({
      origin: true,
      credentials: true,
    }));
  }

  if (enableCompression) {
    app.use(compression());
  }

  // Parse JSON bodies
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Add WebSocket support if needed
  if (enableWebSocket) {
    const server = createServer(app);
    const io = new Server(server, {
      cors: {
        origin: true,
        credentials: true,
      },
    });

    // Store io instance for testing
    (app as any).io = io;
  }

  // Add test-specific middleware
  app.use('/test/health', (req, res) => {
    res.json({ status: 'ok', service: serviceName, timestamp: new Date() });
  });

  // Error handling middleware
  app.use((error: any, req: any, res: any, next: any) => {
    console.error('Test app error:', error);
    res.status(error.status || 500).json({
      error: error.message || 'Internal server error',
      stack: process.env.NODE_ENV === 'test' ? error.stack : undefined,
    });
  });

  return app;
}

export async function createTestDatabase(): Promise<PrismaClient> {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/voxlink_test',
      },
    },
    log: process.env.VERBOSE_TESTS ? ['query', 'info', 'warn', 'error'] : ['error'],
  });

  await prisma.$connect();
  return prisma;
}

export async function cleanupTestDatabase(prisma: PrismaClient): Promise<void> {
  // Clean up in reverse dependency order
  const tables = [
    'usage_records',
    'number_configurations',
    'porting_requests',
    'virtual_numbers',
    'invoices',
    'invoice_items',
    'notifications',
    'users',
  ];

  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`);
    } catch (error) {
      console.warn(`Failed to truncate table ${table}:`, error);
    }
  }
}

export function createAuthToken(user: any): string {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
}

export function createTestUser(overrides: any = {}) {
  return {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    permissions: ['read', 'write'],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createAdminUser(overrides: any = {}) {
  return createTestUser({
    id: '2',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    permissions: ['read', 'write', 'admin'],
    ...overrides,
  });
}

// Mock external services
export function mockExternalServices() {
  // Mock Twilio
  jest.mock('twilio', () => ({
    __esModule: true,
    default: jest.fn(() => ({
      availablePhoneNumbers: {
        v1: {
          us: {
            local: {
              list: jest.fn().mockResolvedValue([
                {
                  phoneNumber: '+1234567890',
                  locality: 'New York',
                  region: 'NY',
                  capabilities: { voice: true, sms: true, mms: true },
                },
              ]),
            },
          },
        },
      },
      incomingPhoneNumbers: {
        create: jest.fn().mockResolvedValue({
          sid: 'PN123456789',
          phoneNumber: '+1234567890',
          status: 'in-use',
        }),
      },
    })),
  }));

  // Mock Bandwidth
  jest.mock('@bandwidth/numbers', () => ({
    Client: jest.fn(() => ({
      availableNumbers: {
        list: jest.fn().mockResolvedValue({
          telephoneNumbers: [
            {
              fullNumber: '+1234567891',
              city: 'Los Angeles',
              state: 'CA',
              features: ['sms', 'mms'],
            },
          ],
        }),
      },
      phoneNumbers: {
        create: jest.fn().mockResolvedValue({
          number: '+1234567891',
          status: 'COMPLETE',
        }),
      },
    })),
  }));

  // Mock Stripe
  jest.mock('stripe', () => ({
    __esModule: true,
    default: jest.fn(() => ({
      customers: {
        create: jest.fn().mockResolvedValue({
          id: 'cus_test123',
          email: 'test@example.com',
        }),
      },
      invoices: {
        create: jest.fn().mockResolvedValue({
          id: 'in_test123',
          status: 'draft',
          amount_due: 500,
        }),
        pay: jest.fn().mockResolvedValue({
          id: 'in_test123',
          status: 'paid',
        }),
      },
      paymentIntents: {
        create: jest.fn().mockResolvedValue({
          id: 'pi_test123',
          status: 'succeeded',
          client_secret: 'pi_test123_secret',
        }),
      },
    })),
  }));

  // Mock SendGrid
  jest.mock('@sendgrid/mail', () => ({
    setApiKey: jest.fn(),
    send: jest.fn().mockResolvedValue([
      {
        statusCode: 202,
        body: '',
        headers: {},
      },
    ]),
  }));
}

// Performance testing utilities
export async function measureApiPerformance(
  app: Express,
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any,
  iterations: number = 100
) {
  const request = require('supertest');
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = process.hrtime.bigint();
    
    let req = request(app)[method.toLowerCase()](endpoint);
    
    if (data) {
      req = req.send(data);
    }
    
    await req;
    
    const end = process.hrtime.bigint();
    times.push(Number(end - start) / 1000000); // Convert to milliseconds
  }

  return {
    min: Math.min(...times),
    max: Math.max(...times),
    avg: times.reduce((sum, time) => sum + time, 0) / times.length,
    median: times.sort((a, b) => a - b)[Math.floor(times.length / 2)],
    p95: times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)],
    p99: times.sort((a, b) => a - b)[Math.floor(times.length * 0.99)],
    times,
  };
}

export function createLoadTestScenario(
  app: Express,
  scenarios: Array<{
    endpoint: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    data?: any;
    weight: number; // Percentage of requests
  }>,
  options: {
    duration: number; // seconds
    concurrency: number;
    rampUp?: number; // seconds
  }
) {
  return async () => {
    const request = require('supertest');
    const { duration, concurrency, rampUp = 0 } = options;
    
    const results: any[] = [];
    const startTime = Date.now();
    const endTime = startTime + (duration * 1000);
    
    // Create worker promises
    const workers = Array.from({ length: concurrency }, async (_, workerIndex) => {
      // Stagger worker start times during ramp-up
      if (rampUp > 0) {
        const delay = (rampUp * 1000 * workerIndex) / concurrency;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      const workerResults: any[] = [];
      
      while (Date.now() < endTime) {
        // Select scenario based on weight
        const random = Math.random() * 100;
        let cumulativeWeight = 0;
        let selectedScenario = scenarios[0];
        
        for (const scenario of scenarios) {
          cumulativeWeight += scenario.weight;
          if (random <= cumulativeWeight) {
            selectedScenario = scenario;
            break;
          }
        }
        
        const requestStart = process.hrtime.bigint();
        
        try {
          let req = request(app)[selectedScenario.method.toLowerCase()](selectedScenario.endpoint);
          
          if (selectedScenario.data) {
            req = req.send(selectedScenario.data);
          }
          
          const response = await req;
          const requestEnd = process.hrtime.bigint();
          
          workerResults.push({
            scenario: selectedScenario.endpoint,
            method: selectedScenario.method,
            status: response.status,
            duration: Number(requestEnd - requestStart) / 1000000,
            timestamp: Date.now(),
            worker: workerIndex,
          });
        } catch (error: any) {
          const requestEnd = process.hrtime.bigint();
          
          workerResults.push({
            scenario: selectedScenario.endpoint,
            method: selectedScenario.method,
            status: error.status || 500,
            duration: Number(requestEnd - requestStart) / 1000000,
            timestamp: Date.now(),
            worker: workerIndex,
            error: error.message,
          });
        }
      }
      
      return workerResults;
    });
    
    // Wait for all workers to complete
    const allResults = await Promise.all(workers);
    results.push(...allResults.flat());
    
    // Calculate statistics
    const successfulRequests = results.filter(r => r.status >= 200 && r.status < 400);
    const failedRequests = results.filter(r => r.status >= 400);
    const durations = results.map(r => r.duration);
    
    return {
      totalRequests: results.length,
      successfulRequests: successfulRequests.length,
      failedRequests: failedRequests.length,
      successRate: (successfulRequests.length / results.length) * 100,
      avgDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      p50Duration: durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.5)],
      p95Duration: durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.95)],
      p99Duration: durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.99)],
      requestsPerSecond: results.length / duration,
      results,
    };
  };
}