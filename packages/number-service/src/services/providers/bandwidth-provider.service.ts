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
  ProviderNumber
} from '@voxlink/shared';
import { BaseTelecomProvider } from './base-provider.service';
import { logger } from '../../utils/logger';

export class BandwidthProvider extends BaseTelecomProvider {
  private client: AxiosInstance;

  constructor(provider: any) {
    super(provider);

    this.client = axios.create({
      baseURL: 'https://dashboard.bandwidth.com/api',
      timeout: this.provider.config.timeout,
      auth: {
        username: this.provider.config.authentication.credentials.username,
        password: this.provider.config.authentication.credentials.password,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async searchNumbers(request: NumberSearchRequest): Promise<NumberSearchResponse> {
    this.validateRequest(request, ['countryCode']);

    const startTime = Date.now();
    const searchId = `bandwidth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const params: any = {
        quantity: Math.min(request.limit || 20, 5000),
      };

      if (request.areaCode) {
        params.areaCode = request.areaCode;
      }

      if (request.city) {
        params.city = request.city;
      }

      if (request.region) {
        params.state = request.region;
      }

      if (request.pattern) {
        params.pattern = request.pattern;
      }

      // Bandwidth uses different endpoint for different number types
      const endpoint = `/accounts/${this.provider.config.authentication.credentials.accountId}/availableNumbers`;

      const response = await this.client.get(endpoint, { params });

      const numbers: ProviderNumber[] = response.data.telephoneNumberList.map((bandwidthNumber: any) => ({
        phoneNumber: this.formatPhoneNumber(bandwidthNumber.fullNumber, 'e164'),
        countryCode: request.countryCode,
        areaCode: bandwidthNumber.npa,
        city: bandwidthNumber.city,
        region: bandwidthNumber.state,
        monthlyRate: this.calculateMonthlyRate(request.countryCode),
        setupFee: this.calculateSetupFee(request.countryCode),
        features: this.getBandwidthFeatures(),
        provider: this.provider.id,
        providerId: bandwidthNumber.fullNumber,
        metadata: {
          nxx: bandwidthNumber.nxx,
          xxxx: bandwidthNumber.xxxx,
          lata: bandwidthNumber.lata,
          rateCenter: bandwidthNumber.rateCenter,
          tier: bandwidthNumber.tier,
        },
      }));

      const responseTime = Date.now() - startTime;

      return {
        numbers,
        totalCount: numbers.length,
        searchId,
        provider: this.provider.id,
        responseTime,
        cached: false,
      };

    } catch (error) {
      logger.error('Bandwidth number search failed', { error, request });
      throw error;
    }
  }

  async reserveNumber(request: NumberReservationRequest): Promise<NumberReservationResponse> {
    this.validateRequest(request, ['phoneNumber']);

    try {
      const reservationData = {
        reservedTn: request.phoneNumber.replace(/\D/g, ''),
        accountId: this.provider.config.authentication.credentials.accountId,
        reservationExpires: request.reservationDuration || 30, // minutes
      };

      const response = await this.client.post(
        `/accounts/${this.provider.config.authentication.credentials.accountId}/reservations`,
        reservationData
      );

      const reservationId = response.data.reservation.reservationId;
      const expiresAt = new Date(Date.now() + (request.reservationDuration || 30) * 60 * 1000);

      return {
        reservationId,
        phoneNumber: request.phoneNumber,
        provider: this.provider.id,
        expiresAt,
        status: 'reserved',
      };

    } catch (error) {
      logger.error('Bandwidth number reservation failed', { error, request });
      throw error;
    }
  }

  async purchaseNumber(request: NumberPurchaseRequest): Promise<NumberPurchaseResponse> {
    this.validateRequest(request, ['phoneNumber', 'customerInfo']);

    try {
      const orderData = {
        name: `Order for ${request.phoneNumber}`,
        siteId: this.provider.config.authentication.credentials.siteId,
        existingTelephoneNumberOrderType: {
          telephoneNumberList: [
            {
              telephoneNumber: request.phoneNumber.replace(/\D/g, ''),
            }
          ],
        },
        customerOrderId: `voxlink_${Date.now()}`,
      };

      const response = await this.client.post(
        `/accounts/${this.provider.config.authentication.credentials.accountId}/orders`,
        orderData
      );

      const purchaseId = response.data.order.id;

      return {
        purchaseId,
        phoneNumber: request.phoneNumber,
        provider: this.provider.id,
        status: response.data.order.orderStatus === 'COMPLETE' ? 'purchased' : 'pending',
        activationDate: new Date(),
        monthlyRate: this.calculateMonthlyRate(this.extractCountryCode(request.phoneNumber)),
        setupFee: this.calculateSetupFee(this.extractCountryCode(request.phoneNumber)),
        features: this.getBandwidthFeatures(),
      };

    } catch (error) {
      logger.error('Bandwidth number purchase failed', { error, request });

      return {
        purchaseId: '',
        phoneNumber: request.phoneNumber,
        provider: this.provider.id,
        status: 'failed',
        monthlyRate: 0,
        setupFee: 0,
        features: [],
      };
    }
  }

  async portNumber(request: PortingRequest): Promise<PortingResponse> {
    const phoneNumber = request.phoneNumber || '';
    const serviceAddress = request.serviceAddress || { street: '', city: '', state: '', postalCode: '', country: '' };
    
    this.validateRequest(request, ['phoneNumber', 'currentProvider', 'accountNumber', 'pin']);

    try {
      const portingData = {
        siteId: this.provider.config.authentication.credentials.siteId,
        peerId: this.provider.config.authentication.credentials.peerId,
        billingTelephoneNumber: phoneNumber.replace(/\D/g, ''),
        subscriber: {
          subscriberType: 'BUSINESS',
          businessName: request.authorizedName,
          serviceAddress: {
            houseNumber: serviceAddress.street.split(' ')[0],
            streetName: serviceAddress.street.substring(serviceAddress.street.indexOf(' ') + 1),
            city: serviceAddress.city,
            stateCode: serviceAddress.state,
            zip: serviceAddress.postalCode,
            country: serviceAddress.country,
          },
        },
        loaAuthorizingPerson: request.authorizedName,
        listOfPhoneNumbers: [
          {
            phoneNumber: phoneNumber.replace(/\D/g, ''),
          }
        ],
        billingType: 'PORTIN',
      };

      const response = await this.client.post(
        `/accounts/${this.provider.config.authentication.credentials.accountId}/portins`,
        portingData
      );

      const portingId = response.data.portIn.id;

      return {
        portingId,
        phoneNumber: request.phoneNumber,
        status: 'submitted',
        estimatedCompletion: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days
      };

    } catch (error) {
      logger.error('Bandwidth porting request failed', { error, request });

      return {
        portingId: `bandwidth_port_${Date.now()}`,
        phoneNumber: request.phoneNumber,
        status: 'rejected',
        rejectionReason: 'Failed to submit porting request',
      };
    }
  }

  async checkNumberAvailability(phoneNumber: string): Promise<boolean> {
    try {
      const response = await this.searchNumbers({
        countryCode: this.extractCountryCode(phoneNumber),
        pattern: phoneNumber.replace(/\D/g, '').slice(-4),
        limit: 50,
      });

      return response.numbers.some(num => num.phoneNumber === phoneNumber);
    } catch (error) {
      logger.error('Bandwidth availability check failed', { error, phoneNumber });
      return false;
    }
  }

  async releaseReservation(reservationId: string): Promise<boolean> {
    try {
      await this.client.delete(
        `/accounts/${this.provider.config.authentication.credentials.accountId}/reservations/${reservationId}`
      );
      return true;
    } catch (error) {
      logger.error('Bandwidth reservation release failed', { error, reservationId });
      return false;
    }
  }

  protected async performHealthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get(
        `/accounts/${this.provider.config.authentication.credentials.accountId}`
      );
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  protected async executeRequest<T>(
    method: string,
    endpoint: string,
    data?: any,
    options?: any
  ): Promise<T> {
    const config = {
      method: method.toLowerCase(),
      url: endpoint,
      timeout: options?.timeout,
      ...options,
    };

    if (data) {
      if (method === 'GET') {
        config.params = data;
      } else {
        config.data = data;
      }
    }

    const response = await this.client.request(config);
    return response.data;
  }

  private extractCountryCode(phoneNumber: string): string {
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.startsWith('1') && digits.length === 11) {
      return 'US';
    }
    return 'US';
  }

  private calculateMonthlyRate(countryCode: string): number {
    // Bandwidth pricing in cents
    const pricing: Record<string, number> = {
      'US': 50, // $0.50/month
      'CA': 50, // $0.50/month
    };
    return pricing[countryCode] || 50;
  }

  private calculateSetupFee(countryCode: string): number {
    // Bandwidth typically has setup fees
    const setupFees: Record<string, number> = {
      'US': 100, // $1.00 setup
      'CA': 100, // $1.00 setup
    };
    return setupFees[countryCode] || 100;
  }

  private getBandwidthFeatures(): string[] {
    return [
      'voice',
      'sms',
      'mms',
      'call_forwarding',
      'voicemail',
      'analytics',
      'international_calling',
    ];
  }
}

