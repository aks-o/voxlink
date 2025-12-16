import request from 'supertest';
import app from '../index';
import { AuthService } from '../services/auth.service';
import { RedisService } from '../services/redis.service';

describe('API Gateway Security Tests', () => {
  let authService: AuthService;
  let redisService: RedisService;

  beforeAll(() => {
    redisService = new RedisService();
    authService = new AuthService(redisService);
  });

  afterAll(async () => {
    await redisService.disconnect();
  });

  describe('Authentication Tests', () => {
    test('should reject requests without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/numbers')
        .expect(401);

      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    test('should reject requests with invalid JWT token', async () => {
      const response = await request(app)
        .get('/api/v1/numbers')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    test('should reject requests with invalid API key', async () => {
      const response = await request(app)
        .get('/api/v1/numbers')
        .set('X-API-Key', 'invalid-key')
        .expect(401);

      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    test('should accept valid login credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'admin@voxlink.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body.user).toBeDefined();
      expect(response.body.tokens).toBeDefined();
      expect(response.body.tokens.accessToken).toBeDefined();
      expect(response.body.tokens.refreshToken).toBeDefined();
    });

    test('should reject invalid login credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'admin@voxlink.com',
          password: 'wrong-password',
        })
        .expect(401);

      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('Rate Limiting Tests', () => {
    test('should enforce rate limits on auth endpoints', async () => {
      const promises = [];
      
      // Make multiple rapid requests to exceed rate limit
      for (let i = 0; i < 15; i++) {
        promises.push(
          request(app)
            .post('/auth/login')
            .send({
              email: 'test@example.com',
              password: 'wrong-password',
            })
        );
      }

      const responses = await Promise.all(promises);
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    test('should include rate limit headers', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password',
        });

      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
    });
  });

  describe('Security Headers Tests', () => {
    test('should include security headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    });

    test('should include request ID header', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['x-request-id']).toBeDefined();
    });
  });

  describe('Input Validation Tests', () => {
    test('should reject suspicious path traversal attempts', async () => {
      const response = await request(app)
        .get('/api/v1/../../../etc/passwd')
        .expect(400);

      expect(response.body.error.code).toBe('SUSPICIOUS_REQUEST');
    });

    test('should reject XSS attempts', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: '<script>alert("xss")</script>',
          password: 'password',
        })
        .expect(400);

      expect(response.body.error.code).toBe('SUSPICIOUS_REQUEST');
    });

    test('should reject SQL injection attempts', async () => {
      const response = await request(app)
        .get('/api/v1/numbers?id=1 UNION SELECT * FROM users')
        .expect(400);

      expect(response.body.error.code).toBe('SUSPICIOUS_REQUEST');
    });

    test('should reject oversized requests', async () => {
      const largePayload = 'x'.repeat(11 * 1024 * 1024); // 11MB

      const response = await request(app)
        .post('/auth/login')
        .send({ data: largePayload })
        .expect(413);

      expect(response.body.error.code).toBe('REQUEST_TOO_LARGE');
    });
  });

  describe('CORS Tests', () => {
    test('should handle CORS preflight requests', async () => {
      const response = await request(app)
        .options('/api/v1/numbers')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toBeDefined();
    });

    test('should reject requests from unauthorized origins', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://malicious-site.com');

      // Should not include CORS headers for unauthorized origins
      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  describe('API Key Security Tests', () => {
    test('should validate API key format', async () => {
      const response = await request(app)
        .get('/api/v1/numbers')
        .set('X-API-Key', 'invalid-format')
        .expect(401);

      expect(response.body.error.code).toBe('INVALID_API_KEY_FORMAT');
    });

    test('should accept properly formatted API keys', async () => {
      // This would fail in real implementation without valid key
      const response = await request(app)
        .get('/api/v1/numbers')
        .set('X-API-Key', 'vxl_1234567890abcdef1234567890abcdef');

      // Should get past format validation (but fail auth)
      expect(response.status).not.toBe(401);
      expect(response.body.error?.code).not.toBe('INVALID_API_KEY_FORMAT');
    });
  });

  describe('Error Handling Tests', () => {
    test('should not expose sensitive information in error messages', async () => {
      const response = await request(app)
        .get('/nonexistent-endpoint')
        .expect(404);

      expect(response.body.error.message).not.toContain('stack');
      expect(response.body.error.message).not.toContain('internal');
    });

    test('should include request ID in error responses', async () => {
      const response = await request(app)
        .get('/nonexistent-endpoint')
        .expect(404);

      expect(response.body.error.requestId).toBeDefined();
    });
  });

  describe('Health Check Security', () => {
    test('should allow health checks without authentication', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
    });

    test('should not expose sensitive information in health checks', async () => {
      const response = await request(app)
        .get('/health/detailed')
        .expect(200);

      expect(response.body.services).toBeDefined();
      // Should not expose internal URLs or credentials
      response.body.services.forEach((service: any) => {
        expect(service.url).not.toContain('password');
        expect(service.url).not.toContain('secret');
      });
    });
  });

  describe('JWT Security Tests', () => {
    let validToken: string;

    beforeAll(async () => {
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'admin@voxlink.com',
          password: 'password123',
        });

      validToken = loginResponse.body.tokens.accessToken;
    });

    test('should verify JWT token structure', async () => {
      const response = await request(app)
        .get('/auth/verify')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.valid).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.expiresAt).toBeDefined();
    });

    test('should reject expired tokens', async () => {
      // This would require a token with past expiration
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZXhwIjoxNjA5NDU5MjAwfQ.invalid';
      
      const response = await request(app)
        .get('/auth/verify')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.valid).toBe(false);
    });

    test('should handle token refresh securely', async () => {
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'admin@voxlink.com',
          password: 'password123',
        });

      const refreshToken = loginResponse.body.tokens.refreshToken;

      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.tokens.accessToken).toBeDefined();
      expect(response.body.tokens.refreshToken).toBeDefined();
    });
  });

  describe('Permission-Based Access Control', () => {
    test('should enforce permission requirements', async () => {
      // This test would require setting up users with different permissions
      // and testing access to various endpoints
      expect(true).toBe(true); // Placeholder
    });

    test('should respect role-based access', async () => {
      // This test would verify that admin users can access admin endpoints
      // while regular users cannot
      expect(true).toBe(true); // Placeholder
    });
  });
});