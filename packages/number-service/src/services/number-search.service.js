"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NumberSearchService = void 0;
const shared_1 = require("@voxlink/shared");
const cache_service_1 = require("@voxlink/shared/services/cache.service");
const pagination_service_1 = require("@voxlink/shared/services/pagination.service");
const telecom_provider_service_1 = require("./telecom-provider.service");
const redis_service_1 = require("./redis.service");
const config_1 = require("../config/config");
const logger_1 = require("../utils/logger");
class NumberSearchService {
    constructor() {
        this.telecomProvider = new telecom_provider_service_1.TelecomProviderService();
        this.cacheService = new cache_service_1.CacheService({
            host: config_1.config.redis.host,
            port: config_1.config.redis.port,
            password: config_1.config.redis.password,
            keyPrefix: 'number_search:',
            defaultTtl: 300, // 5 minutes for search results
        });
    }
    /**
     * Search for available numbers with enhanced caching and pagination
     */
    async searchNumbers(criteria) {
        // Validate search criteria
        const { error } = (0, shared_1.validateSearchCriteria)(criteria);
        if (error) {
            throw new Error(`Invalid search criteria: ${error.details[0].message}`);
        }
        logger_1.logger.info('Starting number search', { criteria });
        // Generate cache key
        const cacheKey = this.generateCacheKey(criteria);
        // Try to get cached results first with multi-level caching
        const cachedResult = await this.getCachedSearchResult(cacheKey);
        if (cachedResult) {
            logger_1.logger.info('Returning cached search results', {
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
            const searchResult = {
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
            logger_1.logger.info('Number search completed', {
                searchId: searchResult.searchId,
                totalFound: providerResponse.numbers.length,
                afterFiltering: filteredNumbers.length,
                criteria,
            });
            return searchResult;
        }
        catch (error) {
            logger_1.logger.error('Number search failed', { error, criteria });
            throw new Error('Failed to search for available numbers');
        }
    }
    /**
     * Search with pagination support
     */
    async searchNumbersPaginated(criteria, paginationOptions = {}) {
        return pagination_service_1.PaginationService.paginate(async (offset, limit, options) => {
            const searchCriteria = {
                ...criteria,
                limit,
                offset,
            };
            const result = await this.searchNumbers(searchCriteria);
            return {
                data: result.numbers,
                total: result.totalCount,
            };
        }, paginationOptions);
    }
    /**
     * Get number details with availability check
     */
    async getNumberDetails(phoneNumber) {
        logger_1.logger.info('Getting number details', { phoneNumber });
        try {
            // Check cache first
            const cacheKey = `number_details:${phoneNumber}`;
            const cached = await redis_service_1.RedisService.get(cacheKey);
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
            await redis_service_1.RedisService.set(cacheKey, numberDetails, config_1.config.cache.numberDetailsTtl);
            return numberDetails;
        }
        catch (error) {
            logger_1.logger.error('Failed to get number details', { error, phoneNumber });
            return null;
        }
    }
    /**
     * Check real-time availability of multiple numbers
     */
    async checkBulkAvailability(phoneNumbers) {
        logger_1.logger.info('Checking bulk availability', { count: phoneNumbers.length });
        const results = {};
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
        logger_1.logger.info('Bulk availability check completed', {
            total: phoneNumbers.length,
            available: Object.values(results).filter(Boolean).length
        });
        return results;
    }
    /**
     * Get search suggestions based on partial criteria
     */
    async getSearchSuggestions(partialCriteria) {
        logger_1.logger.info('Getting search suggestions', { partialCriteria });
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
    rankSearchResults(numbers, preferences) {
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
                if (preferences.preferredAreaCodes.includes(a.areaCode))
                    scoreA += 5;
                if (preferences.preferredAreaCodes.includes(b.areaCode))
                    scoreB += 5;
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
    applyFilters(numbers, criteria) {
        let filtered = numbers;
        // Apply cost filters
        if (criteria.maxMonthlyRate) {
            filtered = filtered.filter(n => n.monthlyRate <= criteria.maxMonthlyRate);
        }
        if (criteria.maxSetupFee) {
            filtered = filtered.filter(n => n.setupFee <= criteria.maxSetupFee);
        }
        // Apply feature filters
        if (criteria.features && criteria.features.length > 0) {
            filtered = filtered.filter(n => criteria.features.every(feature => n.features.includes(feature)));
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
    generateCacheKey(criteria) {
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
    async getCachedSearchResult(cacheKey) {
        try {
            return await redis_service_1.RedisService.get(cacheKey);
        }
        catch (error) {
            logger_1.logger.warn('Failed to get cached search result', { error, cacheKey });
            return null;
        }
    }
    /**
     * Cache search result with enhanced caching
     */
    async cacheSearchResult(cacheKey, result, tags = []) {
        try {
            await this.cacheService.set(cacheKey, result, {
                ttl: config_1.config.cache.searchResultsTtl,
                tags,
            });
        }
        catch (error) {
            logger_1.logger.warn('Failed to cache search result', { error, cacheKey });
        }
    }
    /**
     * Search with retry logic for provider failures
     */
    async searchWithRetry(criteria, maxRetries = 3) {
        let lastError = null;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await this.telecomProvider.searchAvailableNumbers(criteria);
            }
            catch (error) {
                lastError = error;
                logger_1.logger.warn(`Search attempt ${attempt} failed`, { error, criteria });
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
    async invalidateSearchCache(tags) {
        try {
            for (const tag of tags) {
                await this.cacheService.invalidateByTag(tag);
            }
            logger_1.logger.info('Search cache invalidated', { tags });
        }
        catch (error) {
            logger_1.logger.error('Failed to invalidate search cache', { error, tags });
        }
    }
    /**
     * Generate number details for mock implementation
     */
    async generateNumberDetails(phoneNumber) {
        // This is a simplified version - in reality would fetch from telecom provider
        const mockCriteria = {
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
    chunkArray(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }
    /**
     * Get popular area codes for a country
     */
    getPopularAreaCodes(countryCode) {
        const areaCodeMap = {
            'US': ['212', '213', '214', '215', '301', '305', '312', '415', '617', '702'],
            'CA': ['416', '514', '604', '403', '613'],
            'GB': ['20', '121', '131', '141', '151'],
        };
        return areaCodeMap[countryCode] || [];
    }
    /**
     * Get popular cities for a country
     */
    getPopularCities(countryCode) {
        const cityMap = {
            'US': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia'],
            'CA': ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Ottawa'],
            'GB': ['London', 'Birmingham', 'Manchester', 'Glasgow', 'Liverpool'],
        };
        return cityMap[countryCode] || [];
    }
    /**
     * Get popular regions for a country
     */
    getPopularRegions(countryCode) {
        const regionMap = {
            'US': ['NY', 'CA', 'TX', 'FL', 'IL', 'PA'],
            'CA': ['ON', 'QC', 'BC', 'AB', 'MB'],
            'GB': ['England', 'Scotland', 'Wales', 'Northern Ireland'],
        };
        return regionMap[countryCode] || [];
    }
}
exports.NumberSearchService = NumberSearchService;
