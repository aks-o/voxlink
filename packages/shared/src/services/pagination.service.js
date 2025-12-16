"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaginationService = void 0;
const logger_1 = require("../monitoring/logger");
class PaginationService {
    /**
     * Create offset-based pagination
     */
    static async paginate(queryFn, options = {}) {
        const startTime = Date.now();
        // Validate and normalize options
        const normalizedOptions = this.normalizeOptions(options);
        const { page, limit } = normalizedOptions;
        try {
            // Calculate offset
            const offset = (page - 1) * limit;
            // Execute query
            const result = await queryFn(offset, limit, normalizedOptions);
            const { data, total } = result;
            // Calculate pagination metadata
            const totalPages = Math.ceil(total / limit);
            const hasNextPage = page < totalPages;
            const hasPreviousPage = page > 1;
            const paginationResult = {
                data,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalItems: total,
                    itemsPerPage: limit,
                    hasNextPage,
                    hasPreviousPage,
                    nextPage: hasNextPage ? page + 1 : null,
                    previousPage: hasPreviousPage ? page - 1 : null,
                },
                meta: {
                    sortBy: normalizedOptions.sortBy,
                    sortOrder: normalizedOptions.sortOrder,
                    search: normalizedOptions.search,
                    filters: normalizedOptions.filters,
                    executionTime: Date.now() - startTime,
                },
            };
            logger_1.logger.debug('Pagination completed', {
                page,
                limit,
                total,
                executionTime: paginationResult.meta.executionTime,
            });
            return paginationResult;
        }
        catch (error) {
            logger_1.logger.error('Pagination failed', { error, options });
            throw error;
        }
    }
    /**
     * Create cursor-based pagination (better for large datasets)
     */
    static async paginateWithCursor(queryFn, options = {}) {
        const startTime = Date.now();
        // Validate and normalize options
        const limit = Math.min(Math.max(options.limit || this.DEFAULT_LIMIT, this.MIN_LIMIT), this.MAX_LIMIT);
        try {
            // Execute query
            const result = await queryFn(options.cursor || null, limit, options);
            const { data, nextCursor, previousCursor, totalCount } = result;
            const paginationResult = {
                data,
                pagination: {
                    hasNextPage: nextCursor !== null,
                    hasPreviousPage: previousCursor !== null,
                    nextCursor,
                    previousCursor,
                    totalCount,
                },
                meta: {
                    sortBy: options.sortBy,
                    sortOrder: options.sortOrder,
                    search: options.search,
                    filters: options.filters,
                    executionTime: Date.now() - startTime,
                },
            };
            logger_1.logger.debug('Cursor pagination completed', {
                cursor: options.cursor,
                limit,
                hasNextPage: paginationResult.pagination.hasNextPage,
                executionTime: paginationResult.meta.executionTime,
            });
            return paginationResult;
        }
        catch (error) {
            logger_1.logger.error('Cursor pagination failed', { error, options });
            throw error;
        }
    }
    /**
     * Create lazy loading pagination
     */
    static createLazyLoader(queryFn, options = {}) {
        const { batchSize = this.DEFAULT_LIMIT, preloadNext = true, cacheResults = true, cacheTtl = 300000, // 5 minutes
         } = options;
        let currentOffset = 0;
        let cache = new Map();
        let isLoading = false;
        let hasMore = true;
        const loadBatch = async (offset) => {
            // Check cache first
            if (cacheResults) {
                const cached = cache.get(offset);
                if (cached && Date.now() - cached.timestamp < cacheTtl) {
                    return cached.data;
                }
            }
            try {
                const data = await queryFn(offset, batchSize);
                // Cache results
                if (cacheResults) {
                    cache.set(offset, { data, timestamp: Date.now() });
                }
                // Update hasMore flag
                if (data.length < batchSize) {
                    hasMore = false;
                }
                return data;
            }
            catch (error) {
                logger_1.logger.error('Lazy loading batch failed', { error, offset, batchSize });
                throw error;
            }
        };
        const preloadNextBatch = async () => {
            if (preloadNext && hasMore && !isLoading) {
                try {
                    await loadBatch(currentOffset + batchSize);
                }
                catch (error) {
                    logger_1.logger.warn('Preloading next batch failed', { error });
                }
            }
        };
        return {
            async next() {
                if (isLoading) {
                    return { data: [], hasMore, isLoading: true };
                }
                if (!hasMore) {
                    return { data: [], hasMore: false, isLoading: false };
                }
                isLoading = true;
                try {
                    const data = await loadBatch(currentOffset);
                    currentOffset += batchSize;
                    // Preload next batch in background
                    preloadNextBatch();
                    return { data, hasMore, isLoading: false };
                }
                catch (error) {
                    logger_1.logger.error('Lazy loading next batch failed', { error });
                    throw error;
                }
                finally {
                    isLoading = false;
                }
            },
            async reset() {
                currentOffset = 0;
                hasMore = true;
                isLoading = false;
                if (cacheResults) {
                    cache.clear();
                }
            },
            async prefetch(count) {
                const prefetchPromises = [];
                for (let i = 0; i < count; i++) {
                    const offset = currentOffset + (i * batchSize);
                    prefetchPromises.push(loadBatch(offset));
                }
                try {
                    await Promise.all(prefetchPromises);
                    logger_1.logger.debug('Prefetch completed', { count, currentOffset });
                }
                catch (error) {
                    logger_1.logger.warn('Prefetch partially failed', { error, count });
                }
            },
            getStats() {
                return {
                    currentOffset,
                    hasMore,
                    isLoading,
                    cacheSize: cache.size,
                    batchSize,
                };
            },
            clearCache() {
                cache.clear();
            },
        };
    }
    /**
     * Create infinite scroll pagination
     */
    static createInfiniteScroll(queryFn, options = {}) {
        const { limit = this.DEFAULT_LIMIT, preloadThreshold = 5 } = options;
        let allData = [];
        let nextCursor = null;
        let isLoading = false;
        let hasMore = true;
        return {
            async loadMore() {
                if (isLoading || !hasMore) {
                    return { data: allData, hasMore, totalLoaded: allData.length };
                }
                isLoading = true;
                try {
                    const result = await queryFn(nextCursor, limit);
                    allData.push(...result.data);
                    nextCursor = result.nextCursor;
                    hasMore = result.nextCursor !== null;
                    logger_1.logger.debug('Infinite scroll loaded more data', {
                        newItems: result.data.length,
                        totalItems: allData.length,
                        hasMore,
                    });
                    return { data: allData, hasMore, totalLoaded: allData.length };
                }
                catch (error) {
                    logger_1.logger.error('Infinite scroll load more failed', { error });
                    throw error;
                }
                finally {
                    isLoading = false;
                }
            },
            async reset() {
                allData = [];
                nextCursor = null;
                hasMore = true;
                isLoading = false;
            },
            shouldLoadMore(currentIndex) {
                return !isLoading &&
                    hasMore &&
                    currentIndex >= allData.length - preloadThreshold;
            },
            getData() {
                return [...allData];
            },
            getStats() {
                return {
                    totalLoaded: allData.length,
                    hasMore,
                    isLoading,
                    nextCursor,
                };
            },
        };
    }
    /**
     * Create search pagination with debouncing
     */
    static createSearchPagination(searchFn, options = {}) {
        const { debounceMs = 300, minQueryLength = 2 } = options;
        let debounceTimer = null;
        let currentQuery = '';
        let isSearching = false;
        return {
            async search(query, paginationOptions = {}) {
                // Clear previous debounce timer
                if (debounceTimer) {
                    clearTimeout(debounceTimer);
                }
                // Return early if query is too short
                if (query.length < minQueryLength && query.length > 0) {
                    return null;
                }
                currentQuery = query;
                return new Promise((resolve, reject) => {
                    debounceTimer = setTimeout(async () => {
                        // Check if query changed during debounce
                        if (query !== currentQuery) {
                            resolve(null);
                            return;
                        }
                        isSearching = true;
                        try {
                            const result = await this.paginate(async (offset, limit) => {
                                return await searchFn(query, offset, limit);
                            }, { ...paginationOptions, search: query });
                            resolve(result);
                        }
                        catch (error) {
                            reject(error);
                        }
                        finally {
                            isSearching = false;
                        }
                    }, debounceMs);
                });
            },
            isSearching() {
                return isSearching;
            },
            getCurrentQuery() {
                return currentQuery;
            },
            cancel() {
                if (debounceTimer) {
                    clearTimeout(debounceTimer);
                    debounceTimer = null;
                }
                isSearching = false;
            },
        };
    }
    static normalizeOptions(options) {
        return {
            page: Math.max(options.page || 1, 1),
            limit: Math.min(Math.max(options.limit || this.DEFAULT_LIMIT, this.MIN_LIMIT), this.MAX_LIMIT),
            sortBy: options.sortBy || 'createdAt',
            sortOrder: options.sortOrder || 'desc',
            search: options.search || '',
            filters: options.filters || {},
        };
    }
}
exports.PaginationService = PaginationService;
PaginationService.DEFAULT_LIMIT = 20;
PaginationService.MAX_LIMIT = 100;
PaginationService.MIN_LIMIT = 1;
