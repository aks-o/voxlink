import { logger } from '../monitoring/logger';

export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, any>;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextPage: number | null;
    previousPage: number | null;
  };
  meta: {
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    filters?: Record<string, any>;
    executionTime: number;
  };
}

export interface CursorPaginationOptions {
  cursor?: string;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, any>;
}

export interface CursorPaginationResult<T> {
  data: T[];
  pagination: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextCursor: string | null;
    previousCursor: string | null;
    totalCount?: number;
  };
  meta: {
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    filters?: Record<string, any>;
    executionTime: number;
  };
}

export interface LazyLoadingOptions {
  batchSize?: number;
  preloadNext?: boolean;
  cacheResults?: boolean;
  cacheTtl?: number;
}

export class PaginationService {
  private static readonly DEFAULT_LIMIT = 20;
  private static readonly MAX_LIMIT = 100;
  private static readonly MIN_LIMIT = 1;

  /**
   * Create offset-based pagination
   */
  static async paginate<T>(
    queryFn: (offset: number, limit: number, options: PaginationOptions) => Promise<{ data: T[]; total: number }>,
    options: PaginationOptions = {}
  ): Promise<PaginationResult<T>> {
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

      const paginationResult: PaginationResult<T> = {
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

      logger.debug('Pagination completed', {
        page,
        limit,
        total,
        executionTime: paginationResult.meta.executionTime,
      });

      return paginationResult;
    } catch (error: any) {
      logger.error('Pagination failed', { error, options });
      throw error;
    }
  }

  /**
   * Create cursor-based pagination (better for large datasets)
   */
  static async paginateWithCursor<T>(
    queryFn: (cursor: string | null, limit: number, options: CursorPaginationOptions) => Promise<{
      data: T[];
      nextCursor: string | null;
      previousCursor: string | null;
      totalCount?: number;
    }>,
    options: CursorPaginationOptions = {}
  ): Promise<CursorPaginationResult<T>> {
    const startTime = Date.now();

    // Validate and normalize options
    const limit = Math.min(
      Math.max(options.limit || this.DEFAULT_LIMIT, this.MIN_LIMIT),
      this.MAX_LIMIT
    );

    try {
      // Execute query
      const result = await queryFn(options.cursor || null, limit, options);
      const { data, nextCursor, previousCursor, totalCount } = result;

      const paginationResult: CursorPaginationResult<T> = {
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

      logger.debug('Cursor pagination completed', {
        cursor: options.cursor,
        limit,
        hasNextPage: paginationResult.pagination.hasNextPage,
        executionTime: paginationResult.meta.executionTime,
      });

      return paginationResult;
    } catch (error: any) {
      logger.error('Cursor pagination failed', { error, options });
      throw error;
    }
  }

  /**
   * Create lazy loading pagination
   */
  static createLazyLoader<T>(
    queryFn: (offset: number, limit: number) => Promise<T[]>,
    options: LazyLoadingOptions = {}
  ) {
    const {
      batchSize = this.DEFAULT_LIMIT,
      preloadNext = true,
      cacheResults = true,
      cacheTtl = 300000, // 5 minutes
    } = options;

    let currentOffset = 0;
    let cache: Map<number, { data: T[]; timestamp: number }> = new Map();
    let isLoading = false;
    let hasMore = true;

    const loadBatch = async (offset: number): Promise<T[]> => {
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
      } catch (error: any) {
        logger.error('Lazy loading batch failed', { error, offset, batchSize });
        throw error;
      }
    };

    const preloadNextBatch = async (): Promise<void> => {
      if (preloadNext && hasMore && !isLoading) {
        try {
          await loadBatch(currentOffset + batchSize);
        } catch (error: any) {
          logger.warn('Preloading next batch failed', { error });
        }
      }
    };

    return {
      async next(): Promise<{ data: T[]; hasMore: boolean; isLoading: boolean }> {
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
        } catch (error: any) {
          logger.error('Lazy loading next batch failed', { error });
          throw error;
        } finally {
          isLoading = false;
        }
      },

      async reset(): Promise<void> {
        currentOffset = 0;
        hasMore = true;
        isLoading = false;
        if (cacheResults) {
          cache.clear();
        }
      },

      async prefetch(count: number): Promise<void> {
        const prefetchPromises: Promise<T[]>[] = [];

        for (let i = 0; i < count; i++) {
          const offset = currentOffset + (i * batchSize);
          prefetchPromises.push(loadBatch(offset));
        }

        try {
          await Promise.all(prefetchPromises);
          logger.debug('Prefetch completed', { count, currentOffset });
        } catch (error: any) {
          logger.warn('Prefetch partially failed', { error, count });
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
  static createInfiniteScroll<T>(
    queryFn: (cursor: string | null, limit: number) => Promise<{
      data: T[];
      nextCursor: string | null;
    }>,
    options: { limit?: number; preloadThreshold?: number } = {}
  ) {
    const { limit = this.DEFAULT_LIMIT, preloadThreshold = 5 } = options;

    let allData: T[] = [];
    let nextCursor: string | null = null;
    let isLoading = false;
    let hasMore = true;

    return {
      async loadMore(): Promise<{ data: T[]; hasMore: boolean; totalLoaded: number }> {
        if (isLoading || !hasMore) {
          return { data: allData, hasMore, totalLoaded: allData.length };
        }

        isLoading = true;

        try {
          const result = await queryFn(nextCursor, limit);

          allData.push(...result.data);
          nextCursor = result.nextCursor;
          hasMore = result.nextCursor !== null;

          logger.debug('Infinite scroll loaded more data', {
            newItems: result.data.length,
            totalItems: allData.length,
            hasMore,
          });

          return { data: allData, hasMore, totalLoaded: allData.length };
        } catch (error: any) {
          logger.error('Infinite scroll load more failed', { error });
          throw error;
        } finally {
          isLoading = false;
        }
      },

      async reset(): Promise<void> {
        allData = [];
        nextCursor = null;
        hasMore = true;
        isLoading = false;
      },

      shouldLoadMore(currentIndex: number): boolean {
        return !isLoading &&
          hasMore &&
          currentIndex >= allData.length - preloadThreshold;
      },

      getData(): T[] {
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
  static createSearchPagination<T>(
    searchFn: (query: string, offset: number, limit: number) => Promise<{ data: T[]; total: number }>,
    options: { debounceMs?: number; minQueryLength?: number } = {}
  ) {
    const { debounceMs = 300, minQueryLength = 2 } = options;

    let debounceTimer: NodeJS.Timeout | null = null;
    let currentQuery = '';
    let isSearching = false;

    return {
      async search(
        query: string,
        paginationOptions: PaginationOptions = {}
      ): Promise<PaginationResult<T> | null> {
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
              const result = await this.paginate(
                async (offset, limit) => {
                  return await searchFn(query, offset, limit);
                },
                { ...paginationOptions, search: query }
              );

              resolve(result);
            } catch (error: any) {
              reject(error);
            } finally {
              isSearching = false;
            }
          }, debounceMs);
        });
      },

      isSearching(): boolean {
        return isSearching;
      },

      getCurrentQuery(): string {
        return currentQuery;
      },

      cancel(): void {
        if (debounceTimer) {
          clearTimeout(debounceTimer);
          debounceTimer = null;
        }
        isSearching = false;
      },
    };
  }

  private static normalizeOptions(options: PaginationOptions): Required<PaginationOptions> {
    return {
      page: Math.max(options.page || 1, 1),
      limit: Math.min(
        Math.max(options.limit || this.DEFAULT_LIMIT, this.MIN_LIMIT),
        this.MAX_LIMIT
      ),
      offset: options.offset || 0,
      sortBy: options.sortBy || 'createdAt',
      sortOrder: options.sortOrder || 'desc',
      search: options.search || '',
      filters: options.filters || {},
    };
  }
}