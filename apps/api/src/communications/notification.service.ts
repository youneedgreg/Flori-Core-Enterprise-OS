import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';

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
    const notification = await this.prisma.notification.create({
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

    return notification;
  }
}
