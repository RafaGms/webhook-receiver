import { Injectable, Logger } from '@nestjs/common';
import { PaymentWebhookDto } from '../common/dto/payment-webhook.dto';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  handle(payload: PaymentWebhookDto): { received: boolean } {
    this.logger.log(`received ${payload.type} (${payload.eventId})`);

    return { received: true };
  }
}
