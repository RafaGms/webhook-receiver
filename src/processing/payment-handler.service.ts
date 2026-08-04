import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Event } from '../events/event.entity';

@Injectable()
export class PaymentHandlerService {
  private readonly logger = new Logger(PaymentHandlerService.name);
  private readonly failureRate: number;

  constructor(config: ConfigService) {
    this.failureRate = config.getOrThrow<number>('PROCESSING_FAILURE_RATE');
  }

  async handle(event: Event): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 50));

    if (Math.random() < this.failureRate) {
      throw new Error('payment provider is unavailable');
    }

    this.logger.log(`processed ${event.type} (${event.eventId})`);
  }
}
