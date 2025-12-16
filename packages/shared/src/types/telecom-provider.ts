export interface TelecomProvider {
  id: string;
  name: string;
  type: 'primary' | 'secondary' | 'fallback';
  priority: number;
  enabled: boolean;
  regions: string[];
  capabilities: ProviderCapability[];
  config: ProviderConfig;
  healthCheck: ProviderHealthCheck;
}

export interface ProviderConfig {
  apiUrl: string;
  apiKey: string;
  apiSecret?: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  rateLimits: {
    requestsPerSecond: number;
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  authentication: {
    type: 'api_key' | 'oauth' | 'basic' | 'bearer';
    credentials: Record<string, string>;
  };
}

export interface ProviderCapability {
  feature: 'number_search' | 'number_purchase' | 'number_porting' | 'sms' | 'voice' | 'mms' | 'fax';
  supported: boolean;
  regions: string[];
  limitations?: string[];
}

export interface ProviderHealthCheck {
  lastCheck: Date;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  errorRate: number;
  uptime: number;
}

export interface NumberSearchRequest {
  countryCode: string;
  areaCode?: string;
  city?: string;
  region?: string;
  pattern?: string;
  features?: string[];
  limit?: number;
  maxMonthlyRate?: number;
  maxSetupFee?: number;
  provider?: string;
}

export interface NumberSearchResponse {
  numbers: ProviderNumber[];
  totalCount: number;
  searchId: string;
  provider: string;
  responseTime: number;
  cached: boolean;
}

export interface ProviderNumber {
  phoneNumber: string;
  countryCode: string;
  areaCode: string;
  city: string;
  region: string;
  monthlyRate: number;
  setupFee: number;
  features: string[];
  provider: string;
  providerId: string;
  metadata?: Record<string, any>;
}

export interface NumberReservationRequest {
  phoneNumber: string;
  providerId: string;
  reservationDuration: number; // in minutes
  customerInfo?: {
    name: string;
    email: string;
    businessName?: string;
  };
}

export interface NumberReservationResponse {
  reservationId: string;
  phoneNumber: string;
  provider: string;
  expiresAt: Date;
  status: 'reserved' | 'expired' | 'cancelled';
}

export interface NumberPurchaseRequest {
  reservationId: string;
  phoneNumber: string;
  providerId: string;
  customerInfo: {
    name: string;
    email: string;
    address: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    businessName?: string;
    businessType?: string;
  };
  billingInfo?: {
    paymentMethodId: string;
    billingAddress?: any;
  };
}

export interface NumberPurchaseResponse {
  purchaseId: string;
  phoneNumber: string;
  provider: string;
  status: 'purchased' | 'pending' | 'failed';
  activationDate?: Date;
  monthlyRate: number;
  setupFee: number;
  features: string[];
}

export interface PortingRequest {
  phoneNumber: string;
  currentProvider: string;
  accountNumber: string;
  pin: string;
  authorizedName: string;
  serviceAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  documents?: {
    billCopy?: string;
    authorizationLetter?: string;
  };
}

export interface PortingResponse {
  portingId: string;
  phoneNumber: string;
  status: 'submitted' | 'processing' | 'approved' | 'completed' | 'rejected';
  estimatedCompletion?: Date;
  rejectionReason?: string;
}

export interface ProviderError {
  code: string;
  message: string;
  details?: Record<string, any>;
  retryable: boolean;
  provider: string;
}

export interface ProviderMetrics {
  providerId: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  errorRate: number;
  uptime: number;
  lastError?: ProviderError;
  lastSuccessfulRequest?: Date;
}