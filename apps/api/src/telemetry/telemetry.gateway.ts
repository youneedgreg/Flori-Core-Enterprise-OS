import { Logger, OnModuleInit } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TelemetryService } from './telemetry.service';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class TelemetryGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('TelemetryGateway');

  constructor(
    private readonly telemetryService: TelemetryService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    // Start simulation for cold rooms
    setInterval(() => {
      this.simulateTelemetry();
    }, 5000); // every 5 seconds
  }

  afterInit(server: Server) {
    this.logger.log('🚀 Telemetry WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`👤 Telemetry Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`👋 Telemetry Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe-to-telemetry')
  handleSubscription(client: Socket, data: { tenantId: string }) {
    this.logger.log(`📊 Client ${client.id} subscribed to telemetry for tenant: ${data.tenantId}`);
    client.join(`telemetry-tenant-${data.tenantId}`);
  }

  private async simulateTelemetry() {
    try {
      // Find all temperature/moisture devices
      const devices = await (this.prisma as any).ioTDevice.findMany();
      
      for (const device of devices) {
        let value: number;
        let unit: string;

        if (device.type === 'TEMPERATURE') {
          // Simulate cold room temp (e.g. 2.0°C to 5.0°C)
          value = 3.5 + (Math.random() - 0.5) * 1.5;
          unit = '°C';
        } else {
          // Simulate soil moisture (e.g. 40% to 65%)
          value = 52 + (Math.random() - 0.5) * 12;
          unit = '%';
        }

        const reading = {
          deviceId: device.id,
          deviceName: device.macAddress,
          value: parseFloat(value.toFixed(2)),
          unit,
          timestamp: new Date(),
        };

        // Record in DB
        void this.telemetryService.record(device.tenantId, device.id, reading.value, reading.unit);

        // Broadcast to tenant room
        this.server.to(`telemetry-tenant-${device.tenantId}`).emit('telemetry-update', reading);
      }
    } catch (e) {
      this.logger.error('Telemetry simulation failed:', e);
    }
  }
}
