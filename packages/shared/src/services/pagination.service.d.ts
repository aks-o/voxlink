export interface PaginationOptions {
    page?: number;
    limit?: number;
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
export declare class PaginationService {
    private static readonly DEFAULT_LIMIT;
    private static readonly MAX_LIMIT;
    private static readonly MIN_LIMIT;
    /**
     * Create offset-based pagination
     */
    static paginate<T>(queryFn: (offset: number, limit: number, options: PaginationOptions) => Promise<{
        data: T[];
        total: number;
    }>, options?: PaginationOptions): Promise<PaginationResult<T>>;
    /**
     * Create cursor-based pagination (better for large datasets)
     */
    static paginateWithCursor<T>(queryFn: (cursor: string | null, limit: number, options: CursorPaginationOptions) => Promise<{
        data: T[];
        nextCursor: string | null;
        previousCursor: string | null;
        totalCount?: number;
    }>, options?: CursorPaginationOptions): Promise<CursorPaginationResult<T>>;
    /**
     * Create lazy loading pagination
     */
    static createLazyLoader<T>(queryFn: (offset: number, limit: number) => Promise<T[]>, options?: LazyLoadingOptions): {
        next(): Promise<{
            data: T[];
            hasMore: boolean;
            isLoading: boolean;
        }>;
        reset(): Promise<void>;
        prefetch(count: number): Promise<void>;
        getStats(): {
            currentOffset: number;
            hasMore: boolean;
            isLoading: boolean;
            cacheSize: number;
            batchSize: number;
        };
        clearCache(): void;
    };
    /**
     * Create infinite scroll pagination
     */
    static createInfiniteScroll<T>(queryFn: (cursor: string | null, limit: number) => Promise<{
        data: T[];
        nextCursor: string | null;
    }>, options?: {
        limit?: number;
        preloadThreshold?: number;
    }): {
        loadMore(): Promise<{
            data: T[];
            hasMore: boolean;
            totalLoaded: number;
        }>;
        reset(): Promise<void>;
        shouldLoadMore(currentIndex: number): boolean;
        getData(): T[];
        getStats(): {
            totalLoaded: number;
            hasMore: boolean;
            isLoading: boolean;
            nextCursor: string | null;
        };
    };
    /**
     * Create search pagination with debouncing
     */
    static createSearchPagination<T>(searchFn: (query: string, offset: number, limit: number) => Promise<{
        data: T[];
        total: number;
    }>, options?: {
        debounceMs?: number;
        minQueryLength?: number;
    }): {
        search(query: string, paginationOptions?: PaginationOptions): Promise<PaginationResult<T> | null>;
        isSearching(): boolean;
        getCurrentQuery(): string;
        cancel(): void;
    };
    private static normalizeOptions;
}
