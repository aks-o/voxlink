import { CacheService } from '../cache.service';

// Mock Redis client
const mockRedisClient = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  get: jest.fn(),
  setEx: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  mGet: jest.fn(),
  multi: jest.fn(() => ({
    setEx: jest.fn().mockReturnThis(),
    sAdd: jest.fn().mockReturnThis(),
    del: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  })),
  sMembers: jest.fn(),
  incrBy: jest.fn(),
  expire: jest.fn(),
  ttl: jest.fn(),
  flushDb: jest.fn(),
  ping: jest.fn(),
  on: jest.fn(),
};

jest.mock('redis', () => ({
  createClient: jest.fn(() => mockRedisClient),
}));

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    jest.clearAllMocks();
    cacheService = new CacheService({
      host: 'localhost',
      port: 6379,
      keyPrefix: 'test:',
      defaultTtl: 3600,
    });
  });

  describe('get', () => {
    it('should return null when not connected', async () => {
      const result = await cacheService.get('test-key');
      expect(result).toBeNull();
    });

    it('should return parsed JSON value when connected', async () => {
      // Simulate connection
      (cacheService as any).isConnected = true;
      const testData = { id: 1, name: 'test' };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(testData));

      const result = await cacheService.get('test-key');

      expect(mockRedisClient.get).toHaveBeenCalledWith('test:test-key');
      expect(result).toEqual(testData);
    });

    it('should return null when key does not exist', async () => {
      (cacheService as any).isConnected = true;
      mockRedisClient.get.mockResolvedValue(null);

      const result = await cacheService.get('test-key');

      expect(result).toBeNull();
    });

    it('should handle Redis errors gracefully', async () => {
      (cacheService as any).isConnected = true;
      mockRedisClient.get.mockRejectedValue(new Error('Redis error'));

      const result = await cacheService.get('test-key');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should return false when not connected', async () => {
      const result = await cacheService.set('test-key', 'test-value');
      expect(result).toBe(false);
    });

    it('should set value with default TTL when connected', async () => {
      (cacheService as any).isConnected = true;
      mockRedisClient.setEx.mockResolvedValue('OK');

      const result = await cacheService.set('test-key', 'test-value');

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        'test:test-key',
        3600,
        '"test-value"'
      );
      expect(result).toBe(true);
    });

    it('should set value with custom TTL', async () => {
      (cacheService as any).isConnected = true;
      mockRedisClient.setEx.mockResolvedValue('OK');

      const result = await cacheService.set('test-key', 'test-value', { ttl: 1800 });

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        'test:test-key',
        1800,
        '"test-value"'
      );
      expect(result).toBe(true);
    });

    it('should handle objects correctly', async () => {
      (cacheService as any).isConnected = true;
      mockRedisClient.setEx.mockResolvedValue('OK');
      const testObject = { id: 1, name: 'test' };

      const result = await cacheService.set('test-key', testObject);

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        'test:test-key',
        3600,
        JSON.stringify(testObject)
      );
      expect(result).toBe(true);
    });
  });

  describe('delete', () => {
    it('should return false when not connected', async () => {
      const result = await cacheService.delete('test-key');
      expect(result).toBe(false);
    });

    it('should delete key when connected', async () => {
      (cacheService as any).isConnected = true;
      mockRedisClient.del.mockResolvedValue(1);

      const result = await cacheService.delete('test-key');

      expect(mockRedisClient.del).toHaveBeenCalledWith('test:test-key');
      expect(result).toBe(true);
    });

    it('should return false when key does not exist', async () => {
      (cacheService as any).isConnected = true;
      mockRedisClient.del.mockResolvedValue(0);

      const result = await cacheService.delete('test-key');

      expect(result).toBe(false);
    });
  });

  describe('mget', () => {
    it('should return array of nulls when not connected', async () => {
      const result = await cacheService.mget(['key1', 'key2']);
      expect(result).toEqual([null, null]);
    });

    it('should return multiple values when connected', async () => {
      (cacheService as any).isConnected = true;
      const values = [JSON.stringify({ id: 1 }), null, JSON.stringify({ id: 2 })];
      mockRedisClient.mGet.mockResolvedValue(values);

      const result = await cacheService.mget(['key1', 'key2', 'key3']);

      expect(mockRedisClient.mGet).toHaveBeenCalledWith([
        'test:key1',
        'test:key2',
        'test:key3',
      ]);
      expect(result).toEqual([{ id: 1 }, null, { id: 2 }]);
    });
  });

  describe('mset', () => {
    it('should return false when not connected', async () => {
      const result = await cacheService.mset([
        { key: 'key1', value: 'value1' },
        { key: 'key2', value: 'value2' },
      ]);
      expect(result).toBe(false);
    });

    it('should set multiple values when connected', async () => {
      (cacheService as any).isConnected = true;
      const mockPipeline = mockRedisClient.multi();
      mockPipeline.exec.mockResolvedValue([]);

      const result = await cacheService.mset([
        { key: 'key1', value: 'value1' },
        { key: 'key2', value: 'value2', options: { ttl: 1800 } },
      ]);

      expect(mockPipeline.setEx).toHaveBeenCalledTimes(2);
      expect(result).toBe(true);
    });
  });

  describe('invalidateByTag', () => {
    it('should return 0 when not connected', async () => {
      const result = await cacheService.invalidateByTag('test-tag');
      expect(result).toBe(0);
    });

    it('should invalidate keys by tag when connected', async () => {
      (cacheService as any).isConnected = true;
      mockRedisClient.sMembers.mockResolvedValue(['key1', 'key2']);
      const mockPipeline = mockRedisClient.multi();
      mockPipeline.exec.mockResolvedValue([]);

      const result = await cacheService.invalidateByTag('test-tag');

      expect(mockRedisClient.sMembers).toHaveBeenCalledWith('test:tag:test-tag');
      expect(mockPipeline.del).toHaveBeenCalledTimes(3); // 2 keys + tag set
      expect(result).toBe(2);
    });

    it('should return 0 when no keys found for tag', async () => {
      (cacheService as any).isConnected = true;
      mockRedisClient.sMembers.mockResolvedValue([]);

      const result = await cacheService.invalidateByTag('test-tag');

      expect(result).toBe(0);
    });
  });

  describe('increment', () => {
    it('should return 0 when not connected', async () => {
      const result = await cacheService.increment('counter');
      expect(result).toBe(0);
    });

    it('should increment counter when connected', async () => {
      (cacheService as any).isConnected = true;
      mockRedisClient.incrBy.mockResolvedValue(5);

      const result = await cacheService.increment('counter', 2);

      expect(mockRedisClient.incrBy).toHaveBeenCalledWith('test:counter', 2);
      expect(result).toBe(5);
    });
  });

  describe('ping', () => {
    it('should return false when not connected', async () => {
      const result = await cacheService.ping();
      expect(result).toBe(false);
    });

    it('should return true when connected and ping succeeds', async () => {
      (cacheService as any).isConnected = true;
      mockRedisClient.ping.mockResolvedValue('PONG');

      const result = await cacheService.ping();

      expect(result).toBe(true);
    });

    it('should return false when ping fails', async () => {
      (cacheService as any).isConnected = true;
      mockRedisClient.ping.mockRejectedValue(new Error('Ping failed'));

      const result = await cacheService.ping();

      expect(result).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return initial stats', () => {
      const stats = cacheService.getStats();

      expect(stats).toEqual({
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        errors: 0,
        hitRate: 0,
      });
    });

    it('should update stats after operations', async () => {
      (cacheService as any).isConnected = true;
      mockRedisClient.get.mockResolvedValue('"test-value"');
      mockRedisClient.setEx.mockResolvedValue('OK');

      await cacheService.get('test-key'); // Hit
      await cacheService.get('missing-key'); // Miss (null response)
      await cacheService.set('test-key', 'value'); // Set

      mockRedisClient.get.mockResolvedValue(null);
      await cacheService.get('missing-key'); // Miss

      const stats = cacheService.getStats();

      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(2);
      expect(stats.sets).toBe(1);
      expect(stats.hitRate).toBe(33.33333333333333); // 1/3 * 100
    });
  });

  describe('isHealthy', () => {
    it('should return false when not connected', () => {
      const result = cacheService.isHealthy();
      expect(result).toBe(false);
    });

    it('should return false when hit rate is low', () => {
      (cacheService as any).isConnected = true;
      (cacheService as any).stats.hitRate = 30;

      const result = cacheService.isHealthy();
      expect(result).toBe(false);
    });

    it('should return true when connected and hit rate is good', () => {
      (cacheService as any).isConnected = true;
      (cacheService as any).stats.hitRate = 75;

      const result = cacheService.isHealthy();
      expect(result).toBe(true);
    });
  });
});