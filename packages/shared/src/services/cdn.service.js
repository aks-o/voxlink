"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CDNService = void 0;
const logger_1 = require("../monitoring/logger");
class CDNService {
    constructor(config) {
        this.assetCache = new Map();
        this.config = {
            cacheTtl: 86400, // 24 hours
            enableCompression: true,
            enableMinification: true,
            ...config,
        };
    }
    /**
     * Upload asset to CDN
     */
    async uploadAsset(path, content, options = {}) {
        try {
            logger_1.logger.info('Uploading asset to CDN', { path, size: content.length });
            // Process content based on options
            let processedContent = content;
            if (options.compress && this.config.enableCompression) {
                processedContent = await this.compressContent(processedContent);
            }
            if (options.minify && this.config.enableMinification) {
                processedContent = await this.minifyContent(processedContent, options.contentType);
            }
            // Generate asset metadata
            const metadata = {
                url: this.getAssetUrl(path),
                size: processedContent.length,
                contentType: options.contentType || this.detectContentType(path),
                etag: this.generateETag(processedContent),
                lastModified: new Date(),
                cacheControl: options.cacheControl || this.getDefaultCacheControl(path),
            };
            // Upload to CDN provider
            await this.uploadToProvider(path, processedContent, metadata, options);
            // Cache metadata locally
            this.assetCache.set(path, metadata);
            logger_1.logger.info('Asset uploaded successfully', { path, url: metadata.url });
            return metadata;
        }
        catch (error) {
            logger_1.logger.error('Failed to upload asset to CDN', { error, path });
            throw error;
        }
    }
    /**
     * Get asset URL from CDN
     */
    getAssetUrl(path) {
        const cleanPath = path.startsWith('/') ? path.slice(1) : path;
        return `${this.config.baseUrl}/${cleanPath}`;
    }
    /**
     * Get asset metadata
     */
    async getAssetMetadata(path) {
        // Check local cache first
        const cached = this.assetCache.get(path);
        if (cached) {
            return cached;
        }
        try {
            // Fetch from CDN provider
            const metadata = await this.fetchMetadataFromProvider(path);
            if (metadata) {
                this.assetCache.set(path, metadata);
            }
            return metadata;
        }
        catch (error) {
            logger_1.logger.error('Failed to get asset metadata', { error, path });
            return null;
        }
    }
    /**
     * Invalidate cache for specific assets
     */
    async invalidateCache(paths) {
        try {
            logger_1.logger.info('Invalidating CDN cache', { paths });
            const result = await this.invalidateCacheOnProvider(paths);
            // Remove from local cache
            for (const path of paths) {
                this.assetCache.delete(path);
            }
            logger_1.logger.info('Cache invalidation completed', result);
            return result;
        }
        catch (error) {
            logger_1.logger.error('Failed to invalidate CDN cache', { error, paths });
            return {
                success: false,
                invalidatedUrls: [],
                errors: [error instanceof Error ? error.message : 'Unknown error'],
            };
        }
    }
    /**
     * Invalidate cache by tags
     */
    async invalidateCacheByTags(tags) {
        try {
            logger_1.logger.info('Invalidating CDN cache by tags', { tags });
            const result = await this.invalidateCacheByTagsOnProvider(tags);
            // Clear local cache (we don't track tags locally)
            this.assetCache.clear();
            logger_1.logger.info('Cache invalidation by tags completed', result);
            return result;
        }
        catch (error) {
            logger_1.logger.error('Failed to invalidate CDN cache by tags', { error, tags });
            return {
                success: false,
                invalidatedUrls: [],
                errors: [error instanceof Error ? error.message : 'Unknown error'],
            };
        }
    }
    /**
     * Purge all cache
     */
    async purgeAllCache() {
        try {
            logger_1.logger.info('Purging all CDN cache');
            const success = await this.purgeAllCacheOnProvider();
            if (success) {
                this.assetCache.clear();
            }
            logger_1.logger.info('Cache purge completed', { success });
            return success;
        }
        catch (error) {
            logger_1.logger.error('Failed to purge CDN cache', { error });
            return false;
        }
    }
    /**
     * Get CDN analytics
     */
    async getAnalytics(startDate, endDate) {
        try {
            return await this.getAnalyticsFromProvider(startDate, endDate);
        }
        catch (error) {
            logger_1.logger.error('Failed to get CDN analytics', { error });
            return {
                requests: 0,
                bandwidth: 0,
                cacheHitRate: 0,
                topAssets: [],
            };
        }
    }
    /**
     * Optimize images for web delivery
     */
    async optimizeImage(path, image, options = {}) {
        try {
            logger_1.logger.info('Optimizing image for CDN', { path, originalSize: image.length });
            // In a real implementation, you'd use image processing libraries
            // like sharp, imagemin, or cloud-based image optimization services
            const optimizedImage = await this.processImage(image, options);
            const uploadOptions = {
                contentType: `image/${options.format || 'jpeg'}`,
                compress: true,
                cacheControl: 'public, max-age=31536000, immutable', // 1 year for images
            };
            const metadata = await this.uploadAsset(path, optimizedImage, uploadOptions);
            logger_1.logger.info('Image optimized and uploaded', {
                path,
                originalSize: image.length,
                optimizedSize: optimizedImage.length,
                compressionRatio: ((image.length - optimizedImage.length) / image.length * 100).toFixed(2) + '%',
            });
            return metadata;
        }
        catch (error) {
            logger_1.logger.error('Failed to optimize image', { error, path });
            throw error;
        }
    }
    /**
     * Generate responsive image variants
     */
    async generateResponsiveImages(basePath, image, sizes = [320, 640, 1024, 1920]) {
        const variants = [];
        for (const size of sizes) {
            try {
                const variantPath = this.getResponsiveImagePath(basePath, size);
                const metadata = await this.optimizeImage(variantPath, image, {
                    width: size,
                    format: 'webp',
                    quality: 85,
                });
                variants.push(metadata);
            }
            catch (error) {
                logger_1.logger.error('Failed to generate responsive image variant', { error, basePath, size });
            }
        }
        return variants;
    }
    async compressContent(content) {
        // In a real implementation, use compression libraries like zlib, brotli
        logger_1.logger.debug('Compressing content');
        return Buffer.isBuffer(content) ? content : Buffer.from(content);
    }
    async minifyContent(content, contentType) {
        // In a real implementation, use minification libraries based on content type
        logger_1.logger.debug('Minifying content', { contentType });
        const stringContent = Buffer.isBuffer(content) ? content.toString() : content;
        if (contentType?.includes('javascript')) {
            // Use terser or similar for JS minification
            return Buffer.from(stringContent);
        }
        if (contentType?.includes('css')) {
            // Use cssnano or similar for CSS minification
            return Buffer.from(stringContent);
        }
        if (contentType?.includes('html')) {
            // Use html-minifier or similar
            return Buffer.from(stringContent);
        }
        return Buffer.isBuffer(content) ? content : Buffer.from(content);
    }
    detectContentType(path) {
        const extension = path.split('.').pop()?.toLowerCase();
        const mimeTypes = {
            'html': 'text/html',
            'css': 'text/css',
            'js': 'application/javascript',
            'json': 'application/json',
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'svg': 'image/svg+xml',
            'webp': 'image/webp',
            'avif': 'image/avif',
            'woff': 'font/woff',
            'woff2': 'font/woff2',
            'ttf': 'font/ttf',
            'eot': 'application/vnd.ms-fontobject',
        };
        return mimeTypes[extension || ''] || 'application/octet-stream';
    }
    generateETag(content) {
        // Simple ETag generation - in production, use a proper hash function
        const hash = require('crypto').createHash('md5');
        hash.update(content);
        return `"${hash.digest('hex')}"`;
    }
    getDefaultCacheControl(path) {
        const extension = path.split('.').pop()?.toLowerCase();
        // Different cache policies for different asset types
        if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif'].includes(extension || '')) {
            return 'public, max-age=31536000, immutable'; // 1 year for images
        }
        if (['css', 'js'].includes(extension || '')) {
            return 'public, max-age=31536000, immutable'; // 1 year for versioned assets
        }
        if (['woff', 'woff2', 'ttf', 'eot'].includes(extension || '')) {
            return 'public, max-age=31536000, immutable'; // 1 year for fonts
        }
        return 'public, max-age=3600'; // 1 hour for other assets
    }
    getResponsiveImagePath(basePath, size) {
        const parts = basePath.split('.');
        const extension = parts.pop();
        const nameWithoutExt = parts.join('.');
        return `${nameWithoutExt}-${size}w.webp`;
    }
    async processImage(image, options) {
        // Mock image processing - in reality, use sharp or similar
        logger_1.logger.debug('Processing image', options);
        return image;
    }
    // Provider-specific implementations (mocked for now)
    async uploadToProvider(path, content, metadata, options) {
        // Implementation would depend on CDN provider
        logger_1.logger.debug('Uploading to CDN provider', { provider: this.config.provider, path });
    }
    async fetchMetadataFromProvider(path) {
        // Implementation would depend on CDN provider
        logger_1.logger.debug('Fetching metadata from CDN provider', { provider: this.config.provider, path });
        return null;
    }
    async invalidateCacheOnProvider(paths) {
        // Implementation would depend on CDN provider
        logger_1.logger.debug('Invalidating cache on CDN provider', { provider: this.config.provider, paths });
        return {
            success: true,
            invalidatedUrls: paths.map(p => this.getAssetUrl(p)),
            errors: [],
        };
    }
    async invalidateCacheByTagsOnProvider(tags) {
        // Implementation would depend on CDN provider
        logger_1.logger.debug('Invalidating cache by tags on CDN provider', { provider: this.config.provider, tags });
        return {
            success: true,
            invalidatedUrls: [],
            errors: [],
        };
    }
    async purgeAllCacheOnProvider() {
        // Implementation would depend on CDN provider
        logger_1.logger.debug('Purging all cache on CDN provider', { provider: this.config.provider });
        return true;
    }
    async getAnalyticsFromProvider(startDate, endDate) {
        // Implementation would depend on CDN provider
        logger_1.logger.debug('Getting analytics from CDN provider', { provider: this.config.provider, startDate, endDate });
        return {
            requests: 0,
            bandwidth: 0,
            cacheHitRate: 0,
            topAssets: [],
        };
    }
}
exports.CDNService = CDNService;
