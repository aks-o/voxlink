import { Integration, IntegrationTemplate, IntegrationLog, SyncResult, WebhookEvent, IntegrationCredentials, IntegrationStats } from '@voxlink/shared/types/integrations';
declare class IntegrationService {
    private api;
    private retryQueue;
    constructor();
    private setupInterceptors;
    getIntegrations(): Promise<Integration[]>;
    getIntegration(id: string): Promise<Integration>;
    createIntegration(integration: Partial<Integration>): Promise<Integration>;
    updateIntegration(id: string, updates: Partial<Integration>): Promise<Integration>;
    deleteIntegration(id: string): Promise<void>;
    testIntegration(id: string): Promise<{
        success: boolean;
        message: string;
        details?: any;
    }>;
    getIntegrationTemplates(): Promise<IntegrationTemplate[]>;
    getIntegrationTemplate(id: string): Promise<IntegrationTemplate>;
    createFromTemplate(templateId: string, config: any): Promise<Integration>;
    initiateOAuth(integrationId: string, provider: string): Promise<{
        authUrl: string;
        state: string;
    }>;
    completeOAuth(integrationId: string, code: string, state: string): Promise<Integration>;
    refreshOAuthToken(integrationId: string): Promise<Integration>;
    updateApiKey(integrationId: string, apiKey: string): Promise<Integration>;
    updateCredentials(integrationId: string, credentials: Partial<IntegrationCredentials>): Promise<Integration>;
    triggerSync(integrationId: string, options?: {
        fullSync?: boolean;
        entities?: string[];
    }): Promise<SyncResult>;
    getSyncHistory(integrationId: string, limit?: number): Promise<SyncResult[]>;
    getSyncStatus(integrationId: string): Promise<{
        isRunning: boolean;
        progress?: number;
        eta?: Date;
    }>;
    getWebhooks(integrationId: string): Promise<WebhookEvent[]>;
    createWebhook(integrationId: string, webhook: {
        url: string;
        events: string[];
        secret?: string;
    }): Promise<void>;
    updateWebhook(integrationId: string, webhookId: string, updates: any): Promise<void>;
    deleteWebhook(integrationId: string, webhookId: string): Promise<void>;
    testWebhook(integrationId: string, webhookId: string): Promise<{
        success: boolean;
        response: any;
    }>;
    getIntegrationLogs(integrationId: string, options?: {
        type?: string;
        status?: string;
        limit?: number;
        offset?: number;
        startDate?: Date;
        endDate?: Date;
    }): Promise<IntegrationLog[]>;
    getIntegrationStats(integrationId?: string): Promise<IntegrationStats>;
    getFieldMappings(integrationId: string): Promise<any>;
    updateFieldMappings(integrationId: string, mappings: any): Promise<void>;
    makeCustomAPICall(integrationId: string, config: {
        method: string;
        endpoint: string;
        data?: any;
        headers?: Record<string, string>;
    }): Promise<any>;
    private executeWithRetry;
    private isRetryableError;
    private calculateDelay;
    private sleep;
    private encryptCredentials;
    private decryptCredentials;
    validateIntegrationConfig(config: any, template: IntegrationTemplate): {
        isValid: boolean;
        errors: string[];
    };
    healthCheck(): Promise<{
        status: 'healthy' | 'unhealthy';
        details: any;
    }>;
}
export declare const integrationService: IntegrationService;
export default integrationService;
