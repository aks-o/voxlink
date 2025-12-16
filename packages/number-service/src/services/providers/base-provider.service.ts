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
import { logger } from '../../utils/logger';

export abstract class BaseTelecomProvider {
  protected provider: TelecomProvider;
  protected metrics: ProviderMetrics;

  constructor(provider: TelecomProvider) {
    this.provider = provider;
    this.metrics = {
      providerId: provider.id,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      errorRate: 0,
      uptime: 100,
    };
  }

  // Add getter method for provider
  getProvider(): TelecomProvider {
    return this.provider;
  }

  // Abstract methods that must be implemented by each provider
  abstract searchNumbers(request: NumberSearchRequest): Promise<NumberSearchResponse>;
  abstract reserveNumber(request: NumberReservationRequest): Promise<NumberReservationResponse>;
  abstract purchaseNumber(request: NumberPurchaseRequest): Promise<NumberPurchaseResponse>;
  abstract portNumber(request: PortingRequest): Promise<PortingResponse>;
  abstract checkNumberAvailability(phoneNumber: string): Promise<boolean>;
  abstract releaseReservation(reservationId: string): Promise<boolean>;

  // Common functionality
  async healthCheck(): Promise<boolean> {
    const startTime = Date.now();

    try {
      // Perform a lightweight health check (e.g., ping endpoint)
      const response = await this.performHealthCheck();
      const responseTime = Date.now() - startTime;

      this.updateHealthMetrics(true, responseTime);
      return response;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateHealthMetrics(false, responseTime);
      logger.error(`Health check failed for provider ${this.provider.id}`, { error });
      return false;
    }
  }

  protected abstract performHealthCheck(): Promise<boolean>;

  protected async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    options?: {
      timeout?: number;
      retries?: number;
      headers?: Record<string, string>;
    }
  ): Promise<T> {
    const startTime = Date.now();
    const requestOptions = {
      timeout: options?.timeout || this.provider.config.timeout,
      retries: options?.retries || this.provider.config.retryAttempts,
      ...options,
    };

    this.metrics.totalRequests++;

    try {
      const response = await this.executeRequest<T>(method, endpoint, data, requestOptions);

      const responseTime = Date.now() - startTime;
      this.updateMetrics(true, responseTime);

      return response;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(false, responseTime);

      const providerError: ProviderError = {
        code: this.extractErrorCode(error),
        message: this.extractErrorMessage(error),
        details: this.extractErrorDetails(error),
        retryable: this.isRetryableError(error),
        provider: this.provider.id,
      };

      logger.error(`Provider request failed: ${this.provider.id}`, {
        method,
        endpoint,
        error: providerError,
        responseTime,
      });

      throw providerError;
    }
  }

  protected abstract executeRequest<T>(
    method: string,
    endpoint: string,
    data?: any,
    options?: any
  ): Promise<T>;

  protected formatPhoneNumber(phoneNumber: string, format: 'e164' | 'national' | 'international'): string {
    // Remove all non-digit characters
    const digits = phoneNumber.replace(/\D/g, '');

    switch (format) {
      case 'e164':
        return digits.startsWith('1') ? `+${digits}` : `+1${digits}`;
      case 'national':
        if (digits.length === 11 && digits.startsWith('1')) {
          return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
        } else if (digits.length === 10) {
          return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
        }
        return phoneNumber;
      case 'international':
        if (digits.startsWith('1')) {
          return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
        }
        return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
      default:
        return phoneNumber;
    }
  }

  protected validateRequest(request: any, requiredFields: string[]): void {
    for (const field of requiredFields) {
      if (!request[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
  }

  protected extractErrorCode(error: any): string {
    if (error.response?.data?.error?.code) {
      return error.response.data.error.code;
    }
    if (error.code) {
      return error.code;
    }
    if (error.status) {
      return `HTTP_${error.status}`;
    }
    return 'UNKNOWN_ERROR';
  }

  protected extractErrorMessage(error: any): string {
    if (error.response?.data?.error?.message) {
      return error.response.data.error.message;
    }
    if (error.message) {
      return error.message;
    }
    return 'Unknown error occurred';
  }

  protected extractErrorDetails(error: any): Record<string, any> {
    return {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers,
    };
  }

  protected isRetryableError(error: any): boolean {
    const retryableCodes = ['TIMEOUT', 'NETWORK_ERROR', 'RATE_LIMITED'];
    const retryableHttpCodes = [429, 500, 502, 503, 504];

    const errorCode = this.extractErrorCode(error);
    const httpStatus = error.response?.status;

    return retryableCodes.includes(errorCode) ||
      (httpStatus && retryableHttpCodes.includes(httpStatus));
  }

  protected updateMetrics(success: boolean, responseTime: number): void {
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    // Update average response time
    const totalRequests = this.metrics.successfulRequests + this.metrics.failedRequests;
    this.metrics.averageResponseTime =
      (this.metrics.averageResponseTime * (totalRequests - 1) + responseTime) / totalRequests;

    // Update error rate
    this.metrics.errorRate = (this.metrics.failedRequests / this.metrics.totalRequests) * 100;

    if (!success) {
      this.metrics.lastError = {
        code: 'REQUEST_FAILED',
        message: 'Request failed',
        retryable: true,
        provider: this.provider.id,
      };
    } else {
      this.metrics.lastSuccessfulRequest = new Date();
    }
  }

  protected updateHealthMetrics(healthy: boolean, responseTime: number): void {
    this.provider.healthCheck.lastCheck = new Date();
    this.provider.healthCheck.responseTime = responseTime;

    if (healthy) {
      this.provider.healthCheck.status = 'healthy';
      // Improve uptime slightly
      this.provider.healthCheck.uptime = Math.min(100, this.provider.healthCheck.uptime + 0.1);
    } else {
      this.provider.healthCheck.status = 'unhealthy';
      // Decrease uptime
      this.provider.healthCheck.uptime = Math.max(0, this.provider.healthCheck.uptime - 1);
    }
  }

  getMetrics(): ProviderMetrics {
    return { ...this.metrics };
  }

  isHealthy(): boolean {
    return this.provider.healthCheck.status === 'healthy' &&
      this.provider.healthCheck.uptime > 80;
  }

  supportsFeature(feature: string, region?: string): boolean {
    const capability = this.provider.capabilities.find(cap => cap.feature === feature);
    if (!capability || !capability.supported) {
      return false;
    }

    if (region && capability.regions.length > 0) {
      return capability.regions.includes(region);
    }

    return true;
  }

  supportsRegion(region: string): boolean {
    return this.provider.regions.includes(region) || this.provider.regions.includes('*');
  }
}

