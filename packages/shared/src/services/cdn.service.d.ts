export interface CDNConfig {
    provider: 'cloudflare' | 'aws' | 'azure' | 'gcp';
    baseUrl: string;
    apiKey?: string;
    zoneId?: string;
    distributionId?: string;
    cacheTtl?: number;
    enableCompression?: boolean;
    enableMinification?: boolean;
}
export interface AssetUploadOptions {
    contentType?: string;
    cacheControl?: string;
    compress?: boolean;
    minify?: boolean;
    tags?: string[];
}
export interface AssetMetadata {
    url: string;
    size: number;
    contentType: string;
    etag: string;
    lastModified: Date;
    cacheControl: string;
}
export interface CacheInvalidationResult {
    success: boolean;
    invalidatedUrls: string[];
    errors: string[];
}
export declare class CDNService {
    private config;
    private assetCache;
    constructor(config: CDNConfig);
    /**
     * Upload asset to CDN
     */
    uploadAsset(path: string, content: Buffer | string, options?: AssetUploadOptions): Promise<AssetMetadata>;
    /**
     * Get asset URL from CDN
     */
    getAssetUrl(path: string): string;
    /**
     * Get asset metadata
     */
    getAssetMetadata(path: string): Promise<AssetMetadata | null>;
    /**
     * Invalidate cache for specific assets
     */
    invalidateCache(paths: string[]): Promise<CacheInvalidationResult>;
    /**
     * Invalidate cache by tags
     */
    invalidateCacheByTags(tags: string[]): Promise<CacheInvalidationResult>;
    /**
     * Purge all cache
     */
    purgeAllCache(): Promise<boolean>;
    /**
     * Get CDN analytics
     */
    getAnalytics(startDate: Date, endDate: Date): Promise<{
        requests: number;
        bandwidth: number;
        cacheHitRate: number;
        topAssets: Array<{
            path: string;
            requests: number;
            bandwidth: number;
        }>;
    }>;
    /**
     * Optimize images for web delivery
     */
    optimizeImage(path: string, image: Buffer, options?: {
        format?: 'webp' | 'avif' | 'jpeg' | 'png';
        quality?: number;
        width?: number;
        height?: number;
        progressive?: boolean;
    }): Promise<AssetMetadata>;
    /**
     * Generate responsive image variants
     */
    generateResponsiveImages(basePath: string, image: Buffer, sizes?: number[]): Promise<AssetMetadata[]>;
    private compressContent;
    private minifyContent;
    private detectContentType;
    private generateETag;
    private getDefaultCacheControl;
    private getResponsiveImagePath;
    private processImage;
    private uploadToProvider;
    private fetchMetadataFromProvider;
    private invalidateCacheOnProvider;
    private invalidateCacheByTagsOnProvider;
    private purgeAllCacheOnProvider;
    private getAnalyticsFromProvider;
}
