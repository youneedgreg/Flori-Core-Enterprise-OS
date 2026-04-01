/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  },
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('NotificationsGateway');

  afterInit() {
    this.logger.log('🚀 WebSocket Gateway initialized');

    // Simulate periodic live alerts for the demo
    setInterval(() => {
      this.sendSimulatedAlert();
    }, 30000); // every 30 seconds
  }

  handleConnection(client: Socket) {
    this.logger.log(`👤 Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`👋 Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe-to-notifications')
  handleSubscription(client: Socket, data: any) {
    this.logger.log(
      `🔔 Client ${client.id} subscribed to notifications for tenant: ${data.tenantId}`,
    );
    client.join(`tenant-${data.tenantId}`);
  }

  private sendSimulatedAlert() {
    const alerts = [
      'Low moisture detected in Zone B',
      'Truck 05 arrival at main gate',
      'Cold room temp variance: +0.5°C',
      'New purchase order awaits approval',
    ];
    const alert = alerts[Math.floor(Math.random() * alerts.length)];

    this.server.emit('notification', {
      id: Date.now(),
      title: 'Real-time Alert',
      message: alert,
      type: 'INFO',
      time: 'Just now',
    });
  }
}
