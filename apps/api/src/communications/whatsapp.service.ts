import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Twilio } from 'twilio';
import { Communication } from '@prisma/client';

@Injectable()
export class WhatsappService {
  private client: Twilio;

  constructor(private prisma: PrismaService) {
    this.client = new Twilio(
      process.env.TWILIO_ACCOUNT_SID || 'AC_test_sid_placeholder',
      process.env.TWILIO_AUTH_TOKEN || 'test_token_placeholder',
    );
  }

  async sendWhatsAppMessage(data: {
    to: string;
    body: string;
    tenantId: string;
    entityType?: string;
    entityId?: string;
    threadId?: string;
  }): Promise<Communication> {
    const message = await this.client.messages.create({
      body: data.body,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886'}`,
      to: `whatsapp:${data.to}`,
    });

    return this.prisma.communication.create({
      data: {
        tenantId: data.tenantId,
        direction: 'OUTBOUND',
        channel: 'WHATSAPP',
        body: data.body,
        entityType: data.entityType,
        entityId: data.entityId,
        threadId: data.threadId || message.sid,
      },
    });
  }
}
