import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { corsOptions } from '../config/cors';

@WebSocketGateway({ namespace: 'notifications', cors: corsOptions })
export class NotificationsGateway {
  @WebSocketServer()
  server: Server;

  emitToUser(userId: string, event: string, payload: any) {
    // In a real application, client sockets join 'user_{id}' rooms on connection.
    this.server.to(`user_${userId}`).emit(event, payload);
  }

  emitToTenant(tenantId: string, event: string, payload: any) {
    this.server.to(`tenant_${tenantId}`).emit(event, payload);
  }
}
