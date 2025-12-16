import { SearchCriteria, AvailableNumber, SearchResult, validateSearchCriteria, CacheService, PaginationOptions, PaginationResult } from '@voxlink/shared';
import { TelecomProviderService } from './telecom-provider.service';
import { RedisService } from './redis.service';
import { config } from '../config/config';
import { logger } from '../utils/logger';

export interface SearchPreferences {
  preferredFeatures?: string[];
  maxMonthlyRate?: number;
  maxSetupFee?: number;
  preferredAreaCodes?: string[];
  sortBy?: 'cost' | 'features' | 'location';
}

export interface EnhancedSearchCriteria extends SearchCriteria {
  preferences?: SearchPreferences;
}

export class NumberSearchService {
  private telecomProvider: TelecomProviderService;
  private cacheService: CacheService;

  constructor() {
    this.telecomProvider = new TelecomProviderService();
    this.cacheService = new CacheService({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      keyPrefix: 'number_search:',
      defaultTtl: 300, // 5 minutes for search results
    });
  }

  /**
   * Search for available numbers with enhanced caching and pagination
   */
  async searchNumbers(criteria: EnhancedSearchCriteria): Promise<SearchResult> {
    // Validate search criteria
    const { error } = validateSearchCriteria(criteria);
    if (error) {
      throw new Error(`Invalid search criteria: ${error.details[0].message}`);
    }

    logger.info('Starting number search', { criteria });

    // Generate cache key
    const cacheKey = this.generateCacheKey(criteria);

    // Try to get cached results first with multi-level caching
    const cachedResult = await this.getCachedSearchResult(cacheKey);
    if (cachedResult) {
      logger.info('Returning cached search results', {
        searchId: cachedResult.searchId,
        count: cachedResult.numbers.length
      });
      return cachedResult;
    }

    try {
      // Search from telecom provider with retry logic
      const providerResponse = await this.searchWithRetry(criteria);

      // Apply user preferences and ranking
      const rankedNumbers = this.rankSearchResults(providerResponse.numbers, criteria.preferences);

      // Apply filters
      const filteredNumbers = this.applyFilters(rankedNumbers, criteria);

      // Create search result
      const searchResult: SearchResult = {
        numbers: filteredNumbers,
        totalCount: filteredNumbers.length,
        searchId: providerResponse.searchId,
        timestamp: new Date(),
      };

      // Cache the results with tags for invalidation
      await this.cacheSearchResult(cacheKey, searchResult, [
        `country:${criteria.countryCode}`,
        `area:${criteria.areaCode || 'any'}`,
        'search_results'
      ]);

      logger.info('Number search completed', {
        searchId: searchResult.searchId,
        totalFound: providerResponse.numbers.length,
        afterFiltering: filteredNumbers.length,
        criteria,
      });

      return searchResult;
    } catch (error) {
      logger.error('Number search failed', { error, criteria });
      throw new Error('Failed to search for available numbers');
    }
  }

  /**
   * Search with pagination support
   */
  async searchNumbersPaginated(
    criteria: EnhancedSearchCriteria,
    paginationOptions: PaginationOptions = {}
  ) {
    // Manual pagination implementation
    const offset = paginationOptions.offset || 0;
    const limit = paginationOptions.limit || 20;
    
    const searchCriteria = {
      ...criteria,
      limit,
      offset,
    };

    const result = await this.searchNumbers(searchCriteria);
    return {
      data: result.numbers,
      total: result.totalCount,
      offset,
      limit,
      hasMore: offset + limit < result.totalCount,
    };
  }

  /**
   * Get number details with availability check
   */
  async getNumberDetails(phoneNumber: string): Promise<AvailableNumber | null> {
    logger.info('Getting number details', { phoneNumber });

    try {
      // Check cache first
      const cacheKey = `number_details:${phoneNumber}`;
      const cached = await RedisService.get<AvailableNumber>(cacheKey);
      if (cached) {
        return cached;
      }

      // Check availability with telecom provider
      const isAvailable = await this.telecomProvider.checkNumberAvailability(phoneNumber);
      if (!isAvailable) {
        return null;
      }

      // For mock implementation, generate number details
      // In reality, this would fetch from the telecom provider
      const numberDetails = await this.generateNumberDetails(phoneNumber);

      // Cache the details
      await RedisService.set(cacheKey, numberDetails, config.cache.numberDetailsTtl);

      return numberDetails;
    } catch (error) {
      logger.error('Failed to get number details', { error, phoneNumber });
      return null;
    }
  }

  /**
   * Check real-time availability of multiple numbers
   */
  async checkBulkAvailability(phoneNumbers: string[]): Promise<Record<string, boolean>> {
    logger.info('Checking bulk availability', { count: phoneNumbers.length });

    const results: Record<string, boolean> = {};

    // Check availability in parallel (with concurrency limit)
    const concurrencyLimit = 10;
    const chunks = this.chunkArray(phoneNumbers, concurrencyLimit);

    for (const chunk of chunks) {
      const promises = chunk.map(async (phoneNumber) => {
        const isAvailable = await this.telecomProvider.checkNumberAvailability(phoneNumber);
        return { phoneNumber, isAvailable };
      });

      const chunkResults = await Promise.all(promises);
      chunkResults.forEach(({ phoneNumber, isAvailable }) => {
        results[phoneNumber] = isAvailable;
      });
    }

    logger.info('Bulk availability check completed', {
      total: phoneNumbers.length,
      available: Object.values(results).filter(Boolean).length
    });

    return results;
  }

  /**
   * Get search suggestions based on partial criteria
   */
  async getSearchSuggestions(partialCriteria: Partial<SearchCriteria>): Promise<{
    areaCodes: string[];
    cities: string[];
    regions: string[];
  }> {
    logger.info('Getting search suggestions', { partialCriteria });

    // This would typically query a database of available locations
    // For now, return mock suggestions based on country
    const suggestions = {
      areaCodes: this.getPopularAreaCodes(partialCriteria.countryCode || 'US'),
      cities: this.getPopularCities(partialCriteria.countryCode || 'US'),
      regions: this.getPopularRegions(partialCriteria.countryCode || 'US'),
    };

    return suggestions;
  }

  /**
   * Rank search results based on user preferences
   */
  private rankSearchResults(numbers: AvailableNumber[], preferences?: SearchPreferences): AvailableNumber[] {
    if (!preferences) {
      return numbers;
    }

    return numbers.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      // Feature matching score
      if (preferences.preferredFeatures) {
        const aFeatureMatches = preferences.preferredFeatures.filter(f => a.features.includes(f)).length;
        const bFeatureMatches = preferences.preferredFeatures.filter(f => b.features.includes(f)).length;
        scoreA += aFeatureMatches * 10;
        scoreB += bFeatureMatches * 10;
      }

      // Area code preference
      if (preferences.preferredAreaCodes) {
        if (preferences.preferredAreaCodes.includes(a.areaCode)) scoreA += 5;
        if (preferences.preferredAreaCodes.includes(b.areaCode)) scoreB += 5;
      }

      // Cost considerations
      if (preferences.sortBy === 'cost') {
        const aTotalCost = a.monthlyRate + a.setupFee;
        const bTotalCost = b.monthlyRate + b.setupFee;
        scoreA += (10000 - aTotalCost) / 100; // Lower cost = higher score
        scoreB += (10000 - bTotalCost) / 100;
      }

      return scoreB - scoreA; // Higher score first
    });
  }

  /**
   * Apply filters to search results
   */
  private applyFilters(numbers: AvailableNumber[], criteria: EnhancedSearchCriteria): AvailableNumber[] {
    let filtered = numbers;

    // Apply cost filters
    if (criteria.maxMonthlyRate) {
      filtered = filtered.filter(n => n.monthlyRate <= criteria.maxMonthlyRate!);
    }

    if (criteria.maxSetupFee) {
      filtered = filtered.filter(n => n.setupFee <= criteria.maxSetupFee!);
    }

    // Apply feature filters
    if (criteria.features && criteria.features.length > 0) {
      filtered = filtered.filter(n =>
        criteria.features!.every(feature => n.features.includes(feature))
      );
    }

    // Apply pattern filter
    if (criteria.pattern) {
      const regex = new RegExp(criteria.pattern);
      filtered = filtered.filter(n => regex.test(n.phoneNumber));
    }

    // Apply limit
    if (criteria.limit) {
      filtered = filtered.slice(0, criteria.limit);
    }

    return filtered;
  }

  /**
   * Generate cache key for search criteria
   */
  private generateCacheKey(criteria: EnhancedSearchCriteria): string {
    const keyParts = [
      'search',
      criteria.countryCode,
      criteria.areaCode || 'any',
      criteria.city || 'any',
      criteria.region || 'any',
      criteria.pattern || 'any',
      criteria.features?.join(',') || 'any',
      criteria.maxMonthlyRate || 'any',
      criteria.maxSetupFee || 'any',
      criteria.limit || 10,
    ];

    return keyParts.join(':');
  }

  /**
   * Get cached search result
   */
  private async getCachedSearchResult(cacheKey: string): Promise<SearchResult | null> {
    try {
      return await RedisService.get<SearchResult>(cacheKey);
    } catch (error) {
      logger.warn('Failed to get cached search result', { error, cacheKey });
      return null;
    }
  }

  /**
   * Cache search result with enhanced caching
   */
  private async cacheSearchResult(cacheKey: string, result: SearchResult, tags: string[] = []): Promise<void> {
    try {
      await this.cacheService.set(cacheKey, result, {
        ttl: config.cache.searchResultsTtl,
        tags,
      });
    } catch (error) {
      logger.warn('Failed to cache search result', { error, cacheKey });
    }
  }

  /**
   * Search with retry logic for provider failures
   */
  private async searchWithRetry(criteria: EnhancedSearchCriteria, maxRetries = 3): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.telecomProvider.searchAvailableNumbers(criteria);
      } catch (error) {
        lastError = error as Error;
        logger.warn(`Search attempt ${attempt} failed`, { error, criteria });

        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Search failed after all retries');
  }

  /**
   * Invalidate search cache by tags
   */
  async invalidateSearchCache(tags: string[]): Promise<void> {
    try {
      for (const tag of tags) {
        await this.cacheService.invalidateByTag(tag);
      }
      logger.info('Search cache invalidated', { tags });
    } catch (error) {
      logger.error('Failed to invalidate search cache', { error, tags });
    }
  }

  /**
   * Generate number details for mock implementation
   */
  private async generateNumberDetails(phoneNumber: string): Promise<AvailableNumber> {
    // This is a simplified version - in reality would fetch from telecom provider
    const mockCriteria: SearchCriteria = {
      countryCode: 'US', // Would parse from phone number
      limit: 1,
    };

    const response = await this.telecomProvider.searchAvailableNumbers(mockCriteria);
    const mockNumber = response.numbers[0];

    return {
      ...mockNumber,
      phoneNumber, // Use the requested number
    };
  }

  /**
   * Utility function to chunk array
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Get popular area codes for a country
   */
  private getPopularAreaCodes(countryCode: string): string[] {
    const areaCodeMap: Record<string, string[]> = {
      'US': ['212', '213', '214', '215', '301', '305', '312', '415', '617', '702'],
      'CA': ['416', '514', '604', '403', '613'],
      'GB': ['20', '121', '131', '141', '151'],
    };

    return areaCodeMap[countryCode] || [];
  }

  /**
   * Get popular cities for a country
   */
  private getPopularCities(countryCode: string): string[] {
    const cityMap: Record<string, string[]> = {
      'US': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia'],
      'CA': ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Ottawa'],
      'GB': ['London', 'Birmingham', 'Manchester', 'Glasgow', 'Liverpool'],
    };

    return cityMap[countryCode] || [];
  }

  /**
   * Get popular regions for a country
   */
  private getPopularRegions(countryCode: string): string[] {
    const regionMap: Record<string, string[]> = {
      'US': ['NY', 'CA', 'TX', 'FL', 'IL', 'PA'],
      'CA': ['ON', 'QC', 'BC', 'AB', 'MB'],
      'GB': ['England', 'Scotland', 'Wales', 'Northern Ireland'],
    };

    return regionMap[countryCode] || [];
  }
}