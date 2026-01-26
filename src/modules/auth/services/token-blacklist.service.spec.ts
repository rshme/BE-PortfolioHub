import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { TokenBlacklistService } from './token-blacklist.service';

describe('TokenBlacklistService', () => {
  let service: TokenBlacklistService;
  let cacheManager: any;

  const mockCacheManager = {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenBlacklistService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<TokenBlacklistService>(TokenBlacklistService);
    cacheManager = module.get(CACHE_MANAGER);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addToBlacklist', () => {
    const token = 'test.jwt.token';
    const expiresIn = 3600; // 1 hour in seconds

    it('should add token to blacklist with correct TTL', async () => {
      mockCacheManager.set.mockResolvedValue(undefined);

      await service.addToBlacklist(token, expiresIn);

      expect(cacheManager.set).toHaveBeenCalledWith(
        'blacklist:token:test.jwt.token',
        'blacklisted',
        3600000, // TTL in milliseconds
      );
    });

    it('should convert seconds to milliseconds for TTL', async () => {
      mockCacheManager.set.mockResolvedValue(undefined);

      await service.addToBlacklist(token, 7200); // 2 hours

      expect(cacheManager.set).toHaveBeenCalledWith(
        expect.any(String),
        'blacklisted',
        7200000, // 2 hours in milliseconds
      );
    });

    it('should handle cache errors gracefully', async () => {
      mockCacheManager.set.mockRejectedValue(new Error('Redis error'));

      await expect(service.addToBlacklist(token, expiresIn)).rejects.toThrow(
        'Redis error',
      );
    });
  });

  describe('isBlacklisted', () => {
    const token = 'test.jwt.token';

    it('should return true if token is blacklisted', async () => {
      mockCacheManager.get.mockResolvedValue('blacklisted');

      const result = await service.isBlacklisted(token);

      expect(result).toBe(true);
      expect(cacheManager.get).toHaveBeenCalledWith(
        'blacklist:token:test.jwt.token',
      );
    });

    it('should return false if token is not blacklisted', async () => {
      mockCacheManager.get.mockResolvedValue(null);

      const result = await service.isBlacklisted(token);

      expect(result).toBe(false);
      expect(cacheManager.get).toHaveBeenCalledWith(
        'blacklist:token:test.jwt.token',
      );
    });

    it('should return false if token value is undefined', async () => {
      mockCacheManager.get.mockResolvedValue(undefined);

      const result = await service.isBlacklisted(token);

      expect(result).toBe(false);
    });

    it('should handle cache read errors', async () => {
      mockCacheManager.get.mockRejectedValue(new Error('Redis connection error'));

      await expect(service.isBlacklisted(token)).rejects.toThrow(
        'Redis connection error',
      );
    });
  });

  describe('removeFromBlacklist', () => {
    const token = 'test.jwt.token';

    it('should remove token from blacklist', async () => {
      mockCacheManager.del.mockResolvedValue(undefined);

      await service.removeFromBlacklist(token);

      expect(cacheManager.del).toHaveBeenCalledWith(
        'blacklist:token:test.jwt.token',
      );
    });

    it('should handle removal errors', async () => {
      mockCacheManager.del.mockRejectedValue(new Error('Redis delete error'));

      await expect(service.removeFromBlacklist(token)).rejects.toThrow(
        'Redis delete error',
      );
    });
  });

  describe('getBlacklistKey', () => {
    it('should generate correct Redis key format', async () => {
      const token = 'my.token.here';
      mockCacheManager.get.mockResolvedValue(null);

      await service.isBlacklisted(token);

      expect(cacheManager.get).toHaveBeenCalledWith(
        'blacklist:token:my.token.here',
      );
    });

    it('should handle tokens with special characters', async () => {
      const token = 'token-with-special.chars_123';
      mockCacheManager.get.mockResolvedValue(null);

      await service.isBlacklisted(token);

      expect(cacheManager.get).toHaveBeenCalledWith(
        'blacklist:token:token-with-special.chars_123',
      );
    });
  });

  describe('integration scenarios', () => {
    it('should successfully blacklist and check a token', async () => {
      const token = 'integration.test.token';
      const expiresIn = 3600;

      // Add to blacklist
      mockCacheManager.set.mockResolvedValue(undefined);
      await service.addToBlacklist(token, expiresIn);

      // Check if blacklisted
      mockCacheManager.get.mockResolvedValue('blacklisted');
      const isBlacklisted = await service.isBlacklisted(token);

      expect(isBlacklisted).toBe(true);
    });

    it('should handle multiple tokens independently', async () => {
      const token1 = 'token.one';
      const token2 = 'token.two';

      mockCacheManager.set.mockResolvedValue(undefined);
      await service.addToBlacklist(token1, 3600);

      mockCacheManager.get
        .mockResolvedValueOnce('blacklisted') // token1 is blacklisted
        .mockResolvedValueOnce(null); // token2 is not blacklisted

      const result1 = await service.isBlacklisted(token1);
      const result2 = await service.isBlacklisted(token2);

      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });
  });
});
