import { Request, Response, NextFunction } from 'express';
import { regionDetectionMiddleware, requireRegion, getRegionConfig } from '../region-detection.middleware';
import { Region } from '@voxlink/shared';

// Mock request and response objects
const mockRequest = (overrides = {}) => ({
  headers: {},
  connection: { remoteAddress: '127.0.0.1' },
  socket: { remoteAddress: '127.0.0.1' },
  user: null,
  ...overrides,
}) as any;

const mockResponse = () => {
  const res = {} as any;
  res.setHeader = jest.fn();
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

const mockNext = jest.fn() as NextFunction;

describe('Region Detection Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('regionDetectionMiddleware', () => {
    it('should detect India region from IP address', () => {
      const req = mockRequest({
        connection: { remoteAddress: '103.255.4.1' }, // India IP
      });
      const res = mockResponse();

      regionDetectionMiddleware(req, res, mockNext);

      expect(req.region).toBe('IN');
      expect(req.detectedFrom).toBe('ip');
      expect(res.setHeader).toHaveBeenCalledWith('X-VoxLink-Detected-Region', 'IN');
      expect(res.setHeader).toHaveBeenCalledWith('X-VoxLink-Detection-Method', 'ip');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should detect US region from IP address', () => {
      const req = mockRequest({
        connection: { remoteAddress: '192.168.1.1' }, // US IP
      });
      const res = mockResponse();

      regionDetectionMiddleware(req, res, mockNext);

      expect(req.region).toBe('US');
      expect(req.detectedFrom).toBe('ip');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should use explicit region header with highest priority', () => {
      const req = mockRequest({
        headers: { 'x-voxlink-region': 'IN' },
        connection: { remoteAddress: '192.168.1.1' }, // US IP
      });
      const res = mockResponse();

      regionDetectionMiddleware(req, res, mockNext);

      expect(req.region).toBe('IN');
      expect(req.detectedFrom).toBe('header');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should use user preference from JWT token', () => {
      const req = mockRequest({
        user: { preferredRegion: 'IN' },
        connection: { remoteAddress: '192.168.1.1' }, // US IP
      });
      const res = mockResponse();

      regionDetectionMiddleware(req, res, mockNext);

      expect(req.region).toBe('IN');
      expect(req.detectedFrom).toBe('user_preference');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should detect region from country code header', () => {
      const req = mockRequest({
        headers: { 'cf-ipcountry': 'IN' }, // Cloudflare country header
        connection: { remoteAddress: '127.0.0.1' },
      });
      const res = mockResponse();

      regionDetectionMiddleware(req, res, mockNext);

      expect(req.region).toBe('IN');
      expect(req.detectedFrom).toBe('header');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should default to US region for unknown IPs', () => {
      const req = mockRequest({
        connection: { remoteAddress: '10.0.0.1' }, // Unknown IP
      });
      const res = mockResponse();

      regionDetectionMiddleware(req, res, mockNext);

      expect(req.region).toBe('US');
      expect(req.detectedFrom).toBe('default');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle X-Forwarded-For header', () => {
      const req = mockRequest({
        headers: { 'x-forwarded-for': '103.255.4.1, 192.168.1.1' }, // India IP first
      });
      const res = mockResponse();

      regionDetectionMiddleware(req, res, mockNext);

      expect(req.region).toBe('IN');
      expect(req.detectedFrom).toBe('ip');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue with default region on error', () => {
      const req = mockRequest();
      const res = mockResponse();

      // Simulate error by making headers throw
      Object.defineProperty(req, 'headers', {
        get: () => { throw new Error('Test error'); }
      });

      regionDetectionMiddleware(req, res, mockNext);

      expect(req.region).toBe('US');
      expect(req.detectedFrom).toBe('default');
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requireRegion', () => {
    it('should allow access for supported region', () => {
      const middleware = requireRegion(['IN', 'US']);
      const req = mockRequest({ region: 'IN' });
      const res = mockResponse();

      middleware(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should block access for unsupported region', () => {
      const middleware = requireRegion(['US']);
      const req = mockRequest({ region: 'IN' });
      const res = mockResponse();

      middleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Region not supported',
        detectedRegion: 'IN',
        allowedRegions: ['US'],
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should block access when no region is detected', () => {
      const middleware = requireRegion(['IN', 'US']);
      const req = mockRequest({ region: undefined });
      const res = mockResponse();

      middleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('getRegionConfig', () => {
    it('should return India configuration', () => {
      const config = getRegionConfig('IN');

      expect(config).toEqual({
        currency: 'INR',
        locale: 'en-IN',
        timezone: 'Asia/Kolkata',
        dateFormat: 'DD/MM/YYYY',
        phoneFormat: '+91-XXXXX-XXXXX',
      });
    });

    it('should return US configuration', () => {
      const config = getRegionConfig('US');

      expect(config).toEqual({
        currency: 'USD',
        locale: 'en-US',
        timezone: 'America/New_York',
        dateFormat: 'MM/DD/YYYY',
        phoneFormat: '+1-XXX-XXX-XXXX',
      });
    });

    it('should return EU configuration', () => {
      const config = getRegionConfig('EU');

      expect(config).toEqual({
        currency: 'EUR',
        locale: 'en-GB',
        timezone: 'Europe/London',
        dateFormat: 'DD/MM/YYYY',
        phoneFormat: '+XX-XXX-XXX-XXXX',
      });
    });

    it('should return global configuration for unknown region', () => {
      const config = getRegionConfig('XX' as Region);

      expect(config).toEqual({
        currency: 'USD',
        locale: 'en-US',
        timezone: 'UTC',
        dateFormat: 'YYYY-MM-DD',
        phoneFormat: '+XXX-XXX-XXX-XXXX',
      });
    });
  });
});