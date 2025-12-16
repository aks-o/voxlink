import { SearchCriteria, AvailableNumber, SearchResult } from '@voxlink/shared';
import { PaginationOptions } from '@voxlink/shared/services/pagination.service';
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
export declare class NumberSearchService {
    private telecomProvider;
    private cacheService;
    constructor();
    /**
     * Search for available numbers with enhanced caching and pagination
     */
    searchNumbers(criteria: EnhancedSearchCriteria): Promise<SearchResult>;
    /**
     * Search with pagination support
     */
    searchNumbersPaginated(criteria: EnhancedSearchCriteria, paginationOptions?: PaginationOptions): Promise<any>;
    /**
     * Get number details with availability check
     */
    getNumberDetails(phoneNumber: string): Promise<AvailableNumber | null>;
    /**
     * Check real-time availability of multiple numbers
     */
    checkBulkAvailability(phoneNumbers: string[]): Promise<Record<string, boolean>>;
    /**
     * Get search suggestions based on partial criteria
     */
    getSearchSuggestions(partialCriteria: Partial<SearchCriteria>): Promise<{
        areaCodes: string[];
        cities: string[];
        regions: string[];
    }>;
    /**
     * Rank search results based on user preferences
     */
    private rankSearchResults;
    /**
     * Apply filters to search results
     */
    private applyFilters;
    /**
     * Generate cache key for search criteria
     */
    private generateCacheKey;
    /**
     * Get cached search result
     */
    private getCachedSearchResult;
    /**
     * Cache search result with enhanced caching
     */
    private cacheSearchResult;
    /**
     * Search with retry logic for provider failures
     */
    private searchWithRetry;
    /**
     * Invalidate search cache by tags
     */
    invalidateSearchCache(tags: string[]): Promise<void>;
    /**
     * Generate number details for mock implementation
     */
    private generateNumberDetails;
    /**
     * Utility function to chunk array
     */
    private chunkArray;
    /**
     * Get popular area codes for a country
     */
    private getPopularAreaCodes;
    /**
     * Get popular cities for a country
     */
    private getPopularCities;
    /**
     * Get popular regions for a country
     */
    private getPopularRegions;
}
