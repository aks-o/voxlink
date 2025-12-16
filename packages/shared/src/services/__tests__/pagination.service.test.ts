import { PaginationService } from '../pagination.service';

describe('PaginationService', () => {
  describe('paginate', () => {
    it('should return paginated results with correct metadata', async () => {
      const mockData = Array.from({ length: 25 }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}` }));
      
      const queryFn = jest.fn().mockImplementation(async (offset: number, limit: number) => {
        const data = mockData.slice(offset, offset + limit);
        return { data, total: mockData.length };
      });

      const result = await PaginationService.paginate(queryFn, {
        page: 2,
        limit: 10,
      });

      expect(queryFn).toHaveBeenCalledWith(10, 10, {
        page: 2,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        search: '',
        filters: {},
      });

      expect(result.data).toHaveLength(10);
      expect(result.data[0]).toEqual({ id: 11, name: 'Item 11' });
      expect(result.pagination).toEqual({
        currentPage: 2,
        totalPages: 3,
        totalItems: 25,
        itemsPerPage: 10,
        hasNextPage: true,
        hasPreviousPage: true,
        nextPage: 3,
        previousPage: 1,
      });
      expect(result.meta.executionTime).toBeGreaterThan(0);
    });

    it('should handle first page correctly', async () => {
      const queryFn = jest.fn().mockResolvedValue({
        data: [{ id: 1 }, { id: 2 }],
        total: 20,
      });

      const result = await PaginationService.paginate(queryFn, {
        page: 1,
        limit: 10,
      });

      expect(result.pagination.hasPreviousPage).toBe(false);
      expect(result.pagination.previousPage).toBeNull();
      expect(result.pagination.hasNextPage).toBe(true);
      expect(result.pagination.nextPage).toBe(2);
    });

    it('should handle last page correctly', async () => {
      const queryFn = jest.fn().mockResolvedValue({
        data: [{ id: 1 }, { id: 2 }],
        total: 12,
      });

      const result = await PaginationService.paginate(queryFn, {
        page: 2,
        limit: 10,
      });

      expect(result.pagination.hasNextPage).toBe(false);
      expect(result.pagination.nextPage).toBeNull();
      expect(result.pagination.hasPreviousPage).toBe(true);
      expect(result.pagination.previousPage).toBe(1);
    });

    it('should enforce maximum limit', async () => {
      const queryFn = jest.fn().mockResolvedValue({
        data: [],
        total: 0,
      });

      await PaginationService.paginate(queryFn, {
        limit: 200, // Above max limit
      });

      expect(queryFn).toHaveBeenCalledWith(0, 100, expect.any(Object)); // Should be capped at 100
    });

    it('should enforce minimum limit', async () => {
      const queryFn = jest.fn().mockResolvedValue({
        data: [],
        total: 0,
      });

      await PaginationService.paginate(queryFn, {
        limit: 0, // Below min limit
      });

      expect(queryFn).toHaveBeenCalledWith(0, 1, expect.any(Object)); // Should be at least 1
    });

    it('should handle errors gracefully', async () => {
      const queryFn = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(PaginationService.paginate(queryFn)).rejects.toThrow('Database error');
    });
  });

  describe('paginateWithCursor', () => {
    it('should return cursor-based pagination results', async () => {
      const queryFn = jest.fn().mockResolvedValue({
        data: [{ id: 1 }, { id: 2 }],
        nextCursor: 'cursor_123',
        previousCursor: null,
        totalCount: 100,
      });

      const result = await PaginationService.paginateWithCursor(queryFn, {
        cursor: null,
        limit: 10,
      });

      expect(queryFn).toHaveBeenCalledWith(null, 10, {
        cursor: null,
        limit: 10,
        sortBy: undefined,
        sortOrder: undefined,
        search: undefined,
        filters: undefined,
      });

      expect(result.data).toHaveLength(2);
      expect(result.pagination).toEqual({
        hasNextPage: true,
        hasPreviousPage: false,
        nextCursor: 'cursor_123',
        previousCursor: null,
        totalCount: 100,
      });
    });

    it('should handle cursor with previous page', async () => {
      const queryFn = jest.fn().mockResolvedValue({
        data: [{ id: 3 }, { id: 4 }],
        nextCursor: 'cursor_456',
        previousCursor: 'cursor_789',
      });

      const result = await PaginationService.paginateWithCursor(queryFn, {
        cursor: 'cursor_123',
        limit: 10,
      });

      expect(result.pagination.hasNextPage).toBe(true);
      expect(result.pagination.hasPreviousPage).toBe(true);
    });
  });

  describe('createLazyLoader', () => {
    it('should create a lazy loader that loads batches', async () => {
      const mockData = Array.from({ length: 50 }, (_, i) => ({ id: i + 1 }));
      const queryFn = jest.fn().mockImplementation(async (offset: number, limit: number) => {
        return mockData.slice(offset, offset + limit);
      });

      const loader = PaginationService.createLazyLoader(queryFn, {
        batchSize: 10,
        preloadNext: false,
      });

      // Load first batch
      const batch1 = await loader.next();
      expect(batch1.data).toHaveLength(10);
      expect(batch1.hasMore).toBe(true);
      expect(batch1.isLoading).toBe(false);
      expect(queryFn).toHaveBeenCalledWith(0, 10);

      // Load second batch
      const batch2 = await loader.next();
      expect(batch2.data).toHaveLength(10);
      expect(batch2.hasMore).toBe(true);
      expect(queryFn).toHaveBeenCalledWith(10, 10);

      // Check stats
      const stats = loader.getStats();
      expect(stats.currentOffset).toBe(20);
      expect(stats.hasMore).toBe(true);
      expect(stats.batchSize).toBe(10);
    });

    it('should detect end of data', async () => {
      const queryFn = jest.fn()
        .mockResolvedValueOnce([{ id: 1 }, { id: 2 }]) // First batch (partial)
        .mockResolvedValueOnce([]); // Second batch (empty)

      const loader = PaginationService.createLazyLoader(queryFn, {
        batchSize: 10,
      });

      const batch1 = await loader.next();
      expect(batch1.hasMore).toBe(false); // Should detect end because batch < batchSize

      const batch2 = await loader.next();
      expect(batch2.data).toHaveLength(0);
      expect(batch2.hasMore).toBe(false);
    });

    it('should support prefetching', async () => {
      const queryFn = jest.fn().mockImplementation(async (offset: number, limit: number) => {
        return Array.from({ length: limit }, (_, i) => ({ id: offset + i + 1 }));
      });

      const loader = PaginationService.createLazyLoader(queryFn, {
        batchSize: 5,
        cacheResults: true,
      });

      await loader.prefetch(3); // Prefetch 3 batches

      expect(queryFn).toHaveBeenCalledTimes(3);
      expect(queryFn).toHaveBeenCalledWith(0, 5);
      expect(queryFn).toHaveBeenCalledWith(5, 5);
      expect(queryFn).toHaveBeenCalledWith(10, 5);
    });

    it('should support reset functionality', async () => {
      const queryFn = jest.fn().mockResolvedValue([{ id: 1 }]);
      const loader = PaginationService.createLazyLoader(queryFn);

      await loader.next();
      expect(loader.getStats().currentOffset).toBe(20);

      await loader.reset();
      expect(loader.getStats().currentOffset).toBe(0);
      expect(loader.getStats().hasMore).toBe(true);
    });
  });

  describe('createInfiniteScroll', () => {
    it('should create infinite scroll loader', async () => {
      const queryFn = jest.fn()
        .mockResolvedValueOnce({
          data: [{ id: 1 }, { id: 2 }],
          nextCursor: 'cursor_123',
        })
        .mockResolvedValueOnce({
          data: [{ id: 3 }, { id: 4 }],
          nextCursor: null,
        });

      const scroller = PaginationService.createInfiniteScroll(queryFn, {
        limit: 10,
      });

      // Load first batch
      const result1 = await scroller.loadMore();
      expect(result1.data).toHaveLength(2);
      expect(result1.hasMore).toBe(true);
      expect(result1.totalLoaded).toBe(2);

      // Load second batch
      const result2 = await scroller.loadMore();
      expect(result2.data).toHaveLength(4); // Accumulated data
      expect(result2.hasMore).toBe(false);
      expect(result2.totalLoaded).toBe(4);

      expect(queryFn).toHaveBeenCalledWith(null, 10);
      expect(queryFn).toHaveBeenCalledWith('cursor_123', 10);
    });

    it('should support shouldLoadMore logic', async () => {
      const queryFn = jest.fn().mockResolvedValue({
        data: Array.from({ length: 10 }, (_, i) => ({ id: i + 1 })),
        nextCursor: 'cursor_123',
      });

      const scroller = PaginationService.createInfiniteScroll(queryFn, {
        preloadThreshold: 3,
      });

      await scroller.loadMore();

      // Should load more when near the end
      expect(scroller.shouldLoadMore(7)).toBe(true); // 10 - 3 = 7
      expect(scroller.shouldLoadMore(5)).toBe(false);
    });

    it('should support reset functionality', async () => {
      const queryFn = jest.fn().mockResolvedValue({
        data: [{ id: 1 }],
        nextCursor: 'cursor_123',
      });

      const scroller = PaginationService.createInfiniteScroll(queryFn);

      await scroller.loadMore();
      expect(scroller.getData()).toHaveLength(1);

      await scroller.reset();
      expect(scroller.getData()).toHaveLength(0);
      expect(scroller.getStats().hasMore).toBe(true);
    });
  });

  describe('createSearchPagination', () => {
    it('should create search pagination with debouncing', async () => {
      jest.useFakeTimers();

      const searchFn = jest.fn().mockResolvedValue({
        data: [{ id: 1, name: 'test' }],
        total: 1,
      });

      const searchPagination = PaginationService.createSearchPagination(searchFn, {
        debounceMs: 300,
        minQueryLength: 2,
      });

      // Start search
      const searchPromise = searchPagination.search('test query');

      // Fast forward time
      jest.advanceTimersByTime(300);

      const result = await searchPromise;

      expect(result).toBeDefined();
      expect(result!.data).toHaveLength(1);
      expect(searchFn).toHaveBeenCalledWith('test query', 0, 20);

      jest.useRealTimers();
    });

    it('should return null for short queries', async () => {
      const searchFn = jest.fn();
      const searchPagination = PaginationService.createSearchPagination(searchFn, {
        minQueryLength: 3,
      });

      const result = await searchPagination.search('ab');

      expect(result).toBeNull();
      expect(searchFn).not.toHaveBeenCalled();
    });

    it('should cancel previous searches', async () => {
      jest.useFakeTimers();

      const searchFn = jest.fn().mockResolvedValue({
        data: [],
        total: 0,
      });

      const searchPagination = PaginationService.createSearchPagination(searchFn, {
        debounceMs: 300,
      });

      // Start first search
      const search1Promise = searchPagination.search('first');
      
      // Start second search before first completes
      const search2Promise = searchPagination.search('second');

      jest.advanceTimersByTime(300);

      const [result1, result2] = await Promise.all([search1Promise, search2Promise]);

      expect(result1).toBeNull(); // Cancelled
      expect(result2).toBeDefined(); // Completed
      expect(searchFn).toHaveBeenCalledTimes(1);
      expect(searchFn).toHaveBeenCalledWith('second', 0, 20);

      jest.useRealTimers();
    });

    it('should support cancel functionality', () => {
      const searchFn = jest.fn();
      const searchPagination = PaginationService.createSearchPagination(searchFn);

      searchPagination.search('test');
      expect(searchPagination.isSearching()).toBe(false); // Not searching yet due to debounce

      searchPagination.cancel();
      expect(searchPagination.isSearching()).toBe(false);
    });
  });
});