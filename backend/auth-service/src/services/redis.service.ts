import { Injectable } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService {
  private client: RedisClientType;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    this.client.on('error', (err) => console.error('Redis Client Error', err));
    this.client.connect();
  }

  /**
   * Store refresh token in Redis with expiration
   * @param userId - User ID
   * @param refreshToken - Refresh token string
   * @param daysToExpire - Days until expiration (7 or 30)
   */
  async storeRefreshToken(
    userId: string,
    refreshToken: string,
    daysToExpire: number
  ): Promise<void> {
    const key = `refresh_token:${userId}:${refreshToken}`;
    const expirationSeconds = daysToExpire * 24 * 60 * 60;

    await this.client.setEx(key, expirationSeconds, 'valid');
  }

  /**
   * Blacklist a token (for logout or token rotation)
   * @param token - Token to blacklist
   */
  async blacklistToken(token: string): Promise<void> {
    const key = `blacklist:${token}`;
    // Store for 30 days (max refresh token lifetime)
    await this.client.setEx(key, 30 * 24 * 60 * 60, 'blacklisted');
  }

  /**
   * Check if token is blacklisted
   * @param token - Token to check
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    const key = `blacklist:${token}`;
    const result = await this.client.get(key);
    return result === 'blacklisted';
  }

  /**
   * Store rate limiting data
   * @param identifier - IP address or user ID
   * @param limit - Request limit
   * @param windowSeconds - Time window in seconds
   */
  async checkRateLimit(
    identifier: string,
    limit: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number }> {
    const key = `rate_limit:${identifier}`;
    const current = await this.client.incr(key);

    if (current === 1) {
      // First request in window, set expiration
      await this.client.expire(key, windowSeconds);
    }

    const allowed = current <= limit;
    const remaining = Math.max(0, limit - current);

    return { allowed, remaining };
  }

  /**
   * Store session data
   * @param sessionId - Session ID
   * @param data - Session data
   * @param ttlSeconds - Time to live in seconds
   */
  async storeSession(
    sessionId: string,
    data: Record<string, any>,
    ttlSeconds: number
  ): Promise<void> {
    const key = `session:${sessionId}`;
    await this.client.setEx(key, ttlSeconds, JSON.stringify(data));
  }

  /**
   * Get session data
   * @param sessionId - Session ID
   */
  async getSession(sessionId: string): Promise<Record<string, any> | null> {
    const key = `session:${sessionId}`;
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Delete session
   * @param sessionId - Session ID
   */
  async deleteSession(sessionId: string): Promise<void> {
    const key = `session:${sessionId}`;
    await this.client.del(key);
  }

  /**
   * Cache data
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttlSeconds - Time to live in seconds
   */
  async cache(key: string, value: any, ttlSeconds: number): Promise<void> {
    await this.client.setEx(`cache:${key}`, ttlSeconds, JSON.stringify(value));
  }

  /**
   * Get cached data
   * @param key - Cache key
   */
  async getCached<T>(key: string): Promise<T | null> {
    const data = await this.client.get(`cache:${key}`);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Invalidate cache
   * @param key - Cache key
   */
  async invalidateCache(key: string): Promise<void> {
    await this.client.del(`cache:${key}`);
  }

  /**
   * Close Redis connection
   */
  async onModuleDestroy() {
    await this.client.quit();
  }
}
