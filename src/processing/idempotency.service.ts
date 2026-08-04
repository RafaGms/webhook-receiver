import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisClient } from './redis.client';

@Injectable()
export class IdempotencyService {
  private readonly ttlSeconds: number;

  constructor(
    private readonly redis: RedisClient,
    config: ConfigService,
  ) {
    this.ttlSeconds = config.getOrThrow<number>('IDEMPOTENCY_TTL');
  }

  async claim(eventId: string): Promise<boolean> {
    const result = await this.redis.set(
      this.key(eventId),
      '1',
      'EX',
      this.ttlSeconds,
      'NX',
    );

    return result === 'OK';
  }

  async release(eventId: string): Promise<void> {
    await this.redis.del(this.key(eventId));
  }

  private key(eventId: string): string {
    return `idempotency:${eventId}`;
  }
}
