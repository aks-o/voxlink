"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelecomProviderManager = void 0;
const twilio_provider_service_1 = require("./providers/twilio-provider.service");
const bandwidth_provider_service_1 = require("./providers/bandwidth-provider.service");
const exotel_provider_service_1 = require("./providers/exotel-provider.service");
const cache_service_1 = require("@voxlink/shared/services/cache.service");
const logger_1 = require("../utils/logger");
const config_1 = require("../config/config");
class TelecomProviderManager {
    constructor() {
        this.providers = new Map();
        this.providerConfigs = [];
        this.circuitBreakers = new Map();
        this.cacheService = new cache_service_1.CacheService({
            host: config_1.config.redis.host,
            port: config_1.config.redis.port,
            password: config_1.config.redis.password,
            keyPrefix: 'telecom_provider:',
            defaultTtl: 300, // 5 minutes
        });
        this.failoverConfig = {
            maxRetries: 3,
            retryDelay: 1000,
            healthCheckInterval: 60000, // 1 minute
            failoverThreshold: 80, // 80% error rate triggers failover
            circuitBreakerTimeout: 300000, // 5 minutes
        };
        this.initializeProviders();
        this.startHealthChecks();
    }
    initializeProviders() {
        // Load provider configurations
        this.providerConfigs = this.loadProviderConfigurations();
        // Initialize provider instances
        for (const providerConfig of this.providerConfigs) {
            if (!providerConfig.enabled)
                continue;
            let provider;
            switch (providerConfig.id) {
                case 'twilio':
                    provider = new twilio_provider_service_1.TwilioProvider(providerConfig);
                    break;
                case 'bandwidth':
                    provider = new bandwidth_provider_service_1.BandwidthProvider(providerConfig);
                    break;
                case 'exotel':
                    provider = new exotel_provider_service_1.ExotelProvider(providerConfig);
                    break;
                default:
                    logger_1.logger.warn(`Unknown provider type: ${providerConfig.id}`);
                    continue;
            }
            this.providers.set(providerConfig.id, provider);
            this.circuitBreakers.set(providerConfig.id, {
                isOpen: false,
                lastFailure: new Date(0),
                failureCount: 0,
            });
            logger_1.logger.info(`Initialized provider: ${providerConfig.id}`);
        }
    }
    loadProviderConfigurations() {
        // In a real implementation, this would load from database or config files
        return [
            {
                id: 'twilio',
                name: 'Twilio',
                type: 'primary',
                priority: 1,
                enabled: true,
                regions: ['US', 'CA', 'GB', 'AU'],
                capabilities: [
                    { feature: 'number_search', supported: true, regions: ['US', 'CA', 'GB', 'AU'] },
                    { feature: 'number_purchase', supported: true, regions: ['US', 'CA', 'GB', 'AU'] },
                    { feature: 'sms', supported: true, regions: ['US', 'CA', 'GB', 'AU'] },
                    { feature: 'voice', supported: true, regions: ['US', 'CA', 'GB', 'AU'] },
                    { feature: 'mms', supported: true, regions: ['US', 'CA'] },
                ],
                config: {
                    apiUrl: 'https://api.twilio.com/2010-04-01',
                    apiKey: config_1.config.providers.twilio.apiKey,
                    timeout: 10000,
                    retryAttempts: 3,
                    retryDelay: 1000,
                    rateLimits: {
                        requestsPerSecond: 10,
                        requestsPerMinute: 600,
                        requestsPerHour: 36000,
                    },
                    authentication: {
                        type: 'basic',
                        credentials: {
                            accountSid: config_1.config.providers.twilio.accountSid,
                            authToken: config_1.config.providers.twilio.authToken,
                        },
                    },
                },
                healthCheck: {
                    lastCheck: new Date(),
                    status: 'healthy',
                    responseTime: 0,
                    errorRate: 0,
                    uptime: 100,
                },
            },
            {
                id: 'bandwidth',
                name: 'Bandwidth',
                type: 'secondary',
                priority: 2,
                enabled: true,
                regions: ['US', 'CA'],
                capabilities: [
                    { feature: 'number_search', supported: true, regions: ['US', 'CA'] },
                    { feature: 'number_purchase', supported: true, regions: ['US', 'CA'] },
                    { feature: 'number_porting', supported: true, regions: ['US', 'CA'] },
                    { feature: 'sms', supported: true, regions: ['US', 'CA'] },
                    { feature: 'voice', supported: true, regions: ['US', 'CA'] },
                    { feature: 'mms', supported: true, regions: ['US', 'CA'] },
                ],
                config: {
                    apiUrl: 'https://dashboard.bandwidth.com/api',
                    apiKey: config_1.config.providers.bandwidth.apiKey,
                    timeout: 15000,
                    retryAttempts: 3,
                    retryDelay: 1500,
                    rateLimits: {
                        requestsPerSecond: 5,
                        requestsPerMinute: 300,
                        requestsPerHour: 18000,
                    },
                    authentication: {
                        type: 'basic',
                        credentials: {
                            username: config_1.config.providers.bandwidth.username,
                            password: config_1.config.providers.bandwidth.password,
                            accountId: config_1.config.providers.bandwidth.accountId,
                            siteId: config_1.config.providers.bandwidth.siteId,
                            peerId: config_1.config.providers.bandwidth.peerId,
                        },
                    },
                },
                healthCheck: {
                    lastCheck: new Date(),
                    status: 'healthy',
                    responseTime: 0,
                    errorRate: 0,
                    uptime: 100,
                },
            },
            // Exotel - TRAI/DoT Compliant India Provider
            {
                id: 'exotel',
                name: 'Exotel',
                type: 'primary',
                priority: 1, // High priority for India
                enabled: config_1.config.providers.exotel?.enabled || false,
                regions: ['IN'],
                capabilities: [
                    { feature: 'number_search', supported: true, regions: ['IN'] },
                    { feature: 'number_purchase', supported: true, regions: ['IN'] },
                    { feature: 'number_porting', supported: true, regions: ['IN'] },
                    { feature: 'sms', supported: true, regions: ['IN'] },
                    { feature: 'voice', supported: true, regions: ['IN'] },
                    { feature: 'ivr', supported: true, regions: ['IN'] },
                    { feature: 'call_recording', supported: true, regions: ['IN'] },
                    { feature: 'whatsapp', supported: true, regions: ['IN'] },
                ],
                config: {
                    apiUrl: 'https://api.exotel.com/v1',
                    timeout: 30000,
                    retryAttempts: 3,
                    retryDelay: 1000,
                    rateLimits: {
                        requestsPerSecond: 10,
                        requestsPerMinute: 600,
                        requestsPerHour: 36000,
                    },
                    authentication: {
                        type: 'basic',
                        credentials: {
                            apiKey: config_1.config.providers.exotel?.apiKey || '',
                            apiToken: config_1.config.providers.exotel?.apiToken || '',
                            accountSid: config_1.config.providers.exotel?.accountSid || '',
                            subdomain: config_1.config.providers.exotel?.subdomain || 'api',
                            callerId: config_1.config.providers.exotel?.callerId || '',
                        },
                    },
                },
                healthCheck: {
                    lastCheck: new Date(),
                    status: 'healthy',
                    responseTime: 0,
                    errorRate: 0,
                    uptime: 100,
                },
            },
        ];
    }
    async searchNumbers(request) {
        const cacheKey = `search:${JSON.stringify(request)}`;
        // Try cache first
        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
            cached.cached = true;
            return cached;
        }
        const providers = this.getAvailableProviders('number_search', request.countryCode);
        for (const provider of providers) {
            try {
                const result = await this.executeWithCircuitBreaker(provider.id, () => provider.searchNumbers(request));
                // Cache successful results
                await this.cacheService.set(cacheKey, result, { ttl: 300 });
                return result;
            }
            catch (error) {
                logger_1.logger.warn(`Provider ${provider.id} failed for number search`, { error, request });
                this.recordProviderFailure(provider.id, error);
                // Continue to next provider
                continue;
            }
        }
        throw new Error('All providers failed for number search');
    }
    async reserveNumber(request) {
        const provider = this.getProviderById(request.providerId);
        if (!provider) {
            throw new Error(`Provider not found: ${request.providerId}`);
        }
        return this.executeWithCircuitBreaker(provider.id, () => provider.reserveNumber(request));
    }
    async purchaseNumber(request) {
        const provider = this.getProviderById(request.providerId);
        if (!provider) {
            throw new Error(`Provider not found: ${request.providerId}`);
        }
        return this.executeWithCircuitBreaker(provider.id, () => provider.purchaseNumber(request));
    }
    async portNumber(request) {
        const providers = this.getAvailableProviders('number_porting', this.extractCountryFromPhone(request.phoneNumber));
        for (const provider of providers) {
            try {
                return await this.executeWithCircuitBreaker(provider.id, () => provider.portNumber(request));
            }
            catch (error) {
                logger_1.logger.warn(`Provider ${provider.id} failed for porting`, { error, request });
                this.recordProviderFailure(provider.id, error);
                continue;
            }
        }
        throw new Error('All providers failed for number porting');
    }
    async checkNumberAvailability(phoneNumber) {
        const countryCode = this.extractCountryFromPhone(phoneNumber);
        const providers = this.getAvailableProviders('number_search', countryCode);
        for (const provider of providers) {
            try {
                const available = await this.executeWithCircuitBreaker(provider.id, () => provider.checkNumberAvailability(phoneNumber));
                return { available, provider: provider.id };
            }
            catch (error) {
                logger_1.logger.warn(`Provider ${provider.id} failed for availability check`, { error, phoneNumber });
                continue;
            }
        }
        return { available: false };
    }
    async releaseReservation(providerId, reservationId) {
        const provider = this.getProviderById(providerId);
        if (!provider) {
            return false;
        }
        try {
            return await this.executeWithCircuitBreaker(provider.id, () => provider.releaseReservation(reservationId));
        }
        catch (error) {
            logger_1.logger.error(`Failed to release reservation`, { error, providerId, reservationId });
            return false;
        }
    }
    getProviderMetrics() {
        const metrics = {};
        for (const [id, provider] of this.providers) {
            metrics[id] = provider.getMetrics();
        }
        return metrics;
    }
    getProviderHealth() {
        const health = {};
        for (const [id, provider] of this.providers) {
            const providerInfo = provider.getProvider();
            health[id] = {
                healthy: provider.isHealthy(),
                status: providerInfo.healthCheck.status,
                uptime: providerInfo.healthCheck.uptime,
            };
        }
        return health;
    }
    getAvailableProviders(feature, region) {
        const availableProviders = [];
        for (const [id, provider] of this.providers) {
            // Check if circuit breaker is open
            const circuitBreaker = this.circuitBreakers.get(id);
            if (circuitBreaker?.isOpen) {
                // Check if circuit breaker timeout has passed
                const now = new Date();
                if (now.getTime() - circuitBreaker.lastFailure.getTime() < this.failoverConfig.circuitBreakerTimeout) {
                    continue;
                }
                else {
                    // Reset circuit breaker
                    circuitBreaker.isOpen = false;
                    circuitBreaker.failureCount = 0;
                }
            }
            if (provider.isHealthy() &&
                provider.supportsFeature(feature, region) &&
                (region ? provider.supportsRegion(region) : true)) {
                availableProviders.push(provider);
            }
        }
        // Sort by priority
        return availableProviders.sort((a, b) => {
            const aConfig = this.providerConfigs.find(p => p.id === a.getProvider().id);
            const bConfig = this.providerConfigs.find(p => p.id === b.getProvider().id);
            return (aConfig?.priority || 999) - (bConfig?.priority || 999);
        });
    }
    getProviderById(id) {
        return this.providers.get(id);
    }
    async executeWithCircuitBreaker(providerId, operation) {
        const circuitBreaker = this.circuitBreakers.get(providerId);
        if (circuitBreaker?.isOpen) {
            throw new Error(`Circuit breaker is open for provider: ${providerId}`);
        }
        try {
            const result = await operation();
            // Reset failure count on success
            if (circuitBreaker) {
                circuitBreaker.failureCount = 0;
            }
            return result;
        }
        catch (error) {
            this.recordProviderFailure(providerId, error);
            throw error;
        }
    }
    recordProviderFailure(providerId, error) {
        const circuitBreaker = this.circuitBreakers.get(providerId);
        if (!circuitBreaker)
            return;
        circuitBreaker.failureCount++;
        circuitBreaker.lastFailure = new Date();
        // Open circuit breaker if failure threshold is reached
        if (circuitBreaker.failureCount >= this.failoverConfig.maxRetries) {
            circuitBreaker.isOpen = true;
            logger_1.logger.warn(`Circuit breaker opened for provider: ${providerId}`, {
                failureCount: circuitBreaker.failureCount,
                error,
            });
        }
    }
    startHealthChecks() {
        setInterval(async () => {
            for (const [id, provider] of this.providers) {
                try {
                    await provider.healthCheck();
                }
                catch (error) {
                    logger_1.logger.error(`Health check failed for provider: ${id}`, { error });
                }
            }
        }, this.failoverConfig.healthCheckInterval);
    }
    extractCountryFromPhone(phoneNumber) {
        const digits = phoneNumber.replace(/\D/g, '');
        if (digits.startsWith('1') && digits.length === 11) {
            return 'US';
        }
        // India country code
        if (digits.startsWith('91') && digits.length === 12) {
            return 'IN';
        }
        // Add more country code mappings
        return 'US';
    }
}
exports.TelecomProviderManager = TelecomProviderManager;
