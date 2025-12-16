export interface Integration {
  id: string;
  name: string;
  description: string;
  category: IntegrationCategory;
  provider: string;
  version: string;
  status: IntegrationStatus;
  config: IntegrationConfig;
  credentials: IntegrationCredentials;
  webhooks: WebhookConfig[];
  lastSync: Date | null;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export type IntegrationCategory = 
  | 'crm'
  | 'marketing'
  | 'analytics'
  | 'communication'
  | 'productivity'
  | 'storage'
  | 'payment'
  | 'ai'
  | 'custom';

export type IntegrationStatus = 
  | 'active'
  | 'inactive'
  | 'error'
  | 'pending'
  | 'syncing'
  | 'disconnected';

export type AuthType = 
  | 'oauth2'
  | 'api_key'
  | 'basic'
  | 'bearer'
  | 'custom';

export interface IntegrationConfig {
  authType: AuthType;
  baseUrl?: string;
  apiVersion?: string;
  rateLimits?: RateLimit;
  syncInterval?: number; // minutes
  retryPolicy?: RetryPolicy;
  fieldMappings?: FieldMapping[];
  customSettings?: Record<string, any>;
}

export interface IntegrationCredentials {
  authType: AuthType;
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  username?: string;
  password?: string;
  customAuth?: Record<string, any>;
}

export interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  secret?: string;
  isActive: boolean;
  headers?: Record<string, string>;
  retryPolicy?: RetryPolicy;
}

export interface RateLimit {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  burstLimit?: number;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
  initialDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  retryableErrors?: string[];
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transformation?: string;
  required: boolean;
}

export interface IntegrationTemplate {
  id: string;
  name: string;
  description: string;
  category: IntegrationCategory;
  provider: string;
  logoUrl: string;
  documentationUrl: string;
  isPopular: boolean;
  config: Partial<IntegrationConfig>;
  requiredFields: string[];
  optionalFields: string[];
  supportedFeatures: string[];
  webhookEvents: string[];
}

export interface IntegrationLog {
  id: string;
  integrationId: string;
  type: 'sync' | 'webhook' | 'api_call' | 'error' | 'auth';
  status: 'success' | 'error' | 'warning' | 'info';
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
  duration?: number; // milliseconds
}

export interface SyncResult {
  integrationId: string;
  status: 'success' | 'partial' | 'failed';
  recordsProcessed: number;
  recordsSucceeded: number;
  recordsFailed: number;
  errors: SyncError[];
  startTime: Date;
  endTime: Date;
  nextSyncTime?: Date;
}

export interface SyncError {
  recordId?: string;
  field?: string;
  error: string;
  code?: string;
  retryable: boolean;
}

export interface WebhookEvent {
  id: string;
  integrationId: string;
  event: string;
  payload: Record<string, any>;
  headers: Record<string, string>;
  timestamp: Date;
  processed: boolean;
  processingError?: string;
  retryCount: number;
}

export interface APIEndpoint {
  id: string;
  name: string;
  description: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  parameters: APIParameter[];
  requestBody?: APISchema;
  responseSchema: APISchema;
  authentication: AuthType[];
  rateLimit?: RateLimit;
  isPublic: boolean;
}

export interface APIParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description: string;
  example?: any;
  validation?: string;
}

export interface APISchema {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean';
  properties?: Record<string, APISchema>;
  items?: APISchema;
  required?: string[];
  example?: any;
}

export interface IntegrationStats {
  totalIntegrations: number;
  activeIntegrations: number;
  errorIntegrations: number;
  syncStats: {
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    averageSyncTime: number;
  };
  webhookStats: {
    totalWebhooks: number;
    successfulWebhooks: number;
    failedWebhooks: number;
    averageProcessingTime: number;
  };
  apiStats: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
  };
}