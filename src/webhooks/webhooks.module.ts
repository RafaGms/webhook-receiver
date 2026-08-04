import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { SignatureGuard } from './signature.guard';
import { SignatureService } from './signature.service';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';

@Module({
  imports: [EventsModule],
  controllers: [WebhooksController],
  providers: [SignatureGuard, SignatureService, WebhooksService],
})
export class WebhooksModule {}
