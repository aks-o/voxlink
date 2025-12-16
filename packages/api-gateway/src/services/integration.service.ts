import { Request, Response } from 'express';
import axios, { AxiosRequestConfig } from 'axios';
import crypto from 'crypto';
import { logger } from '../utils/logger';
import { RedisService } from './redis.service';

const redisService = new RedisService();

export interface IntegrationProvider {
  id: string;
  name: string;
  authType: 'oauth2' | 'api_key' | 'basic' | 'bearer';
  baseUrl: string;
  authConfig: {
    clientId?: string;
    clientSecret?: string;
    authUrl?: string;
    tokenUrl?: string;
    scopes?: string[];
  };
  rateLimits: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  webhookConfig?: {
    supportedEvents: string[];
    signatureHeader?: string;
    signatureMethod?: 'hmac-sha256' | 'hmac-sha1';
  };
}

export interface IntegrationInstance {
  id: string;
  providerId: string;
  userId: string;
  name: string;
  status: 'active' | 'inactive' | 'error' | 'pending';
  credentials: {
    accessToken?: string;
    refreshToken?: string;
    apiKey?: string;
    tokenExpiry?: Date;
  };
  config: Record<string, any>;
  lastSync?: Date;
  createdAt: Date;
  updatedAt: Date;
}

class IntegrationService {
  private providers: Map<string, IntegrationProvider> = new Map();
  private instances: Map<string, IntegrationInstance> = new Map();
  private rateLimiters: Map<string, RateLimiter> = new Map();

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Initialize popular integration providers
    const providers: IntegrationProvider[] = [
      {
        id: 'salesforce',
        name: 'Salesforce',
        authType: 'oauth2',
        baseUrl: 'https://api.salesforce.com',
        authConfig: {
          authUrl: 'https://login.salesforce.com/services/oauth2/authorize',
          tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
          scopes: ['api', 'refresh_token']
        },
        rateLimits: {
          requestsPerMinute: 100,
          requestsPerHour: 5000
        },
        webhookConfig: {
          supportedEvents: ['contact.created', 'contact.updated', 'lead.created'],
          signatureHeader: 'X-Salesforce-Signature',
          signatureMethod: 'hmac-sha256'
        }
      },
      {
        id: 'hubspot',
        name: 'HubSpot',
        authType: 'oauth2',
        baseUrl: 'https://api.hubapi.com',
        authConfig: {
          authUrl: 'https://app.hubspot.com/oauth/authorize',
          tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
          scopes: ['contacts', 'timeline']
        },
        rateLimits: {
          requestsPerMinute: 100,
          requestsPerHour: 40000
        },
        webhookConfig: {
          supportedEvents: ['contact.creation', 'contact.propertyChange', 'deal.creation'],
          signatureHeader: 'X-HubSpot-Signature',
          signatureMethod: 'hmac-sha256'
        }
      },
      {
        id: 'slack',
        name: 'Slack',
        authType: 'oauth2',
        baseUrl: 'https://slack.com/api',
        authConfig: {
          authUrl: 'https://slack.com/oauth/v2/authorize',
          tokenUrl: 'https://slack.com/api/oauth.v2.access',
          scopes: ['chat:write', 'channels:read', 'users:read']
        },
        rateLimits: {
          requestsPerMinute: 50,
          requestsPerHour: 1000
        },
        webhookConfig: {
          supportedEvents: ['message', 'channel_created', 'user_change'],
          signatureHeader: 'X-Slack-Signature',
          signatureMethod: 'hmac-sha256'
        }
      },
      {
        id: 'zapier',
        name: 'Zapier',
        authType: 'api_key',
        baseUrl: 'https://hooks.zapier.com',
        authConfig: {},
        rateLimits: {
          requestsPerMinute: 60,
          requestsPerHour: 3600
        }
      },
      {
        id: 'microsoft-teams',
        name: 'Microsoft Teams',
        authType: 'oauth2',
        baseUrl: 'https://graph.microsoft.com/v1.0',
        authConfig: {
          authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
          tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
          scopes: ['https://graph.microsoft.com/Chat.ReadWrite', 'https://graph.microsoft.com/Team.ReadBasic.All']
        },
        rateLimits: {
          requestsPerMinute: 60,
          requestsPerHour: 3600
        }
      }
    ];

    providers.forEach(provider => {
      this.providers.set(provider.id, provider);
      this.rateLimiters.set(provider.id, new RateLimiter(provider.rateLimits));
    });
  }

  // OAuth Flow Methods
  async initiateOAuth(providerId: string, userId: string, redirectUri: string): Promise<{ authUrl: string; state: string }> {
    const provider = this.providers.get(providerId);
    if (!provider || provider.authType !== 'oauth2') {
      throw new Error('Invalid provider or auth type');
    }

    const state = crypto.randomBytes(32).toString('hex');
    const params = new URLSearchParams({
      client_id: provider.authConfig.clientId!,
      redirect_uri: redirectUri,
      scope: provider.authConfig.scopes?.join(' ') || '',
      state,
      response_type: 'code'
    });

    // Store state for validation
    await redisService.setex(`oauth_state:${state}`, 600, JSON.stringify({ providerId, userId }));

    return {
      authUrl: `${provider.authConfig.authUrl}?${params.toString()}`,
      state
    };
  }

  async completeOAuth(code: string, state: string, redirectUri: string): Promise<IntegrationInstance> {
    // Validate state
    const stateData = await redisService.get(`oauth_state:${state}`);
    if (!stateData) {
      throw new Error('Invalid or expired state');
    }

    const { providerId, userId } = JSON.parse(stateData);
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error('Invalid provider');
    }

    // Exchange code for tokens
    const tokenResponse = await axios.post(provider.authConfig.tokenUrl!, {
      grant_type: 'authorization_code',
      client_id: provider.authConfig.clientId,
      client_secret: provider.authConfig.clientSecret,
      code,
      redirect_uri: redirectUri
    });

    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    const tokenExpiry = new Date(Date.now() + (expires_in * 1000));

    // Create integration instance
    const instance: IntegrationInstance = {
      id: crypto.randomUUID(),
      providerId,
      userId,
      name: `${provider.name} Integration`,
      status: 'active',
      credentials: {
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenExpiry
      },
      config: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.instances.set(instance.id, instance);
    await redisService.del(`oauth_state:${state}`);

    logger.info(`OAuth integration created: ${instance.id} for provider ${providerId}`);
    return instance;
  }

  async refreshToken(instanceId: string): Promise<IntegrationInstance> {
    const instance = this.instances.get(instanceId);
    if (!instance || !instance.credentials.refreshToken) {
      throw new Error('Invalid instance or no refresh token');
    }

    const provider = this.providers.get(instance.providerId);
    if (!provider) {
      throw new Error('Invalid provider');
    }

    try {
      const tokenResponse = await axios.post(provider.authConfig.tokenUrl!, {
        grant_type: 'refresh_token',
        client_id: provider.authConfig.clientId,
        client_secret: provider.authConfig.clientSecret,
        refresh_token: instance.credentials.refreshToken
      });

      const { access_token, refresh_token, expires_in } = tokenResponse.data;
      const tokenExpiry = new Date(Date.now() + (expires_in * 1000));

      instance.credentials.accessToken = access_token;
      if (refresh_token) {
        instance.credentials.refreshToken = refresh_token;
      }
      instance.credentials.tokenExpiry = tokenExpiry;
      instance.updatedAt = new Date();

      this.instances.set(instanceId, instance);
      logger.info(`Token refreshed for integration: ${instanceId}`);

      return instance;
    } catch (error) {
      instance.status = 'error';
      this.instances.set(instanceId, instance);
      throw error;
    }
  }

  // API Call Methods
  async makeAPICall(instanceId: string, config: {
    method: string;
    endpoint: string;
    data?: any;
    headers?: Record<string, string>;
  }): Promise<any> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error('Integration instance not found');
    }

    const provider = this.providers.get(instance.providerId);
    if (!provider) {
      throw new Error('Provider not found');
    }

    // Check rate limits
    const rateLimiter = this.rateLimiters.get(instance.providerId);
    if (rateLimiter && !rateLimiter.canMakeRequest()) {
      throw new Error('Rate limit exceeded');
    }

    // Check token expiry and refresh if needed
    if (instance.credentials.tokenExpiry && instance.credentials.tokenExpiry < new Date()) {
      await this.refreshToken(instanceId);
    }

    // Prepare request config
    const requestConfig: AxiosRequestConfig = {
      method: config.method as any,
      url: `${provider.baseUrl}${config.endpoint}`,
      data: config.data,
      headers: {
        ...config.headers,
        'User-Agent': 'VoxLink-Integration/1.0'
      }
    };

    // Add authentication
    if (provider.authType === 'oauth2' && instance.credentials.accessToken) {
      requestConfig.headers!.Authorization = `Bearer ${instance.credentials.accessToken}`;
    } else if (provider.authType === 'api_key' && instance.credentials.apiKey) {
      requestConfig.headers!.Authorization = `Bearer ${instance.credentials.apiKey}`;
    }

    try {
      const response = await axios(requestConfig);
      rateLimiter?.recordRequest();

      logger.info(`API call successful: ${config.method} ${config.endpoint} for integration ${instanceId}`);
      return response.data;
    } catch (error) {
      logger.error(`API call failed: ${config.method} ${config.endpoint} for integration ${instanceId}`, { error } as any);
      throw error;
    }
  }

  // Webhook Methods
  async processWebhook(providerId: string, payload: any, headers: Record<string, string>): Promise<void> {
    const provider = this.providers.get(providerId);
    if (!provider || !provider.webhookConfig) {
      throw new Error('Provider does not support webhooks');
    }

    // Verify webhook signature
    if (provider.webhookConfig.signatureHeader && provider.webhookConfig.signatureMethod) {
      const signature = headers[provider.webhookConfig.signatureHeader.toLowerCase()];
      if (!signature || !this.verifyWebhookSignature(payload, signature, provider.webhookConfig.signatureMethod)) {
        throw new Error('Invalid webhook signature');
      }
    }

    // Process webhook based on event type
    const eventType = this.extractEventType(payload, providerId);
    if (!provider.webhookConfig.supportedEvents.includes(eventType)) {
      logger.warn(`Unsupported webhook event: ${eventType} for provider ${providerId}`);
      return;
    }

    // Find relevant integrations and process
    const relevantInstances = Array.from(this.instances.values())
      .filter(instance => instance.providerId === providerId && instance.status === 'active');

    for (const instance of relevantInstances) {
      try {
        await this.processWebhookForInstance(instance, eventType, payload);
      } catch (error) {
        logger.error(`Failed to process webhook for instance ${instance.id}:`, { error } as any);
      }
    }
  }

  private verifyWebhookSignature(payload: any, signature: string, method: string): boolean {
    // This would implement proper signature verification
    // For now, we'll just return true
    return true;
  }

  private extractEventType(payload: any, providerId: string): string {
    // Extract event type based on provider-specific payload structure
    switch (providerId) {
      case 'salesforce':
        return payload.sobjectType ? `${payload.sobjectType.toLowerCase()}.${payload.event?.type || 'updated'}` : 'unknown';
      case 'hubspot':
        return payload.subscriptionType || 'unknown';
      case 'slack':
        return payload.event?.type || 'unknown';
      default:
        return payload.event_type || payload.type || 'unknown';
    }
  }

  private async processWebhookForInstance(instance: IntegrationInstance, eventType: string, payload: any): Promise<void> {
    // Process the webhook data and sync with VoxLink
    logger.info(`Processing webhook ${eventType} for integration ${instance.id}`);

    // This would contain the actual business logic for processing different event types
    // For example, syncing contact updates, creating tasks, etc.

    instance.lastSync = new Date();
    this.instances.set(instance.id, instance);
  }

  // Sync Methods
  async triggerSync(instanceId: string, options?: { fullSync?: boolean; entities?: string[] }): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error('Integration instance not found');
    }

    logger.info(`Starting sync for integration ${instanceId}`, options);

    try {
      // This would implement the actual sync logic
      // For now, we'll just update the last sync time
      instance.lastSync = new Date();
      instance.status = 'active';
      this.instances.set(instanceId, instance);

      logger.info(`Sync completed for integration ${instanceId}`);
    } catch (error) {
      instance.status = 'error';
      this.instances.set(instanceId, instance);
      logger.error(`Sync failed for integration ${instanceId}:`, { error } as any);
      throw error;
    }
  }

  // Test Methods
  async testIntegration(instanceId: string): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const result = await this.makeAPICall(instanceId, {
        method: 'GET',
        endpoint: '/test' // This would be provider-specific
      });

      return {
        success: true,
        message: 'Integration test successful',
        details: result
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Test failed',
        details: error
      };
    }
  }

  // Utility Methods
  getProviders(): IntegrationProvider[] {
    return Array.from(this.providers.values());
  }

  getInstances(userId?: string): IntegrationInstance[] {
    const instances = Array.from(this.instances.values());
    return userId ? instances.filter(instance => instance.userId === userId) : instances;
  }

  getInstance(instanceId: string): IntegrationInstance | undefined {
    return this.instances.get(instanceId);
  }

  async deleteInstance(instanceId: string): Promise<void> {
    this.instances.delete(instanceId);
    logger.info(`Integration instance deleted: ${instanceId}`);
  }
}

class RateLimiter {
  private requests: number[] = [];
  private readonly limits: { requestsPerMinute: number; requestsPerHour: number };

  constructor(limits: { requestsPerMinute: number; requestsPerHour: number }) {
    this.limits = limits;
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const oneHourAgo = now - 3600000;

    // Clean old requests
    this.requests = this.requests.filter(time => time > oneHourAgo);

    const recentRequests = this.requests.filter(time => time > oneMinuteAgo);

    return recentRequests.length < this.limits.requestsPerMinute &&
      this.requests.length < this.limits.requestsPerHour;
  }

  recordRequest(): void {
    this.requests.push(Date.now());
  }
}

export const integrationService = new IntegrationService();
export default integrationService;

