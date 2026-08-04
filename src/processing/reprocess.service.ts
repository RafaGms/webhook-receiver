import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventStatus } from '../events/event.entity';
import { EventsService } from '../events/events.service';
import { PaymentHandlerService } from './payment-handler.service';

@Injectable()
export class ReprocessService {
  private readonly logger = new Logger(ReprocessService.name);

  constructor(
    private readonly eventsService: EventsService,
    private readonly paymentHandler: PaymentHandlerService,
  ) {}

  async reprocess(id: string) {
    const event = await this.eventsService.findById(id);

    if (!event) {
      throw new NotFoundException(`event ${id} not found`);
    }

    if (event.status === EventStatus.Processed) {
      throw new ConflictException('event already processed');
    }

    if (event.status === EventStatus.Duplicate) {
      throw new ConflictException('event is a duplicate delivery');
    }

    this.logger.log(`replaying ${event.eventId}`);

    try {
      await this.paymentHandler.handle(event);
      const processed = await this.eventsService.markProcessed(event);

      return { id: processed.id, status: processed.status, error: null };
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      const failed = await this.eventsService.markFailed(event, reason);
      this.logger.error(`replay of ${event.eventId} failed: ${reason}`);

      return { id: failed.id, status: failed.status, error: failed.error };
    }
  }
}
