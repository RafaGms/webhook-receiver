import { Module } from '@nestjs/common';
import { IdempotencyService } from './idempotency.service';
import { RedisClient } from './redis.client';

@Module({
  providers: [RedisClient, IdempotencyService],
  exports: [IdempotencyService],
})
export class ProcessingModule {}
