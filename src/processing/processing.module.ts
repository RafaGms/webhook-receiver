import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { IdempotencyService } from './idempotency.service';
import { PaymentHandlerService } from './payment-handler.service';
import { RedisClient } from './redis.client';
import { ReprocessController } from './reprocess.controller';
import { ReprocessService } from './reprocess.service';

@Module({
  imports: [EventsModule],
  controllers: [ReprocessController],
  providers: [
    RedisClient,
    IdempotencyService,
    PaymentHandlerService,
    ReprocessService,
  ],
  exports: [IdempotencyService, PaymentHandlerService],
})
export class ProcessingModule {}
