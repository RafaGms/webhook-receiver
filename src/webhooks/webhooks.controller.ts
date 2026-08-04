import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { PaymentWebhookDto } from '../common/dto/payment-webhook.dto';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('payments')
  @HttpCode(HttpStatus.OK)
  receive(@Body() payload: PaymentWebhookDto) {
    return this.webhooksService.handle(payload);
  }
}
