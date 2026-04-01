/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-misused-promises */
import {
  Injectable,
  OnModuleInit,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import * as mqtt from 'mqtt';
import { TelemetryService } from '../telemetry/telemetry.service';
import { PrismaService } from '../prisma/prisma.service';

interface MqttPayload {
  macAddress: string;
  type: string;
  value: number;
  unit?: string;
}

@Injectable()
export class MqttService implements OnModuleInit {
  private client: mqtt.MqttClient;
  private readonly logger = new Logger(MqttService.name);

  constructor(
    @Inject(forwardRef(() => TelemetryService))
    private readonly telemetryService: TelemetryService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    this.connect();
  }

  private connect() {
    const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
    this.client = mqtt.connect(brokerUrl);

    this.client.on('connect', () => {
      this.logger.log(`Connected to EMQX Broker: ${brokerUrl}`);
      // farm/{tenant_id}/zone/{zone_id}/sensor
      this.client.subscribe('farm/+/zone/+/sensor', (err) => {
        if (!err) {
          this.logger.log('Subscribed to all farm clusters');
        }
      });
    });

    this.client.on('message', async (topic, message) => {
      await this.handleMessage(topic, message.toString());
    });

    this.client.on('error', (err) => {
      this.logger.error('MQTT Connection Error:', err);
    });
  }

  private async handleMessage(topic: string, payload: string) {
    const topicParts = topic.split('/');
    const tenantId = topicParts[1];
    // const zoneId = topicParts[3]; // Not currently used

    try {
      const data: MqttPayload = JSON.parse(payload);
      // Expected payload: { "macAddress": "...", "value": 45.2, "type": "MOISTURE", "unit": "%" }

      const device = await this.prisma.ioTDevice.findUnique({
        where: { macAddress: data.macAddress },
      });

      if (!device) {
        this.logger.warn(
          `Unknown device reported: ${data.macAddress} for tenant ${tenantId}`,
        );
        return;
      }

      await this.telemetryService.record(
        tenantId,
        device.id,
        data.value,
        data.unit || '%',
        data.type || 'MOISTURE',
      );

      this.logger.log(
        `Recorded MQTT telemetry: ${data.type} ${data.value} from ${device.macAddress}`,
      );
    } catch (e) {
      if (e instanceof Error) {
        this.logger.error(
          `Failed to parse MQTT message on topic ${topic}: ${payload}`,
          e.stack,
        );
      } else {
        this.logger.error(
          `Failed to parse MQTT message on topic ${topic}: ${payload}`,
        );
      }
    }
  }

  // Method to send commands to actuators (valves, pumps)
  sendCommand(tenantId: string, deviceId: string, command: string) {
    const topic = `farm/${tenantId}/device/${deviceId}/actuator`;
    this.client.publish(
      topic,
      JSON.stringify({ command, timestamp: new Date() }),
    );
    this.logger.warn(`Sent MQTT command: ${command} to ${deviceId}`);
  }
}
