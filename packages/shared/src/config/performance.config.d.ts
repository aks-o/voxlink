import { PerformanceConfig } from '../services/performance-integration.service';
/**
 * Default performance configuration
 */
export declare const defaultPerformanceConfig: PerformanceConfig;
/**
 * Environment-specific configurations
 */
export declare const performanceConfigs: {
    development: {
        monitoring: {
            metricsInterval: number;
            enabled: boolean;
            alertThresholds: {
                responseTime: number;
                errorRate: number;
                cpuUsage: number;
                memoryUsage: number;
            };
        };
        autoScaling: {
            enabled: boolean;
            monitoringInterval: number;
            defaultRules: boolean;
        };
        cache: {
            defaultTtl: number;
            enabled: boolean;
            host: string;
            port: number;
            password?: string;
            keyPrefix: string;
        };
        cdn: {
            enabled: boolean;
            provider: "cloudflare" | "aws" | "azure" | "gcp";
            baseUrl: string;
            apiKey?: string;
            zoneId?: string;
        };
        circuitBreaker: {
            enabled: boolean;
            defaultConfig: {
                failureThreshold: number;
                recoveryTimeout: number;
                monitoringPeriod: number;
            };
        };
        queryOptimization: {
            enabled: boolean;
            slowQueryThreshold: number;
            autoIndexSuggestions: boolean;
        };
    };
    staging: {
        autoScaling: {
            enabled: boolean;
            monitoringInterval: number;
            defaultRules: boolean;
        };
        cdn: {
            enabled: boolean;
            provider: "cloudflare" | "aws" | "azure" | "gcp";
            baseUrl: string;
            apiKey?: string;
            zoneId?: string;
        };
        cache: {
            enabled: boolean;
            host: string;
            port: number;
            password?: string;
            keyPrefix: string;
            defaultTtl: number;
        };
        monitoring: {
            enabled: boolean;
            metricsInterval: number;
            alertThresholds: {
                responseTime: number;
                errorRate: number;
                cpuUsage: number;
                memoryUsage: number;
            };
        };
        circuitBreaker: {
            enabled: boolean;
            defaultConfig: {
                failureThreshold: number;
                recoveryTimeout: number;
                monitoringPeriod: number;
            };
        };
        queryOptimization: {
            enabled: boolean;
            slowQueryThreshold: number;
            autoIndexSuggestions: boolean;
        };
    };
    production: {
        monitoring: {
            metricsInterval: number;
            alertThresholds: {
                responseTime: number;
                errorRate: number;
                cpuUsage: number;
                memoryUsage: number;
            };
            enabled: boolean;
        };
        autoScaling: {
            enabled: boolean;
            monitoringInterval: number;
            defaultRules: boolean;
        };
        cdn: {
            enabled: boolean;
            provider: "cloudflare" | "aws" | "azure" | "gcp";
            baseUrl: string;
            apiKey?: string;
            zoneId?: string;
        };
        cache: {
            defaultTtl: number;
            enabled: boolean;
            host: string;
            port: number;
            password?: string;
            keyPrefix: string;
        };
        circuitBreaker: {
            enabled: boolean;
            defaultConfig: {
                failureThreshold: number;
                recoveryTimeout: number;
                monitoringPeriod: number;
            };
        };
        queryOptimization: {
            enabled: boolean;
            slowQueryThreshold: number;
            autoIndexSuggestions: boolean;
        };
    };
};
/**
 * Get performance configuration for current environment
 */
export declare function getPerformanceConfig(): PerformanceConfig;
/**
 * Validate performance configuration
 */
export declare function validatePerformanceConfig(config: PerformanceConfig): string[];
/**
 * Performance configuration presets for different use cases
 */
export declare const performancePresets: {
    /**
     * High-performance preset for production systems
     */
    highPerformance: {
        cache: {
            defaultTtl: number;
            enabled: boolean;
            host: string;
            port: number;
            password?: string;
            keyPrefix: string;
        };
        monitoring: {
            metricsInterval: number;
            alertThresholds: {
                responseTime: number;
                errorRate: number;
                cpuUsage: number;
                memoryUsage: number;
            };
            enabled: boolean;
        };
        autoScaling: {
            enabled: boolean;
            monitoringInterval: number;
            defaultRules: boolean;
        };
        cdn: {
            enabled: boolean;
            provider: "cloudflare" | "aws" | "azure" | "gcp";
            baseUrl: string;
            apiKey?: string;
            zoneId?: string;
        };
        circuitBreaker: {
            enabled: boolean;
            defaultConfig: {
                failureThreshold: number;
                recoveryTimeout: number;
                monitoringPeriod: number;
            };
        };
        queryOptimization: {
            enabled: boolean;
            slowQueryThreshold: number;
            autoIndexSuggestions: boolean;
        };
    };
    /**
     * Cost-optimized preset for budget-conscious deployments
     */
    costOptimized: {
        cache: {
            defaultTtl: number;
            enabled: boolean;
            host: string;
            port: number;
            password?: string;
            keyPrefix: string;
        };
        monitoring: {
            metricsInterval: number;
            enabled: boolean;
            alertThresholds: {
                responseTime: number;
                errorRate: number;
                cpuUsage: number;
                memoryUsage: number;
            };
        };
        autoScaling: {
            enabled: boolean;
            monitoringInterval: number;
            defaultRules: boolean;
        };
        cdn: {
            enabled: boolean;
            provider: "cloudflare" | "aws" | "azure" | "gcp";
            baseUrl: string;
            apiKey?: string;
            zoneId?: string;
        };
        circuitBreaker: {
            enabled: boolean;
            defaultConfig: {
                failureThreshold: number;
                recoveryTimeout: number;
                monitoringPeriod: number;
            };
        };
        queryOptimization: {
            enabled: boolean;
            slowQueryThreshold: number;
            autoIndexSuggestions: boolean;
        };
    };
    /**
     * Development preset for local development
     */
    development: {
        cache: {
            defaultTtl: number;
            enabled: boolean;
            host: string;
            port: number;
            password?: string;
            keyPrefix: string;
        };
        monitoring: {
            metricsInterval: number;
            alertThresholds: {
                responseTime: number;
                errorRate: number;
                cpuUsage: number;
                memoryUsage: number;
            };
            enabled: boolean;
        };
        autoScaling: {
            enabled: boolean;
            monitoringInterval: number;
            defaultRules: boolean;
        };
        cdn: {
            enabled: boolean;
            provider: "cloudflare" | "aws" | "azure" | "gcp";
            baseUrl: string;
            apiKey?: string;
            zoneId?: string;
        };
        circuitBreaker: {
            enabled: boolean;
            defaultConfig: {
                failureThreshold: number;
                recoveryTimeout: number;
                monitoringPeriod: number;
            };
        };
        queryOptimization: {
            enabled: boolean;
            slowQueryThreshold: number;
            autoIndexSuggestions: boolean;
        };
    };
};
