import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { WhatsappService } from './whatsapp.service';
import { NotificationService } from './notification.service';
import { NotificationsGateway } from './notifications.gateway';
import { InboundWebhooksController } from './inbound-webhooks.controller';

@Module({
  controllers: [InboundWebhooksController],
  providers: [
    EmailService,
    WhatsappService,
    NotificationService,
    NotificationsGateway,
  ],
  exports: [EmailService, WhatsappService, NotificationService],
})
export class CommunicationsModule {}
