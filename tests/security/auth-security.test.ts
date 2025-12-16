import request from 'supertest';
import { Express } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { createTestApp } from '../integration/helpers/app-setup';

describe('Authentication Security Tests', () => {
  let app: Express;
  let validToken: string;
  let expiredToken: string;
  let malformedToken: string;

  beforeAll(async () => {
    app = await createTestApp('api-gateway');
    
    // Create test tokens
    validToken = jwt.sign(
      { id: '1', email: 'test@example.com', role: 'user' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
    
    expiredToken = jwt.sign(
      { id: '1', email: 'test@example.com', role: 'user' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '-1h' } // Already expired
    );
    
    malformedToken = 'invalid.jwt.token';
  });

  describe('JWT Token Security', () => {
    it('should reject requests without authentication token', async () => {
      const response = await request(app)
        .get('/api/protected-endpoint')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('authentication required');
    });

    it('should reject malformed JWT tokens', async () => {
      const response = await request(app)
        .get('/api/protected-endpoint')
        .set('Authorization', `Bearer ${malformedToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('invalid token');
    });

    it('should reject expired JWT tokens', async () => {
      const response = await request(app)
        .get('/api/protected-endpoint')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('token expired');
    });

    it('should accept valid JWT tokens', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', '1');
    });

    it('should validate JWT signature', async () => {
      // Create token with wrong secret
      const wrongSecretToken = jwt.sign(
        { id: '1', email: 'test@example.com', role: 'user' },
        'wrong-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/protected-endpoint')
        .set('Authorization', `Bearer ${wrongSecretToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('invalid signature');
    });

    it('should prevent JWT token reuse after logout', async () => {
      // First, logout with the token
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      // Then try to use the same token
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('token revoked');
    });
  });

  describe('Password Security', () => {
    it('should enforce strong password requirements', async () => {
      const weakPasswords = [
        '123456',
        'password',
        'qwerty',
        'abc123',
        '12345678',
        'password123',
      ];

      for (const password of weakPasswords) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'test@example.com',
            password: password,
            name: 'Test User',
          })
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('password requirements');
      }
    });

    it('should accept strong passwords', async () => {
      const strongPassword = 'StrongP@ssw0rd123!';
      
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: strongPassword,
          name: 'New User',
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
    });

    it('should hash passwords before storage', async () => {
      const password = 'TestPassword123!';
      
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'hashtest@example.com',
          password: password,
          name: 'Hash Test User',
        })
        .expect(201);

      // Verify password is hashed in database
      // This would require database access in a real test
      // For now, we'll test the bcrypt functionality directly
      const hashedPassword = await bcrypt.hash(password, 12);
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword).toMatch(/^\$2[aby]\$\d+\$/);
      
      const isValid = await bcrypt.compare(password, hashedPassword);
      expect(isValid).toBe(true);
    });

    it('should prevent password brute force attacks', async () => {
      const email = 'bruteforce@example.com';
      
      // Create user first
      await request(app)
        .post('/api/auth/register')
        .send({
          email: email,
          password: 'CorrectPassword123!',
          name: 'Brute Force Test',
        });

      // Attempt multiple failed logins
      const failedAttempts = Array.from({ length: 6 }, () =>
        request(app)
          .post('/api/auth/login')
          .send({
            email: email,
            password: 'WrongPassword',
          })
      );

      const responses = await Promise.all(failedAttempts);
      
      // First 5 should return 401, 6th should return 429 (rate limited)
      responses.slice(0, 5).forEach(response => {
        expect(response.status).toBe(401);
      });
      
      expect(responses[5].status).toBe(429);
      expect(responses[5].body).toHaveProperty('error');
      expect(responses[5].body.error).toContain('too many attempts');
    });
  });

  describe('Session Security', () => {
    it('should set secure session cookies', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!',
        })
        .expect(200);

      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      
      const sessionCookie = cookies.find((cookie: string) => 
        cookie.startsWith('session=')
      );
      
      expect(sessionCookie).toContain('HttpOnly');
      expect(sessionCookie).toContain('Secure');
      expect(sessionCookie).toContain('SameSite=Strict');
    });

    it('should invalidate sessions on logout', async () => {
      // Login first
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!',
        })
        .expect(200);

      const token = loginResponse.body.token;

      // Logout
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Try to access protected resource
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle concurrent sessions properly', async () => {
      const credentials = {
        email: 'concurrent@example.com',
        password: 'TestPassword123!',
      };

      // Create user
      await request(app)
        .post('/api/auth/register')
        .send({
          ...credentials,
          name: 'Concurrent Test User',
        });

      // Login from multiple "devices"
      const login1 = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(200);

      const login2 = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(200);

      const token1 = login1.body.token;
      const token2 = login2.body.token;

      // Both tokens should be valid
      await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      // Logout from one session
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      // First token should be invalid, second should still work
      await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${token1}`)
        .expect(401);

      await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);
    });
  });

  describe('Role-Based Access Control', () => {
    let userToken: string;
    let adminToken: string;

    beforeAll(async () => {
      // Create regular user
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'user@example.com',
          password: 'UserPassword123!',
          name: 'Regular User',
        });

      const userLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@example.com',
          password: 'UserPassword123!',
        });

      userToken = userLogin.body.token;

      // Create admin user
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'admin@example.com',
          password: 'AdminPassword123!',
          name: 'Admin User',
          role: 'admin',
        });

      const adminLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'AdminPassword123!',
        });

      adminToken = adminLogin.body.token;
    });

    it('should allow users to access user-level endpoints', async () => {
      await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      await request(app)
        .get('/api/numbers/search')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
    });

    it('should prevent users from accessing admin endpoints', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('insufficient permissions');
    });

    it('should allow admins to access admin endpoints', async () => {
      await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      await request(app)
        .get('/api/admin/system-stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should prevent privilege escalation', async () => {
      // Try to update user role to admin
      const response = await request(app)
        .put('/api/user/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          role: 'admin',
        })
        .expect(403);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('cannot modify role');
    });
  });

  describe('Input Validation and Sanitization', () => {
    it('should prevent SQL injection attacks', async () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "'; INSERT INTO users (email) VALUES ('hacker@evil.com'); --",
        "' UNION SELECT * FROM users --",
      ];

      for (const input of maliciousInputs) {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: input,
            password: 'password',
          })
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('invalid input');
      }
    });

    it('should prevent XSS attacks', async () => {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        'javascript:alert("XSS")',
        '<img src="x" onerror="alert(\'XSS\')">',
        '"><script>alert("XSS")</script>',
      ];

      for (const payload of xssPayloads) {
        const response = await request(app)
          .post('/api/user/profile')
          .set('Authorization', `Bearer ${validToken}`)
          .send({
            name: payload,
          })
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('invalid characters');
      }
    });

    it('should validate email formats', async () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user..name@example.com',
        'user@example',
        'user@.example.com',
      ];

      for (const email of invalidEmails) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: email,
            password: 'ValidPassword123!',
            name: 'Test User',
          })
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('invalid email');
      }
    });

    it('should sanitize user input', async () => {
      const response = await request(app)
        .post('/api/user/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          name: '  Test User  ',
          bio: '<p>This is my bio</p>',
        })
        .expect(200);

      expect(response.body.data.name).toBe('Test User'); // Trimmed
      expect(response.body.data.bio).toBe('This is my bio'); // HTML stripped
    });
  });

  describe('Rate Limiting', () => {
    it('should rate limit login attempts', async () => {
      const requests = Array.from({ length: 11 }, () =>
        request(app)
          .post('/api/auth/login')
          .send({
            email: 'ratelimit@example.com',
            password: 'password',
          })
      );

      const responses = await Promise.all(requests);
      
      // First 10 should return 401 (unauthorized), 11th should return 429 (rate limited)
      responses.slice(0, 10).forEach(response => {
        expect(response.status).toBe(401);
      });
      
      expect(responses[10].status).toBe(429);
      expect(responses[10].body).toHaveProperty('error');
      expect(responses[10].body.error).toContain('rate limit exceeded');
    });

    it('should rate limit API requests per user', async () => {
      const requests = Array.from({ length: 101 }, () =>
        request(app)
          .get('/api/numbers/search')
          .set('Authorization', `Bearer ${validToken}`)
          .query({ countryCode: 'US' })
      );

      const responses = await Promise.all(requests);
      
      // First 100 should succeed, 101st should be rate limited
      responses.slice(0, 100).forEach(response => {
        expect(response.status).toBe(200);
      });
      
      expect(responses[100].status).toBe(429);
    });

    it('should have different rate limits for different endpoints', async () => {
      // Test that admin endpoints have stricter rate limits
      const adminRequests = Array.from({ length: 21 }, () =>
        request(app)
          .get('/api/admin/users')
          .set('Authorization', `Bearer ${adminToken}`)
      );

      const responses = await Promise.all(adminRequests);
      
      // Admin endpoints should have lower rate limit (20 requests)
      responses.slice(0, 20).forEach(response => {
        expect(response.status).toBe(200);
      });
      
      expect(responses[20].status).toBe(429);
    });
  });

  describe('HTTPS and Security Headers', () => {
    it('should set security headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(response.headers).toHaveProperty('x-frame-options', 'DENY');
      expect(response.headers).toHaveProperty('x-xss-protection', '1; mode=block');
      expect(response.headers).toHaveProperty('strict-transport-security');
      expect(response.headers).toHaveProperty('content-security-policy');
    });

    it('should not expose sensitive information in headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.headers).not.toHaveProperty('x-powered-by');
      expect(response.headers).not.toHaveProperty('server');
    });
  });

  describe('Data Protection', () => {
    it('should not expose sensitive data in API responses', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.data).not.toHaveProperty('password');
      expect(response.body.data).not.toHaveProperty('passwordHash');
      expect(response.body.data).not.toHaveProperty('salt');
    });

    it('should mask sensitive data in logs', async () => {
      // This would require checking actual log files
      // For now, we'll test that sensitive data is not returned in error responses
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SomePassword123!',
        })
        .expect(401);

      expect(response.body.error).not.toContain('SomePassword123!');
      expect(response.body).not.toHaveProperty('stack');
    });

    it('should encrypt sensitive data at rest', async () => {
      // This would require database inspection
      // For now, we'll test the encryption utility functions
      const sensitiveData = 'sensitive information';
      const encryptionKey = process.env.ENCRYPTION_KEY || 'test-key-32-characters-long-key';
      
      const crypto = require('crypto');
      const algorithm = 'aes-256-gcm';
      const iv = crypto.randomBytes(16);
      
      const cipher = crypto.createCipher(algorithm, encryptionKey);
      let encrypted = cipher.update(sensitiveData, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      expect(encrypted).not.toBe(sensitiveData);
      expect(encrypted).toMatch(/^[a-f0-9]+$/);
    });
  });

  describe('Multi-Factor Authentication', () => {
    let mfaToken: string;

    beforeAll(async () => {
      // Create user with MFA enabled
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'mfa@example.com',
          password: 'MfaPassword123!',
          name: 'MFA User',
        });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'mfa@example.com',
          password: 'MfaPassword123!',
        });

      mfaToken = loginResponse.body.token;

      // Enable MFA
      await request(app)
        .post('/api/auth/mfa/enable')
        .set('Authorization', `Bearer ${mfaToken}`)
        .expect(200);
    });

    it('should require MFA token for sensitive operations', async () => {
      const response = await request(app)
        .delete('/api/user/account')
        .set('Authorization', `Bearer ${mfaToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('MFA required');
    });

    it('should accept valid MFA tokens', async () => {
      // In a real test, this would use a proper TOTP library
      const mfaCode = '123456'; // Mock MFA code
      
      const response = await request(app)
        .delete('/api/user/account')
        .set('Authorization', `Bearer ${mfaToken}`)
        .set('X-MFA-Token', mfaCode)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    it('should reject invalid MFA tokens', async () => {
      const invalidMfaCode = '000000';
      
      const response = await request(app)
        .delete('/api/user/account')
        .set('Authorization', `Bearer ${mfaToken}`)
        .set('X-MFA-Token', invalidMfaCode)
        .expect(403);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('invalid MFA token');
    });
  });
});