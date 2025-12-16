import { SearchCriteria, AvailableNumber } from '@voxlink/shared';
import {
  NumberSearchRequest,
  NumberSearchResponse,
  NumberReservationRequest,
  NumberReservationResponse,
  NumberPurchaseRequest,
  NumberPurchaseResponse,
  TelecomPortingRequest as PortingRequest,
  PortingResponse
} from '@voxlink/shared';
import { TelecomProviderManager } from './telecom-provider-manager.service';
import { logger } from '../utils/logger';

export interface NumberAvailabilityResponse {
  numbers: AvailableNumber[];
  totalCount: number;
  searchId: string;
  provider: string;
}

export class TelecomProviderService {
  private providerManager: TelecomProviderManager;

  constructor() {
    this.providerManager = new TelecomProviderManager();
  }

  /**
   * Search for available numbers from telecom providers with failover
   */
  async searchAvailableNumbers(criteria: SearchCriteria): Promise<NumberAvailabilityResponse> {
    logger.info('Searching for available numbers', { criteria });

    try {
      const request: NumberSearchRequest = {
        countryCode: criteria.countryCode,
        areaCode: criteria.areaCode,
        city: criteria.city,
        region: criteria.region,
        pattern: criteria.pattern,
        features: criteria.features,
        limit: criteria.limit,
        maxMonthlyRate: criteria.maxMonthlyRate ? parseFloat(String(criteria.maxMonthlyRate)) * 100 : undefined,
        maxSetupFee: criteria.maxSetupFee ? parseFloat(String(criteria.maxSetupFee)) * 100 : undefined,
      };

      const response = await this.providerManager.searchNumbers(request);

      // Convert provider response to legacy format
      const legacyResponse: NumberAvailabilityResponse = {
        numbers: response.numbers.map(num => ({
          phoneNumber: num.phoneNumber,
          countryCode: num.countryCode,
          areaCode: num.areaCode,
          city: num.city,
          region: num.region,
          monthlyRate: num.monthlyRate,
          setupFee: num.setupFee,
          features: num.features,
          provider: num.provider,
        })),
        totalCount: response.totalCount,
        searchId: response.searchId,
        provider: response.provider,
      };

      logger.info('Number search completed', {
        searchId: response.searchId,
        count: response.numbers.length,
        provider: response.provider,
        responseTime: response.responseTime,
        cached: response.cached,
        criteria,
      });

      return legacyResponse;
    } catch (error) {
      logger.error('Failed to search numbers from telecom providers', { error, criteria });
      throw new Error('All telecom providers failed for number search');
    }
  }

  /**
   * Check if a specific number is available
   */
  async checkNumberAvailability(phoneNumber: string): Promise<boolean> {
    logger.info('Checking number availability', { phoneNumber });

    try {
      const result = await this.providerManager.checkNumberAvailability(phoneNumber);

      logger.info('Number availability check completed', {
        phoneNumber,
        available: result.available,
        provider: result.provider
      });

      return result.available;
    } catch (error) {
      logger.error('Failed to check number availability', { error, phoneNumber });
      return false;
    }
  }

  /**
   * Reserve a number with the telecom provider
   */
  async reserveNumber(phoneNumber: string, userId: string, providerId?: string): Promise<{ success: boolean; reservationId?: string; expiresAt?: Date }> {
    logger.info('Reserving number with telecom provider', { phoneNumber, userId, providerId });

    try {
      // If no specific provider is requested, use the first available one
      if (!providerId) {
        const searchResult = await this.providerManager.searchNumbers({
          countryCode: this.extractCountryFromPhone(phoneNumber),
          pattern: phoneNumber.replace(/\D/g, '').slice(-4),
          limit: 1,
        });

        if (searchResult.numbers.length === 0) {
          return { success: false };
        }

        providerId = searchResult.numbers[0].provider;
      }

      const request: NumberReservationRequest = {
        phoneNumber,
        providerId: providerId || '',
        reservationDuration: 10, // 10 minutes
        customerInfo: {
          name: 'VoxLink Customer',
          email: `user-${userId}@voxlink.com`,
        },
      };

      const response = await this.providerManager.reserveNumber(request);

      logger.info('Number reserved successfully', {
        phoneNumber,
        reservationId: response.reservationId,
        provider: response.provider,
        expiresAt: response.expiresAt
      });

      return {
        success: true,
        reservationId: response.reservationId,
        expiresAt: response.expiresAt
      };
    } catch (error) {
      logger.error('Failed to reserve number with telecom provider', { error, phoneNumber });
      return { success: false };
    }
  }

  /**
   * Release a number reservation with the telecom provider
   */
  async releaseReservation(providerId: string, reservationId: string): Promise<boolean> {
    logger.info('Releasing number reservation', { providerId, reservationId });

    try {
      const success = await this.providerManager.releaseReservation(providerId, reservationId);

      if (success) {
        logger.info('Number reservation released', { providerId, reservationId });
      } else {
        logger.warn('Failed to release number reservation', { providerId, reservationId });
      }

      return success;
    } catch (error) {
      logger.error('Failed to release number reservation', { error, providerId, reservationId });
      return false;
    }
  }

  /**
   * Purchase a reserved number
   */
  async purchaseNumber(request: {
    phoneNumber: string;
    providerId: string;
    reservationId?: string;
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
    };
  }): Promise<{ success: boolean; purchaseId?: string; activationDate?: Date }> {
    logger.info('Purchasing number', { phoneNumber: request.phoneNumber, providerId: request.providerId });

    try {
      const purchaseRequest: NumberPurchaseRequest = {
        phoneNumber: request.phoneNumber,
        providerId: request.providerId,
        reservationId: request.reservationId || '',
        customerInfo: request.customerInfo,
      };

      const response = await this.providerManager.purchaseNumber(purchaseRequest);

      if (response.status === 'purchased') {
        logger.info('Number purchased successfully', {
          phoneNumber: request.phoneNumber,
          purchaseId: response.purchaseId,
          provider: response.provider,
          activationDate: response.activationDate
        });

        return {
          success: true,
          purchaseId: response.purchaseId,
          activationDate: response.activationDate
        };
      } else {
        logger.warn('Number purchase failed or pending', {
          phoneNumber: request.phoneNumber,
          status: response.status
        });

        return { success: false };
      }
    } catch (error) {
      logger.error('Failed to purchase number', { error, request });
      return { success: false };
    }
  }

  /**
   * Initiate number porting
   */
  async initiatePorting(request: PortingRequest): Promise<{ success: boolean; portingId?: string; estimatedCompletion?: Date }> {
    logger.info('Initiating number porting', { phoneNumber: request.phoneNumber });

    try {
      const response = await this.providerManager.portNumber(request);

      if (response.status === 'submitted') {
        logger.info('Porting request submitted successfully', {
          phoneNumber: request.phoneNumber,
          portingId: response.portingId,
          estimatedCompletion: response.estimatedCompletion
        });

        return {
          success: true,
          portingId: response.portingId,
          estimatedCompletion: response.estimatedCompletion
        };
      } else {
        logger.warn('Porting request failed', {
          phoneNumber: request.phoneNumber,
          status: response.status,
          rejectionReason: response.rejectionReason
        });

        return { success: false };
      }
    } catch (error) {
      logger.error('Failed to initiate porting', { error, request });
      return { success: false };
    }
  }

  /**
   * Get provider health and metrics
   */
  getProviderStatus(): {
    health: Record<string, { healthy: boolean; status: string; uptime: number }>;
    metrics: Record<string, any>;
  } {
    return {
      health: this.providerManager.getProviderHealth(),
      metrics: this.providerManager.getProviderMetrics(),
    };
  }

  private extractCountryFromPhone(phoneNumber: string): string {
    const digits = phoneNumber.replace(/\D/g, '');

    if (digits.startsWith('1') && digits.length === 11) {
      return 'US';
    }

    return 'US';
  }


}
