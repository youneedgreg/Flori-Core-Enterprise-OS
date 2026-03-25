import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';
import { Notification } from '@prisma/client';

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private gateway: NotificationsGateway,
  ) {}

  async createNotification(data: {
    tenantId: string;
    userId: string;
    title: string;
    message: string;
  }) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const notification: Notification = await this.prisma.notification.create({
      data: {
        tenantId: data.tenantId,
        userId: data.userId,
        title: data.title,
        message: data.message,
        isRead: false,
      },
    });

    // Emitting real-time event to the specific user via Socket.io
    this.gateway.emitToUser(data.userId, 'new_notification', notification);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return notification;
  }
}
