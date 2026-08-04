import { Injectable, Logger } from '@nestjs/common';
import { PaymentWebhookDto } from '../common/dto/payment-webhook.dto';
import { EventsService } from '../events/events.service';
import { IdempotencyService } from '../processing/idempotency.service';
import { PaymentHandlerService } from '../processing/payment-handler.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly eventsService: EventsService,
    private readonly idempotencyService: IdempotencyService,
    private readonly paymentHandler: PaymentHandlerService,
  ) {}

  async handle(payload: PaymentWebhookDto, rawBody?: Buffer) {
    const event = await this.eventsService.record(
      payload.eventId,
      payload.type,
      this.storedPayload(payload, rawBody),
    );

    const claimed = await this.idempotencyService.claim(payload.eventId);

    if (!claimed) {
      const duplicate = await this.eventsService.markDuplicate(event);
      this.logger.warn(`skipping duplicate of ${payload.eventId}`);

      return { id: duplicate.id, status: duplicate.status };
    }

    try {
      await this.paymentHandler.handle(event);
      const processed = await this.eventsService.markProcessed(event);

      return { id: processed.id, status: processed.status };
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      const failed = await this.eventsService.markFailed(event, reason);
      this.logger.error(`failed to process ${payload.eventId}: ${reason}`);

      return { id: failed.id, status: failed.status };
    }
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
