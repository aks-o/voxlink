import {
  TelecomProvider,
  NumberSearchRequest,
  NumberSearchResponse,
  NumberReservationRequest,
  NumberReservationResponse,
  NumberPurchaseRequest,
  NumberPurchaseResponse,
  TelecomPortingRequest as PortingRequest,
  PortingResponse,
  ProviderError,
  ProviderMetrics
} from '@voxlink/shared';
import { BaseTelecomProvider } from './providers/base-provider.service';
import { TwilioProvider } from './providers/twilio-provider.service';
import { BandwidthProvider } from './providers/bandwidth-provider.service';
import { ExotelProvider } from './providers/exotel-provider.service';
import { CacheService } from '@voxlink/shared';
import { logger } from '../utils/logger';
import { config } from '../config/config';

export interface ProviderFailoverConfig {
  maxRetries: number;
  retryDelay: number;
  healthCheckInterval: number;
  failoverThreshold: number;
  circuitBreakerTimeout: number;
}

export class TelecomProviderManager {
  private providers: Map<string, BaseTelecomProvider> = new Map();
  private providerConfigs: TelecomProvider[] = [];
  private cacheService: CacheService;
  private failoverConfig: ProviderFailoverConfig;
  private circuitBreakers: Map<string, { isOpen: boolean; lastFailure: Date; failureCount: number }> = new Map();

  constructor() {
    this.cacheService = new CacheService({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
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

  private initializeProviders(): void {
    // Load provider configurations
    this.providerConfigs = this.loadProviderConfigurations();

    // Initialize provider instances
    for (const providerConfig of this.providerConfigs) {
      if (!providerConfig.enabled) continue;

      let provider: BaseTelecomProvider;

      switch (providerConfig.id) {
        case 'twilio':
          provider = new TwilioProvider(providerConfig);
          break;
        case 'bandwidth':
          provider = new BandwidthProvider(providerConfig);
          break;
        case 'exotel':
          provider = new ExotelProvider(providerConfig);
          break;
        default:
          logger.warn(`Unknown provider type: ${providerConfig.id}`);
          continue;
      }

      this.providers.set(providerConfig.id, provider);
      this.circuitBreakers.set(providerConfig.id, {
        isOpen: false,
        lastFailure: new Date(0),
        failureCount: 0,
      });

      logger.info(`Initialized provider: ${providerConfig.id}`);
    }
  }

  private loadProviderConfigurations(): TelecomProvider[] {
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
          apiKey: config.providers.twilio.apiKey,
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
              accountSid: config.providers.twilio.accountSid,
              authToken: config.providers.twilio.authToken,
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
          apiKey: config.providers.bandwidth.apiKey,
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
              username: config.providers.bandwidth.username,
              password: config.providers.bandwidth.password,
              accountId: config.providers.bandwidth.accountId,
              siteId: config.providers.bandwidth.siteId,
              peerId: config.providers.bandwidth.peerId,
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
        enabled: config.providers.exotel?.enabled || false,
        regions: ['IN'],
        capabilities: [
          { feature: 'number_search', supported: true, regions: ['IN'] },
          { feature: 'number_purchase', supported: true, regions: ['IN'] },
          { feature: 'number_porting', supported: true, regions: ['IN'] },
          { feature: 'sms', supported: true, regions: ['IN'] },
          { feature: 'voice', supported: true, regions: ['IN'] },
          { feature: 'mms', supported: false, regions: [] },
          { feature: 'fax', supported: false, regions: [] },
        ],
        config: {
          apiKey: config.providers.exotel?.apiKey || '',
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
              apiKey: config.providers.exotel?.apiKey || '',
              apiToken: config.providers.exotel?.apiToken || '',
              accountSid: config.providers.exotel?.accountSid || '',
              subdomain: config.providers.exotel?.subdomain || 'api',
              callerId: config.providers.exotel?.callerId || '',
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

  async searchNumbers(request: NumberSearchRequest): Promise<NumberSearchResponse> {
    const cacheKey = `search:${JSON.stringify(request)}`;

    // Try cache first
    const cached = await this.cacheService.get<NumberSearchResponse>(cacheKey);
    if (cached) {
      cached.cached = true;
      return cached;
    }

    const providers = this.getAvailableProviders('number_search', request.countryCode);

    for (const provider of providers) {
      try {
        const result = await this.executeWithCircuitBreaker(
          provider.getProvider().id,
          () => provider.searchNumbers(request)
        );

        // Cache successful results
        await this.cacheService.set(cacheKey, result, { ttl: 300 });

        return result;
      } catch (error) {
        logger.warn(`Provider ${provider.getProvider().id} failed for number search`, { error, request });
        this.recordProviderFailure(provider.getProvider().id, error as ProviderError);

        // Continue to next provider
        continue;
      }
    }

    throw new Error('All providers failed for number search');
  }

  async reserveNumber(request: NumberReservationRequest): Promise<NumberReservationResponse> {
    const provider = this.getProviderById(request.providerId);
    if (!provider) {
      throw new Error(`Provider not found: ${request.providerId}`);
    }

    return this.executeWithCircuitBreaker(
      provider.getProvider().id,
      () => provider.reserveNumber(request)
    );
  }

  async purchaseNumber(request: NumberPurchaseRequest): Promise<NumberPurchaseResponse> {
    const provider = this.getProviderById(request.providerId);
    if (!provider) {
      throw new Error(`Provider not found: ${request.providerId}`);
    }

    return this.executeWithCircuitBreaker(
      provider.getProvider().id,
      () => provider.purchaseNumber(request)
    );
  }

  async portNumber(request: PortingRequest): Promise<PortingResponse> {
    const providers = this.getAvailableProviders('number_porting', this.extractCountryFromPhone(request.phoneNumber));

    for (const provider of providers) {
      try {
        return await this.executeWithCircuitBreaker(
          provider.getProvider().id,
          () => provider.portNumber(request)
        );
      } catch (error) {
        logger.warn(`Provider ${provider.getProvider().id} failed for porting`, { error, request });
        this.recordProviderFailure(provider.getProvider().id, error as ProviderError);
        continue;
      }
    }

    throw new Error('All providers failed for number porting');
  }

  async checkNumberAvailability(phoneNumber: string): Promise<{ available: boolean; provider?: string }> {
    const countryCode = this.extractCountryFromPhone(phoneNumber);
    const providers = this.getAvailableProviders('number_search', countryCode);

    for (const provider of providers) {
      try {
        const available = await this.executeWithCircuitBreaker(
          provider.getProvider().id,
          () => provider.checkNumberAvailability(phoneNumber)
        );

        return { available, provider: provider.getProvider().id };
      } catch (error) {
        logger.warn(`Provider ${provider.getProvider().id} failed for availability check`, { error, phoneNumber });
        continue;
      }
    }

    return { available: false };
  }

  async releaseReservation(providerId: string, reservationId: string): Promise<boolean> {
    const provider = this.getProviderById(providerId);
    if (!provider) {
      return false;
    }

    try {
      return await this.executeWithCircuitBreaker(
        provider.getProvider().id,
        () => provider.releaseReservation(reservationId)
      );
    } catch (error) {
      logger.error(`Failed to release reservation`, { error, providerId, reservationId });
      return false;
    }
  }

  getProviderMetrics(): Record<string, ProviderMetrics> {
    const metrics: Record<string, ProviderMetrics> = {};

    for (const [id, provider] of this.providers) {
      metrics[id] = provider.getMetrics();
    }

    return metrics;
  }

  getProviderHealth(): Record<string, { healthy: boolean; status: string; uptime: number }> {
    const health: Record<string, { healthy: boolean; status: string; uptime: number }> = {};

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

  private getAvailableProviders(feature: string, region?: string): BaseTelecomProvider[] {
    const availableProviders: BaseTelecomProvider[] = [];

    for (const [id, provider] of this.providers) {
      // Check if circuit breaker is open
      const circuitBreaker = this.circuitBreakers.get(id);
      if (circuitBreaker?.isOpen) {
        // Check if circuit breaker timeout has passed
        const now = new Date();
        if (now.getTime() - circuitBreaker.lastFailure.getTime() < this.failoverConfig.circuitBreakerTimeout) {
          continue;
        } else {
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

  private getProviderById(id: string): BaseTelecomProvider | undefined {
    return this.providers.get(id);
  }

  private async executeWithCircuitBreaker<T>(
    providerId: string,
    operation: () => Promise<T>
  ): Promise<T> {
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
    } catch (error) {
      this.recordProviderFailure(providerId, error as ProviderError);
      throw error;
    }
  }

  private recordProviderFailure(providerId: string, error: ProviderError): void {
    const circuitBreaker = this.circuitBreakers.get(providerId);
    if (!circuitBreaker) return;

    circuitBreaker.failureCount++;
    circuitBreaker.lastFailure = new Date();

    // Open circuit breaker if failure threshold is reached
    if (circuitBreaker.failureCount >= this.failoverConfig.maxRetries) {
      circuitBreaker.isOpen = true;
      logger.warn(`Circuit breaker opened for provider: ${providerId}`, {
        failureCount: circuitBreaker.failureCount,
        error,
      });
    }
  }

  private startHealthChecks(): void {
    setInterval(async () => {
      for (const [id, provider] of this.providers) {
        try {
          await provider.healthCheck();
        } catch (error) {
          logger.error(`Health check failed for provider: ${id}`, { error });
        }
      }
    }, this.failoverConfig.healthCheckInterval);
  }

  private extractCountryFromPhone(phoneNumber: string): string {
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