import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

export interface TestUser {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  accountId: string;
}

export const createTestUser = async (overrides: Partial<TestUser> = {}): Promise<TestUser> => {
  const userId = uuidv4();
  
  const user: TestUser = {
    id: userId,
    email: `test-${userId}@example.com`,
    name: `Test User ${userId.slice(0, 8)}`,
    role: 'user',
    accountId: userId,
    ...overrides,
  };

  // In a real implementation, this would create the user in the database
  // For tests, we'll just return the user object
  return user;
};

export const generateAuthToken = (user: TestUser): string => {
  const secret = process.env.JWT_SECRET || 'test-jwt-secret';
  
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      accountId: user.accountId,
    },
    secret,
    {
      expiresIn: '1h',
      issuer: 'voxlink-test',
    }
  );
};

export const createAdminUser = async (): Promise<TestUser> => {
  return createTestUser({ role: 'admin' });
};

export const createExpiredToken = (user: TestUser): string => {
  const secret = process.env.JWT_SECRET || 'test-jwt-secret';
  
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      accountId: user.accountId,
    },
    secret,
    {
      expiresIn: '-1h', // Expired 1 hour ago
      issuer: 'voxlink-test',
    }
  );
};

export const createInvalidToken = (): string => {
  return 'invalid.jwt.token';
};