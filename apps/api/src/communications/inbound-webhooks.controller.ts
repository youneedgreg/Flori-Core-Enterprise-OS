import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface TwilioWhatsAppBody {
  Body?: string;
  From: string;
}

interface ResendInboundBody {
  subject?: string;
  text?: string;
  html?: string;
}

@Controller('webhooks/communications')
export class InboundWebhooksController {
  constructor(private prisma: PrismaService) {}

  @Post('twilio-whatsapp')
  @HttpCode(200)
  async handleTwilioWhatsApp(@Body() body: TwilioWhatsAppBody) {
    // Twilio sends application/x-www-form-urlencoded payloads for incoming WhatsApp replies
    // Body.From = "whatsapp:+1234567890"
    // Body.Body = "Customer response"
    // Note: In production, tenantId and threadId should be resolved based on the sender's phone number or active conversational state.

    await this.prisma.communication.create({
      data: {
        tenantId: 'system', // Placeholder until routing logic is implemented
        direction: 'INBOUND',
        channel: 'WHATSAPP',
        body: body.Body || 'Incoming Media',
        entityType: 'UserReply',
      },
    });

    return '<Response></Response>'; // Return empty TwiML to acknowledge receipt
  }

  @Post('resend-inbound')
  @HttpCode(200)
  async handleResendInbound(@Body() body: ResendInboundBody) {
    // Handle Resend inbound email parsing webhooks

    await this.prisma.communication.create({
      data: {
        tenantId: 'system', // Placeholder until routing logic is implemented
        direction: 'INBOUND',
        channel: 'EMAIL',
        subject: body.subject || 'No Subject',
        body: body.text || body.html || '',
        entityType: 'UserReply',
      },
    });

    return { received: true };
  }
}
