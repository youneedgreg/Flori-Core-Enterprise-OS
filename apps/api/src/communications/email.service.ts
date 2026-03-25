/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;

  constructor(private prisma: PrismaService) {
    this.resend = new Resend(
      process.env.RESEND_API_KEY || 're_test_key_placeholder',
    );
  }

  async sendEmail(data: {
    to: string;
    subject: string;
    html: string;
    tenantId: string;
    entityType?: string;
    entityId?: string;
    threadId?: string;
  }) {
    const response = await this.resend.emails.send({
      from:
        process.env.RESEND_FROM_EMAIL || 'Flori-Core OS <noreply@floricore.io>',
      to: [data.to],
      subject: data.subject,
      html: data.html,
    });

    if (response.error) {
      throw new Error(`Resend Error: ${response.error.message}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return this.prisma.communication.create({
      data: {
        tenantId: data.tenantId,
        direction: 'OUTBOUND',
        channel: 'EMAIL',
        subject: data.subject,
        body: data.html,
        entityType: data.entityType,
        entityId: data.entityId,
        threadId: data.threadId || response.data?.id,
      },
    });
  }
}
