import { Injectable, Logger } from '@nestjs/common';
import { PaymentWebhookDto } from '../common/dto/payment-webhook.dto';
import { EventsService } from '../events/events.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private readonly eventsService: EventsService) {}

  async handle(payload: PaymentWebhookDto, rawBody?: Buffer) {
    const event = await this.eventsService.record(
      payload.eventId,
      payload.type,
      this.storedPayload(payload, rawBody),
    );

    this.logger.log(`received ${payload.type} (${payload.eventId})`);

    return { id: event.id, status: event.status };
  }

  private storedPayload(
    payload: PaymentWebhookDto,
    rawBody?: Buffer,
  ): Record<string, unknown> {
    if (!rawBody?.length) {
      return { ...payload };
    }

    return JSON.parse(rawBody.toString('utf8')) as Record<string, unknown>;
  }
}
