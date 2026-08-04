import { Module } from '@nestjs/common';
import { IdempotencyService } from './idempotency.service';
import { PaymentHandlerService } from './payment-handler.service';
import { RedisClient } from './redis.client';

@Module({
  providers: [RedisClient, IdempotencyService, PaymentHandlerService],
  exports: [IdempotencyService, PaymentHandlerService],
})
export class ProcessingModule {}
