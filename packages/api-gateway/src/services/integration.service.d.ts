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
declare class IntegrationService {
    private providers;
    private instances;
    private rateLimiters;
    constructor();
    private initializeProviders;
    initiateOAuth(providerId: string, userId: string, redirectUri: string): Promise<{
        authUrl: string;
        state: string;
    }>;
    completeOAuth(code: string, state: string, redirectUri: string): Promise<IntegrationInstance>;
    refreshToken(instanceId: string): Promise<IntegrationInstance>;
    makeAPICall(instanceId: string, config: {
        method: string;
        endpoint: string;
        data?: any;
        headers?: Record<string, string>;
    }): Promise<any>;
    processWebhook(providerId: string, payload: any, headers: Record<string, string>): Promise<void>;
    private verifyWebhookSignature;
    private extractEventType;
    private processWebhookForInstance;
    triggerSync(instanceId: string, options?: {
        fullSync?: boolean;
        entities?: string[];
    }): Promise<void>;
    testIntegration(instanceId: string): Promise<{
        success: boolean;
        message: string;
        details?: any;
    }>;
    getProviders(): IntegrationProvider[];
    getInstances(userId?: string): IntegrationInstance[];
    getInstance(instanceId: string): IntegrationInstance | undefined;
    deleteInstance(instanceId: string): Promise<void>;
}
export declare const integrationService: IntegrationService;
export default integrationService;
