import axios, { AxiosInstance } from 'axios';
import type { 
  NumberSearchRequest, 
  NumberSearchResponse, 
  NumberReservationRequest, 
  NumberReservationResponse,
  NumberPurchaseRequest,
  NumberPurchaseResponse,
  TelecomPortingRequest as PortingRequest,
  PortingResponse,
  ProviderNumber
} from '@voxlink/shared';
import { BaseTelecomProvider } from './base-provider.service';
import { logger } from '../../utils/logger';

/**
 * Airtel Business Provider for India and other markets
 * Supports virtual numbers, SMS, and voice services in India
 */
export class AirtelProvider extends BaseTelecomProvider {
  private client: AxiosInstance;

  constructor(provider: any) {
    super(provider);
    
    this.client = axios.create({
      baseURL: 'https://api.airtel.in/v1',
      timeout: this.provider.config.timeout,
      headers: {
        'Authorization': `Bearer ${this.provider.config.authentication.credentials.apiKey}`,
        'Content-Type': 'application/json',
        'X-API-Version': '1.0',
      },
    });
  }

  async searchNumbers(request: NumberSearchRequest): Promise<NumberSearchResponse> {
    this.validateRequest(request, ['countryCode']);

    const startTime = Date.now();
    const searchId = `airtel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Build Airtel API parameters
      const params: any = {
        country: request.countryCode,
        limit: request.limit || 10,
      };

      if (request.areaCode) {
        params.area_code = request.areaCode;
      }

      if (request.city) {
        params.city = request.city;
      }

      if (request.pattern) {
        params.pattern = request.pattern;
      }

      if (request.features) {
        params.features = request.features.join(',');
      }

      // For development/demo, return mock data
      if (process.env.NODE_ENV === 'development' || process.env.USE_MOCK_PROVIDERS === 'true') {
        return this.getMockNumbers(request, searchId, startTime);
      }

      const response = await this.client.get('/numbers/search', { params });
      
      const numbers: ProviderNumber[] = response.data.numbers.map((num: any) => ({
        phoneNumber: num.phone_number,
        countryCode: num.country_code,
        areaCode: num.area_code,
        city: num.city,
        region: num.state || num.region,
        monthlyRate: num.monthly_rate,
        setupFee: num.setup_fee || 0,
        features: num.features || ['voice', 'sms'],
        provider: 'airtel',
        providerId: num.id,
        metadata: {
          circle: num.circle,
          operator: 'Airtel',
          networkType: num.network_type || '4G',
        },
      }));

      return {
        numbers,
        totalCount: response.data.total_count,
        searchId,
        provider: 'airtel',
        responseTime: Date.now() - startTime,
        cached: false,
      };

    } catch (error) {
      logger.error('Airtel number search failed', { error, request });
      
      // Return mock data on error for development
      if (process.env.NODE_ENV === 'development') {
        return this.getMockNumbers(request, searchId, startTime);
      }
      
      throw this.handleProviderError(error, 'number_search');
    }
  }

  private getMockNumbers(request: NumberSearchRequest, searchId: string, startTime: number): NumberSearchResponse {
    const mockNumbers: ProviderNumber[] = [];
    const limit = request.limit || 10;

    // Generate mock Indian numbers
    if (request.countryCode === 'IN') {
      const areaCodes = request.areaCode ? [request.areaCode] : ['11', '22', '33', '44', '80', '40'];
      const cities = ['Delhi', 'Mumbai', 'Kolkata', 'Chennai', 'Bangalore', 'Hyderabad'];
      
      for (let i = 0; i < limit; i++) {
        const areaCode = areaCodes[i % areaCodes.length];
        const city = cities[i % cities.length];
        const randomNum = Math.floor(Math.random() * 9000000) + 1000000;
        
        mockNumbers.push({
          phoneNumber: `+91 ${areaCode} ${randomNum.toString().substring(0, 4)} ${randomNum.toString().substring(4)}`,
          countryCode: 'IN',
          areaCode,
          city,
          region: this.getIndianState(city),
          monthlyRate: Math.floor(Math.random() * 500) + 200, // ₹200-700 per month
          setupFee: Math.floor(Math.random() * 200) + 100, // ₹100-300 setup
          features: ['voice', 'sms', 'mms'],
          provider: 'airtel',
          providerId: `airtel_${areaCode}_${randomNum}`,
          metadata: {
            circle: this.getAirtelCircle(city),
            operator: 'Airtel',
            networkType: '4G',
            currency: 'INR',
          },
        });
      }
    }

    return {
      numbers: mockNumbers,
      totalCount: mockNumbers.length,
      searchId,
      provider: 'airtel',
      responseTime: Date.now() - startTime,
      cached: false,
    };
  }

  private getIndianState(city: string): string {
    const stateMap: Record<string, string> = {
      'Delhi': 'Delhi',
      'Mumbai': 'Maharashtra',
      'Kolkata': 'West Bengal',
      'Chennai': 'Tamil Nadu',
      'Bangalore': 'Karnataka',
      'Hyderabad': 'Telangana',
    };
    return stateMap[city] || 'Unknown';
  }

  private getAirtelCircle(city: string): string {
    const circleMap: Record<string, string> = {
      'Delhi': 'Delhi',
      'Mumbai': 'Mumbai',
      'Kolkata': 'Kolkata',
      'Chennai': 'Tamil Nadu',
      'Bangalore': 'Karnataka',
      'Hyderabad': 'Andhra Pradesh',
    };
    return circleMap[city] || 'Metro';
  }

  async reserveNumber(request: NumberReservationRequest): Promise<NumberReservationResponse> {
    const startTime = Date.now();

    try {
      // For development, return mock reservation
      if (process.env.NODE_ENV === 'development' || process.env.USE_MOCK_PROVIDERS === 'true') {
        return {
          reservationId: `airtel_res_${Date.now()}`,
          phoneNumber: request.phoneNumber,
          provider: 'airtel',
          expiresAt: new Date(Date.now() + (request.reservationDuration * 60 * 1000)),
          status: 'reserved',
        };
      }

      const response = await this.client.post('/numbers/reserve', {
        phone_number: request.phoneNumber,
        provider_id: request.providerId,
        duration_minutes: request.reservationDuration,
        customer_info: request.customerInfo,
      });

      return {
        reservationId: response.data.reservation_id,
        phoneNumber: response.data.phone_number,
        provider: 'airtel',
        expiresAt: new Date(response.data.expires_at),
        status: response.data.status,
      };

    } catch (error) {
      logger.error('Airtel number reservation failed', { error, request });
      throw this.handleProviderError(error, 'number_reservation');
    }
  }

  async purchaseNumber(request: NumberPurchaseRequest): Promise<NumberPurchaseResponse> {
    try {
      // For development, return mock purchase
      if (process.env.NODE_ENV === 'development' || process.env.USE_MOCK_PROVIDERS === 'true') {
        return {
          purchaseId: `airtel_pur_${Date.now()}`,
          phoneNumber: request.phoneNumber,
          provider: 'airtel',
          status: 'purchased',
          activationDate: new Date(),
          monthlyRate: 350, // ₹350 per month
          setupFee: 150, // ₹150 setup
          features: ['voice', 'sms', 'mms'],
        };
      }

      const response = await this.client.post('/numbers/purchase', {
        reservation_id: request.reservationId,
        phone_number: request.phoneNumber,
        provider_id: request.providerId,
        customer_info: request.customerInfo,
        billing_info: request.billingInfo,
      });

      return {
        purchaseId: response.data.purchase_id,
        phoneNumber: response.data.phone_number,
        provider: 'airtel',
        status: response.data.status,
        activationDate: response.data.activation_date ? new Date(response.data.activation_date) : undefined,
        monthlyRate: response.data.monthly_rate,
        setupFee: response.data.setup_fee,
        features: response.data.features,
      };

    } catch (error) {
      logger.error('Airtel number purchase failed', { error, request });
      throw this.handleProviderError(error, 'number_purchase');
    }
  }

  async portNumber(request: PortingRequest): Promise<PortingResponse> {
    try {
      // For development, return mock porting response
      if (process.env.NODE_ENV === 'development' || process.env.USE_MOCK_PROVIDERS === 'true') {
        return {
          portingId: `airtel_port_${Date.now()}`,
          phoneNumber: request.phoneNumber,
          status: 'submitted',
          estimatedCompletion: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)), // 7 days
        };
      }

      const response = await this.client.post('/numbers/port', {
        phone_number: request.phoneNumber,
        current_provider: request.currentProvider,
        account_number: request.accountNumber,
        pin: request.pin,
        authorized_name: request.authorizedName,
        service_address: request.serviceAddress,
        documents: request.documents,
      });

      return {
        portingId: response.data.porting_id,
        phoneNumber: response.data.phone_number,
        status: response.data.status,
        estimatedCompletion: response.data.estimated_completion ? new Date(response.data.estimated_completion) : undefined,
        rejectionReason: response.data.rejection_reason,
      };

    } catch (error) {
      logger.error('Airtel number porting failed', { error, request });
      throw this.handleProviderError(error, 'number_porting');
    }
  }

  async checkNumberAvailability(phoneNumber: string): Promise<boolean> {
    try {
      const response = await this.client.get('/numbers/availability', {
        params: { phone_number: phoneNumber }
      });
      return response.data.available === true;
    } catch (error) {
      logger.error('Airtel availability check failed', { error, phoneNumber });
      return false;
    }
  }

  async releaseReservation(reservationId: string): Promise<boolean> {
    try {
      const response = await this.client.delete(`/numbers/reservations/${reservationId}`);
      return response.status === 200;
    } catch (error) {
      logger.error('Airtel reservation release failed', { error, reservationId });
      return false;
    }
  }

  protected async performHealthCheck(): Promise<boolean> {
    try {
      // For development, always return healthy
      if (process.env.NODE_ENV === 'development' || process.env.USE_MOCK_PROVIDERS === 'true') {
        return true;
      }

      const response = await this.client.get('/health');
      return response.status === 200 && response.data.status === 'healthy';
    } catch (error) {
      logger.error('Airtel health check failed', { error });
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
      config.params = data;
    } else {
      config.data = data;
    }

    const response = await this.client.request(config);
    return response.data;
  }

  protected handleProviderError(error: any, context?: string): Error {
    const message = error.response?.data?.message ||
      error.message ||
      'Unknown Airtel error';
    
    return new Error(`Airtel error${context ? ` (${context})` : ''}: ${message}`);
  }
}