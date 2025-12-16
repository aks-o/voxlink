import { Request, Response, NextFunction } from 'express';
import { Region } from '@voxlink/shared';
import { User } from '@voxlink/shared';
import { logger } from '../utils/logger';

// IP to region mapping (simplified - in production, use a proper GeoIP service)
const IP_REGION_MAP: Record<string, Region> = {
  // India IP ranges (simplified)
  '103.': 'IN',
  '117.': 'IN',
  '122.': 'IN',
  '157.': 'IN',
  '182.': 'IN',
  '203.': 'IN',

  // US IP ranges (simplified)
  '192.': 'US',
  '198.': 'US',
  '199.': 'US',
  '204.': 'US',
  '208.': 'US',

  // Default fallback
  '127.0.0.1': 'IN', // For local development, default to India
  '::1': 'IN', // IPv6 localhost
};

// Country code to region mapping
const COUNTRY_REGION_MAP: Record<string, Region> = {
  'IN': 'IN',
  'US': 'US',
  'GB': 'EU',
  'DE': 'EU',
  'FR': 'EU',
  'CA': 'US', // Treat Canada as US region for now
  'AU': 'US', // Treat Australia as US region for now
};

export interface RegionDetectionRequest extends Request {
  region?: Region;
  detectedFrom?: 'header' | 'ip' | 'user_preference' | 'default';
  user?: User;
}

/**
 * Middleware to detect user's region for pricing
 */
export const regionDetectionMiddleware = (
  req: RegionDetectionRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    let detectedRegion: Region = 'US'; // Default fallback
    let detectionMethod: RegionDetectionRequest['detectedFrom'] = 'default';

    // Method 1: Check for explicit region header (highest priority)
    const regionHeader = req.headers['x-voxlink-region'] as string;
    if (regionHeader && isValidRegion(regionHeader)) {
      detectedRegion = regionHeader as Region;
      detectionMethod = 'header';
    }
    // Method 2: Check user preferences from JWT token or session
    else if (req.user && (req.user as any).preferredRegion) {
      const userRegion = (req.user as any).preferredRegion;
      if (isValidRegion(userRegion)) {
        detectedRegion = userRegion as Region;
        detectionMethod = 'user_preference';
      }
    }
    // Method 3: Detect from IP address
    else {
      const clientIP = getClientIP(req);
      const regionFromIP = detectRegionFromIP(clientIP);
      if (regionFromIP) {
        detectedRegion = regionFromIP;
        detectionMethod = 'ip';
      }
    }

    // Method 4: Check country code from headers
    if (detectionMethod === 'default') {
      const countryCode = req.headers['cf-ipcountry'] as string || // Cloudflare
        req.headers['x-country-code'] as string;   // Custom header

      if (countryCode && COUNTRY_REGION_MAP[countryCode.toUpperCase()]) {
        detectedRegion = COUNTRY_REGION_MAP[countryCode.toUpperCase()];
        detectionMethod = 'header';
      }
    }

    // Attach region information to request
    req.region = detectedRegion;
    req.detectedFrom = detectionMethod;

    // Add region to response headers for debugging
    res.setHeader('X-VoxLink-Detected-Region', detectedRegion);
    res.setHeader('X-VoxLink-Detection-Method', detectionMethod);

    logger.debug('Region detected', {
      region: detectedRegion,
      method: detectionMethod,
      ip: getClientIP(req),
      userAgent: req.headers['user-agent'],
    });

    next();
  } catch (error) {
    logger.error('Error in region detection middleware:', error as any);
    // Set default region and continue
    req.region = 'US';
    req.detectedFrom = 'default';
    next();
  }
};

/**
 * Get client IP address from request
 */
function getClientIP(req: Request): string {
  return (
    req.headers['cf-connecting-ip'] as string ||        // Cloudflare
    req.headers['x-forwarded-for'] as string ||         // Proxy
    req.headers['x-real-ip'] as string ||               // Nginx
    req.connection.remoteAddress ||                     // Direct connection
    req.socket.remoteAddress ||                         // Socket
    '127.0.0.1'                                        // Fallback
  );
}

/**
 * Detect region from IP address
 */
function detectRegionFromIP(ip: string): Region | null {
  // Remove port if present
  const cleanIP = ip.split(':')[0];

  // Check against IP prefixes
  for (const [prefix, region] of Object.entries(IP_REGION_MAP)) {
    if (cleanIP.startsWith(prefix)) {
      return region;
    }
  }

  // For production, integrate with a proper GeoIP service like MaxMind
  // Example: const geoData = await geoIPService.lookup(cleanIP);
  // return COUNTRY_REGION_MAP[geoData.country] || 'US';

  return null;
}

/**
 * Validate if region is supported
 */
function isValidRegion(region: string): boolean {
  return ['IN', 'US', 'EU', 'GLOBAL'].includes(region.toUpperCase());
}

/**
 * Middleware to require specific region
 */
export const requireRegion = (allowedRegions: Region[]) => {
  return (req: RegionDetectionRequest, res: Response, next: NextFunction): void => {
    if (!req.region || !allowedRegions.includes(req.region)) {
      res.status(403).json({
        error: 'Region not supported',
        detectedRegion: req.region,
        allowedRegions,
      });
      return;
    }
    next();
  };
};

/**
 * Get region-specific configuration
 */
export const getRegionConfig = (region: Region) => {
  const configs: Record<Region, any> = {
    IN: {
      currency: 'INR',
      locale: 'en-IN',
      timezone: 'Asia/Kolkata',
      dateFormat: 'DD/MM/YYYY',
      phoneFormat: '+91-XXXXX-XXXXX',
    },
    US: {
      currency: 'USD',
      locale: 'en-US',
      timezone: 'America/New_York',
      dateFormat: 'MM/DD/YYYY',
      phoneFormat: '+1-XXX-XXX-XXXX',
    },
    EU: {
      currency: 'EUR',
      locale: 'en-GB',
      timezone: 'Europe/London',
      dateFormat: 'DD/MM/YYYY',
      phoneFormat: '+XX-XXX-XXX-XXXX',
    },
    GLOBAL: {
      currency: 'USD',
      locale: 'en-US',
      timezone: 'UTC',
      dateFormat: 'YYYY-MM-DD',
      phoneFormat: '+XXX-XXX-XXX-XXXX',
    },
  };

  return configs[region] || configs.GLOBAL;
};