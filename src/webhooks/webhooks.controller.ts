import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { PaymentWebhookDto } from '../common/dto/payment-webhook.dto';
import { SignatureGuard } from './signature.guard';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('payments')
  @UseGuards(SignatureGuard)
  @HttpCode(HttpStatus.OK)
  receive(
    @Body() payload: PaymentWebhookDto,
    @Req() request: RawBodyRequest<Request>,
  ) {
    return this.webhooksService.handle(payload, request.rawBody);
  }
}
