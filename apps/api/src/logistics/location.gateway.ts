import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

// NOTE: Ideally use WsJwtGuard, assuming standard JwtAuthGuard works or can be adapted
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/logistics',
})
export class LocationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(LocationGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Driver/Dispatcher Connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_tenant')
  handleJoinTenant(
    @MessageBody() data: { tenantId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `tenant_${data.tenantId}_logistics`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined room ${room}`);
  }

  @SubscribeMessage('driver_location_update')
  handleLocationUpdate(
    @MessageBody()
    data: {
      tenantId: string;
      driverId: string;
      lat: number;
      lng: number;
      heading?: number;
    },
  ) {
    const room = `tenant_${data.tenantId}_logistics`;
    // Broadcast location to all dispatchers listening in this tenant's logistics room
    this.server.to(room).emit('driver_location_broadcast', {
      driverId: data.driverId,
      lat: data.lat,
      lng: data.lng,
      heading: data.heading,
      timestamp: new Date(),
    });
  }
}
