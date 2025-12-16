export interface CacheConfig {
    host: string;
    port: number;
    password?: string;
    database?: number;
    keyPrefix?: string;
    defaultTtl?: number;
    maxRetries?: number;
    retryDelay?: number;
}
export interface CacheOptions {
    ttl?: number;
    tags?: string[];
    compress?: boolean;
}
export interface CacheStats {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
    errors: number;
    hitRate: number;
}
export declare class CacheService {
    private client;
    private config;
    private stats;
    private isConnected;
    constructor(config: CacheConfig);
    private setupEventHandlers;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    private getKey;
    private updateHitRate;
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, options?: CacheOptions): Promise<boolean>;
    delete(key: string): Promise<boolean>;
    exists(key: string): Promise<boolean>;
    mget<T>(keys: string[]): Promise<(T | null)[]>;
    mset<T>(keyValuePairs: Array<{
        key: string;
        value: T;
        options?: CacheOptions;
    }>): Promise<boolean>;
    invalidateByTag(tag: string): Promise<number>;
    private addToTags;
    increment(key: string, amount?: number): Promise<number>;
    expire(key: string, seconds: number): Promise<boolean>;
    ttl(key: string): Promise<number>;
    flush(): Promise<boolean>;
    ping(): Promise<boolean>;
    getStats(): CacheStats;
    resetStats(): void;
    isHealthy(): boolean;
    /**
     * Start reporting metrics to performance monitor
     */
    private startMetricsReporting;
    /**
     * Report cache metrics to performance monitor
     */
    private reportMetrics;
    /**
     * Get cache performance metrics for the last period
     */
    getPerformanceMetrics(periodMs?: number): Promise<{
        avgResponseTime: number;
        throughput: number;
        errorRate: number;
        memoryUsage: number;
    }>;
}
