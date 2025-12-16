import axios, { AxiosInstance } from 'axios';
import {
  NumberSearchRequest,
  NumberSearchResponse,
  NumberReservationRequest,
  NumberReservationResponse,
  NumberPurchaseRequest,
  NumberPurchaseResponse,
  TelecomPortingRequest as PortingRequest,
  PortingResponse,
  TelecomProvider
} from '@voxlink/shared';
import { BaseTelecomProvider } from './base-provider.service';
import { logger } from '../../utils/logger';

export class VonageProviderService extends BaseTelecomProvider {
  private client: AxiosInstance;

  constructor(provider: TelecomProvider) {
    super(provider);
    
    this.client = axios.create({
      baseURL: 'https://rest.nexmo.com',
      timeout: this.provider.config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async searchNumbers(request: NumberSearchRequest): Promise<NumberSearchResponse> {
    this.validateRequest(request, ['countryCode']);

    try {
      const response = await this.client.get('/number/search', {
        params: {
          api_key: this.provider.config.apiKey,
          api_secret: this.provider.config.apiSecret,
          country: request.countryCode,
          features: request.features?.join(','),
          pattern: request.pattern,
          size: request.limit || 10
        }
      });

      return {
        provider: this.provider.id,
        numbers: response.data.numbers.map((n: any) => ({
          phoneNumber: n.msisdn,
          countryCode: n.country,
          monthlyRate: parseFloat(n.cost),
          setupFee: 0,
          features: n.features,
          region: n.region,
          provider: this.provider.id,
        })),
        totalCount: response.data.count,
        searchId: 'search_' + Date.now(),
        responseTime: 0,
        cached: false
      };
    } catch (error: any) {
      logger.error('Vonage search failed:', error);
      throw this.handleProviderError(error);
    }
  }

  async reserveNumber(request: NumberReservationRequest): Promise<NumberReservationResponse> {
    // Vonage doesn't strictly support reservation, so we simulate it or just check availability
    const available = await this.checkNumberAvailability(request.phoneNumber);
    
    if (!available) {
      throw new Error('Number is not available');
    }

    return {
      reservationId: 'res_' + Date.now(),
      phoneNumber: request.phoneNumber,
      expiresAt: new Date(Date.now() + 15 * 60000), // 15 mins
      status: 'reserved' as const,
      provider: this.provider.id,
    };
  }

  async purchaseNumber(request: NumberPurchaseRequest): Promise<NumberPurchaseResponse> {
    this.validateRequest(request, ['phoneNumber']);

    try {
      const response = await this.client.post('/number/buy', {
        api_key: this.provider.config.apiKey,
        api_secret: this.provider.config.apiSecret,
        msisdn: request.phoneNumber,
        country: request.phoneNumber.substring(0, 2) // Extract country from number
      });

      return {
        purchaseId: 'tx_' + Date.now(),
        phoneNumber: request.phoneNumber,
        status: 'purchased' as const,
        provider: this.provider.id,
        monthlyRate: 1.00,
        setupFee: 0,
        features: ['voice', 'sms'],
        activationDate: new Date(),
      };
    } catch (error: any) {
      logger.error('Vonage purchase failed:', error);
      throw this.handleProviderError(error);
    }
  }

  async portNumber(request: PortingRequest): Promise<PortingResponse> {
    return {
      portingId: 'port_' + Date.now(),
      phoneNumber: request.phoneNumber,
      status: 'submitted' as const,
      estimatedCompletion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };
  }

  async checkNumberAvailability(phoneNumber: string): Promise<boolean> {
    try {
      const response = await this.client.get('/number/search', {
        params: {
          api_key: this.provider.config.apiKey,
          api_secret: this.provider.config.apiSecret,
          pattern: phoneNumber,
        }
      });

      return response.data.numbers && response.data.numbers.length > 0;
    } catch (error: any) {
      logger.error('Vonage availability check failed:', error);
      return false;
    }
  }

  async releaseReservation(reservationId: string): Promise<boolean> {
    // Vonage doesn't support reservations, so this is a no-op
    return true;
  }

  protected async performHealthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/account/get-balance', {
        params: {
          api_key: this.provider.config.apiKey,
          api_secret: this.provider.config.apiSecret,
        }
      });
      return response.status === 200;
    } catch (error: any) {
      return false;
    }
  }

  protected async executeRequest<T>(
    method: string,
    endpoint: string,
    data?: any,
    options?: any
  ): Promise<T> {
    const config: any = {
      method,
      url: endpoint,
      ...options,
    };

    if (method === 'GET') {
      config.params = {
        ...data,
        api_key: this.provider.config.apiKey,
        api_secret: this.provider.config.apiSecret,
      };
    } else {
      config.data = {
        ...data,
        api_key: this.provider.config.apiKey,
        api_secret: this.provider.config.apiSecret,
      };
    }

    const response = await this.client.request(config);
    return response.data;
  }

  private handleProviderError(error: any): Error {
    const message = error.response?.data?.['error-code-label'] ||
      error.response?.data?.message ||
      error.message ||
      'Unknown Vonage error';
    
    return new Error(`Vonage error: ${message}`);
  }

  async getHealth(): Promise<{ status: 'healthy' | 'unhealthy' | 'degraded'; latency: number; error?: string }> {
    const start = Date.now();
    try {
      await this.client.get('/'); // Simple connectivity check
      return {
        status: 'healthy',
        latency: Date.now() - start
      };
    } catch (error: any) {
      return {
        status: 'unhealthy',
        latency: Date.now() - start,
        error: error.message
      };
    }
  }
}