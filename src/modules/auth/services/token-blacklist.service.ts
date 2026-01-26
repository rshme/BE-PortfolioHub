import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TokenBlacklistService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
  ) {}

  /**
   * Add a token to the blacklist
   * @param token - JWT token to blacklist
   * @param expiresIn - Time in seconds until token expires (TTL for Redis)
   */
  async addToBlacklist(token: string, expiresIn: number): Promise<void> {
    // Store token with its expiration time
    // The value doesn't matter, we just need the key to exist
    await this.cacheManager.set(
      this.getBlacklistKey(token),
      'blacklisted',
      expiresIn * 1000, // Convert to milliseconds
    );
  }

  /**
   * Check if a token is blacklisted
   * @param token - JWT token to check
   * @returns true if token is blacklisted, false otherwise
   */
  async isBlacklisted(token: string): Promise<boolean> {
    const result = await this.cacheManager.get(this.getBlacklistKey(token));
    return result !== null && result !== undefined;
  }

  /**
   * Get the Redis key for a blacklisted token
   * @param token - JWT token
   * @returns Redis key with prefix
   */
  private getBlacklistKey(token: string): string {
    return `blacklist:token:${token}`;
  }

  /**
   * Remove a token from the blacklist (optional, mainly for testing)
   * @param token - JWT token to remove
   */
  async removeFromBlacklist(token: string): Promise<void> {
    await this.cacheManager.del(this.getBlacklistKey(token));
  }
}
