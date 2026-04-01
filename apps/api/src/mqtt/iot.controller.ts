/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Controller, Get, Post, Body, Req, Param, Patch } from '@nestjs/common';
import { AlertsService } from '../alerts/alerts.service';
import { AutomationRulesService } from '../automation-rules/automation-rules.service';
import { MqttService } from '../mqtt/mqtt.service';

@Controller('iot')
export class IotController {
  constructor(
    private readonly alertsService: AlertsService,
    private readonly automationRulesService: AutomationRulesService,
    private readonly mqttService: MqttService,
  ) {}

  @Get('alerts')
  async getAlerts(@Req() req: { tenantId: string }) {
    return this.alertsService.findAll(req.tenantId);
  }

  @Patch('alerts/:id/resolve')
  async resolveAlert(
    @Req() req: { tenantId: string },
    @Param('id') id: string,
  ) {
    return this.alertsService.resolve(req.tenantId, id);
  }

  @Get('rules')
  async getRules(@Req() req: { tenantId: string }) {
    return this.automationRulesService.findAll(req.tenantId);
  }

  @Post('rules')
  async createRule(
    @Req() req: { tenantId: string },
    @Body()
    data: {
      name: string;
      zoneId?: string;
      sensorType: string;
      operator: string;
      threshold: number;
      action: string;
      isActive?: boolean;
    },
  ) {
    return this.automationRulesService.create(req.tenantId, data);
  }

  @Post('command')
  sendCommand(
    @Req() req: { tenantId: string },
    @Body() data: { deviceId: string; command: string },
  ) {
    return this.mqttService.sendCommand(
      req.tenantId,
      data.deviceId,
      data.command,
    );
  }
}
