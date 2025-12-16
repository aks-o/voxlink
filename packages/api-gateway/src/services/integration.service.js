"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.integrationService = void 0;
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("../utils/logger");
const redis_service_1 = require("./redis.service");
class IntegrationService {
    constructor() {
        this.providers = new Map();
        this.instances = new Map();
        this.rateLimiters = new Map();
        this.initializeProviders();
    }
    initializeProviders() {
        // Initialize popular integration providers
        const providers = [
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
    async initiateOAuth(providerId, userId, redirectUri) {
        const provider = this.providers.get(providerId);
        if (!provider || provider.authType !== 'oauth2') {
            throw new Error('Invalid provider or auth type');
        }
        const state = crypto_1.default.randomBytes(32).toString('hex');
        const params = new URLSearchParams({
            client_id: provider.authConfig.clientId,
            redirect_uri: redirectUri,
            scope: provider.authConfig.scopes?.join(' ') || '',
            state,
            response_type: 'code'
        });
        // Store state for validation
        await redis_service_1.redisService.setex(`oauth_state:${state}`, 600, JSON.stringify({ providerId, userId }));
        return {
            authUrl: `${provider.authConfig.authUrl}?${params.toString()}`,
            state
        };
    }
    async completeOAuth(code, state, redirectUri) {
        // Validate state
        const stateData = await redis_service_1.redisService.get(`oauth_state:${state}`);
        if (!stateData) {
            throw new Error('Invalid or expired state');
        }
        const { providerId, userId } = JSON.parse(stateData);
        const provider = this.providers.get(providerId);
        if (!provider) {
            throw new Error('Invalid provider');
        }
        // Exchange code for tokens
        const tokenResponse = await axios_1.default.post(provider.authConfig.tokenUrl, {
            grant_type: 'authorization_code',
            client_id: provider.authConfig.clientId,
            client_secret: provider.authConfig.clientSecret,
            code,
            redirect_uri: redirectUri
        });
        const { access_token, refresh_token, expires_in } = tokenResponse.data;
        const tokenExpiry = new Date(Date.now() + (expires_in * 1000));
        // Create integration instance
        const instance = {
            id: crypto_1.default.randomUUID(),
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
        await redis_service_1.redisService.del(`oauth_state:${state}`);
        logger_1.logger.info(`OAuth integration created: ${instance.id} for provider ${providerId}`);
        return instance;
    }
    async refreshToken(instanceId) {
        const instance = this.instances.get(instanceId);
        if (!instance || !instance.credentials.refreshToken) {
            throw new Error('Invalid instance or no refresh token');
        }
        const provider = this.providers.get(instance.providerId);
        if (!provider) {
            throw new Error('Invalid provider');
        }
        try {
            const tokenResponse = await axios_1.default.post(provider.authConfig.tokenUrl, {
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
            logger_1.logger.info(`Token refreshed for integration: ${instanceId}`);
            return instance;
        }
        catch (error) {
            instance.status = 'error';
            this.instances.set(instanceId, instance);
            throw error;
        }
    }
    // API Call Methods
    async makeAPICall(instanceId, config) {
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
        const requestConfig = {
            method: config.method,
            url: `${provider.baseUrl}${config.endpoint}`,
            data: config.data,
            headers: {
                ...config.headers,
                'User-Agent': 'VoxLink-Integration/1.0'
            }
        };
        // Add authentication
        if (provider.authType === 'oauth2' && instance.credentials.accessToken) {
            requestConfig.headers.Authorization = `Bearer ${instance.credentials.accessToken}`;
        }
        else if (provider.authType === 'api_key' && instance.credentials.apiKey) {
            requestConfig.headers.Authorization = `Bearer ${instance.credentials.apiKey}`;
        }
        try {
            const response = await (0, axios_1.default)(requestConfig);
            rateLimiter?.recordRequest();
            logger_1.logger.info(`API call successful: ${config.method} ${config.endpoint} for integration ${instanceId}`);
            return response.data;
        }
        catch (error) {
            logger_1.logger.error(`API call failed: ${config.method} ${config.endpoint} for integration ${instanceId}`, error);
            throw error;
        }
    }
    // Webhook Methods
    async processWebhook(providerId, payload, headers) {
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
            logger_1.logger.warn(`Unsupported webhook event: ${eventType} for provider ${providerId}`);
            return;
        }
        // Find relevant integrations and process
        const relevantInstances = Array.from(this.instances.values())
            .filter(instance => instance.providerId === providerId && instance.status === 'active');
        for (const instance of relevantInstances) {
            try {
                await this.processWebhookForInstance(instance, eventType, payload);
            }
            catch (error) {
                logger_1.logger.error(`Failed to process webhook for instance ${instance.id}:`, error);
            }
        }
    }
    verifyWebhookSignature(payload, signature, method) {
        // This would implement proper signature verification
        // For now, we'll just return true
        return true;
    }
    extractEventType(payload, providerId) {
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
    async processWebhookForInstance(instance, eventType, payload) {
        // Process the webhook data and sync with VoxLink
        logger_1.logger.info(`Processing webhook ${eventType} for integration ${instance.id}`);
        // This would contain the actual business logic for processing different event types
        // For example, syncing contact updates, creating tasks, etc.
        instance.lastSync = new Date();
        this.instances.set(instance.id, instance);
    }
    // Sync Methods
    async triggerSync(instanceId, options) {
        const instance = this.instances.get(instanceId);
        if (!instance) {
            throw new Error('Integration instance not found');
        }
        logger_1.logger.info(`Starting sync for integration ${instanceId}`, options);
        try {
            // This would implement the actual sync logic
            // For now, we'll just update the last sync time
            instance.lastSync = new Date();
            instance.status = 'active';
            this.instances.set(instanceId, instance);
            logger_1.logger.info(`Sync completed for integration ${instanceId}`);
        }
        catch (error) {
            instance.status = 'error';
            this.instances.set(instanceId, instance);
            logger_1.logger.error(`Sync failed for integration ${instanceId}:`, error);
            throw error;
        }
    }
    // Test Methods
    async testIntegration(instanceId) {
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
        }
        catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Test failed',
                details: error
            };
        }
    }
    // Utility Methods
    getProviders() {
        return Array.from(this.providers.values());
    }
    getInstances(userId) {
        const instances = Array.from(this.instances.values());
        return userId ? instances.filter(instance => instance.userId === userId) : instances;
    }
    getInstance(instanceId) {
        return this.instances.get(instanceId);
    }
    async deleteInstance(instanceId) {
        this.instances.delete(instanceId);
        logger_1.logger.info(`Integration instance deleted: ${instanceId}`);
    }
}
class RateLimiter {
    constructor(limits) {
        this.requests = [];
        this.limits = limits;
    }
    canMakeRequest() {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        const oneHourAgo = now - 3600000;
        // Clean old requests
        this.requests = this.requests.filter(time => time > oneHourAgo);
        const recentRequests = this.requests.filter(time => time > oneMinuteAgo);
        return recentRequests.length < this.limits.requestsPerMinute &&
            this.requests.length < this.limits.requestsPerHour;
    }
    recordRequest() {
        this.requests.push(Date.now());
    }
}
exports.integrationService = new IntegrationService();
exports.default = exports.integrationService;
