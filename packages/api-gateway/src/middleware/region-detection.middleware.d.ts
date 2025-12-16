import { Request, Response, NextFunction } from 'express';
import { Region } from '@voxlink/shared';
export interface RegionDetectionRequest extends Request {
    region?: Region;
    detectedFrom?: 'header' | 'ip' | 'user_preference' | 'default';
}
/**
 * Middleware to detect user's region for pricing
 */
export declare const regionDetectionMiddleware: (req: RegionDetectionRequest, res: Response, next: NextFunction) => void;
/**
 * Middleware to require specific region
 */
export declare const requireRegion: (allowedRegions: Region[]) => (req: RegionDetectionRequest, res: Response, next: NextFunction) => void;
/**
 * Get region-specific configuration
 */
export declare const getRegionConfig: (region: Region) => any;
