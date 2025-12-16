import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { safeStorage } from '../utils/storage';
import { 
  Integration, 
  IntegrationTemplate, 
  IntegrationLog, 
  SyncResult, 
  WebhookEvent,
  IntegrationCredentials,
  AuthType,
  RetryPolicy,
  IntegrationStats
} from '@voxlink/shared/types/integrations';

class IntegrationService {
  private api: AxiosInstance;
  private retryQueue: Map<string, RetryItem> = new Map();

  constructor() {
    this.api = axios.create({
      baseURL: '/api/v1/integrations',
      timeout: 30000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor for authentication
    this.api.interceptors.request.use(
      (config) => {
        const token = safeStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Handle token refresh or redirect to login
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Integration Management
  async getIntegrations(): Promise<Integration[]> {
    const response = await this.api.get('/');
    return response.data;
  }

  async getIntegration(id: string): Promise<Integration> {
    const response = await this.api.get(`/${id}`);
    return response.data;
  }

  async createIntegration(integration: Partial<Integration>): Promise<Integration> {
    const response = await this.api.post('/', integration);
    return response.data;
  }

  async updateIntegration(id: string, updates: Partial<Integration>): Promise<Integration> {
    const response = await this.api.put(`/${id}`, updates);
    return response.data;
  }

  async deleteIntegration(id: string): Promise<void> {
    await this.api.delete(`/${id}`);
  }

  async testIntegration(id: string): Promise<{ success: boolean; message: string; details?: any }> {
    const response = await this.api.post(`/${id}/test`);
    return response.data;
  }

  // Integration Templates
  async getIntegrationTemplates(): Promise<IntegrationTemplate[]> {
    const response = await this.api.get('/templates');
    return response.data;
  }

  async getIntegrationTemplate(id: string): Promise<IntegrationTemplate> {
    const response = await this.api.get(`/templates/${id}`);
    return response.data;
  }

  async createFromTemplate(templateId: string, config: any): Promise<Integration> {
    const response = await this.api.post(`/templates/${templateId}/create`, config);
    return response.data;
  }

  // OAuth Flow
  async initiateOAuth(integrationId: string, provider: string): Promise<{ authUrl: string; state: string }> {
    const response = await this.api.post(`/${integrationId}/oauth/initiate`, { provider });
    return response.data;
  }

  async completeOAuth(integrationId: string, code: string, state: string): Promise<Integration> {
    const response = await this.api.post(`/${integrationId}/oauth/complete`, { code, state });
    return response.data;
  }

  async refreshOAuthToken(integrationId: string): Promise<Integration> {
    const response = await this.api.post(`/${integrationId}/oauth/refresh`);
    return response.data;
  }

  // API Key Management
  async updateApiKey(integrationId: string, apiKey: string): Promise<Integration> {
    const response = await this.api.put(`/${integrationId}/credentials`, { 
      authType: 'api_key',
      apiKey 
    });
    return response.data;
  }

  async updateCredentials(integrationId: string, credentials: Partial<IntegrationCredentials>): Promise<Integration> {
    const response = await this.api.put(`/${integrationId}/credentials`, credentials);
    return response.data;
  }

  // Sync Operations
  async triggerSync(integrationId: string, options?: { fullSync?: boolean; entities?: string[] }): Promise<SyncResult> {
    const response = await this.api.post(`/${integrationId}/sync`, options);
    return response.data;
  }

  async getSyncHistory(integrationId: string, limit = 50): Promise<SyncResult[]> {
    const response = await this.api.get(`/${integrationId}/sync/history`, { params: { limit } });
    return response.data;
  }

  async getSyncStatus(integrationId: string): Promise<{ isRunning: boolean; progress?: number; eta?: Date }> {
    const response = await this.api.get(`/${integrationId}/sync/status`);
    return response.data;
  }

  // Webhook Management
  async getWebhooks(integrationId: string): Promise<WebhookEvent[]> {
    const response = await this.api.get(`/${integrationId}/webhooks`);
    return response.data;
  }

  async createWebhook(integrationId: string, webhook: { url: string; events: string[]; secret?: string }): Promise<void> {
    await this.api.post(`/${integrationId}/webhooks`, webhook);
  }

  async updateWebhook(integrationId: string, webhookId: string, updates: any): Promise<void> {
    await this.api.put(`/${integrationId}/webhooks/${webhookId}`, updates);
  }

  async deleteWebhook(integrationId: string, webhookId: string): Promise<void> {
    await this.api.delete(`/${integrationId}/webhooks/${webhookId}`);
  }

  async testWebhook(integrationId: string, webhookId: string): Promise<{ success: boolean; response: any }> {
    const response = await this.api.post(`/${integrationId}/webhooks/${webhookId}/test`);
    return response.data;
  }

  // Logs and Monitoring
  async getIntegrationLogs(integrationId: string, options?: {
    type?: string;
    status?: string;
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<IntegrationLog[]> {
    const response = await this.api.get(`/${integrationId}/logs`, { params: options });
    return response.data;
  }

  async getIntegrationStats(integrationId?: string): Promise<IntegrationStats> {
    const url = integrationId ? `/${integrationId}/stats` : '/stats';
    const response = await this.api.get(url);
    return response.data;
  }

  // Field Mapping
  async getFieldMappings(integrationId: string): Promise<any> {
    const response = await this.api.get(`/${integrationId}/field-mappings`);
    return response.data;
  }

  async updateFieldMappings(integrationId: string, mappings: any): Promise<void> {
    await this.api.put(`/${integrationId}/field-mappings`, mappings);
  }

  // Custom API Calls
  async makeCustomAPICall(integrationId: string, config: {
    method: string;
    endpoint: string;
    data?: any;
    headers?: Record<string, string>;
  }): Promise<any> {
    const response = await this.api.post(`/${integrationId}/api-call`, config);
    return response.data;
  }

  // Error Handling and Retry Logic
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    retryPolicy: RetryPolicy,
    context: string
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= retryPolicy.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === retryPolicy.maxRetries) {
          break;
        }

        // Check if error is retryable
        if (retryPolicy.retryableErrors && !this.isRetryableError(error, retryPolicy.retryableErrors)) {
          break;
        }

        // Calculate delay
        const delay = this.calculateDelay(attempt, retryPolicy);
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  private isRetryableError(error: any, retryableErrors: string[]): boolean {
    const errorCode = error.response?.status?.toString() || error.code || 'unknown';
    return retryableErrors.includes(errorCode);
  }

  private calculateDelay(attempt: number, policy: RetryPolicy): number {
    let delay: number;
    
    switch (policy.backoffStrategy) {
      case 'linear':
        delay = policy.initialDelay * (attempt + 1);
        break;
      case 'exponential':
        delay = policy.initialDelay * Math.pow(2, attempt);
        break;
      case 'fixed':
      default:
        delay = policy.initialDelay;
        break;
    }

    return Math.min(delay, policy.maxDelay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Encryption helpers for sensitive data
  private encryptCredentials(credentials: IntegrationCredentials): IntegrationCredentials {
    // In a real implementation, this would use proper encryption
    // For now, we'll just return the credentials as-is
    return credentials;
  }

  private decryptCredentials(credentials: IntegrationCredentials): IntegrationCredentials {
    // In a real implementation, this would decrypt the credentials
    return credentials;
  }

  // Validation helpers
  validateIntegrationConfig(config: any, template: IntegrationTemplate): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required fields
    template.requiredFields.forEach(field => {
      if (!config[field]) {
        errors.push(`Required field '${field}' is missing`);
      }
    });

    // Validate field types and formats
    // This would include more sophisticated validation in a real implementation

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Utility methods
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    try {
      const response = await this.api.get('/health');
      return response.data;
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }
}

interface RetryItem {
  operation: () => Promise<any>;
  retryPolicy: RetryPolicy;
  attempts: number;
  nextRetry: Date;
}

export const integrationService = new IntegrationService();
export default integrationService;