/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('sessions')
  async getSessions(@Request() req: any) {
    const { tenantId, sub: userId } = req.user;
    return this.chatService.getSessions(tenantId, userId);
  }

  @Get('sessions/:id')
  async getSessionMessages(
    @Param('id') sessionId: string,
    @Request() req: any,
  ) {
    const { tenantId, sub: userId } = req.user;
    return this.chatService.getSessionMessages(tenantId, userId, sessionId);
  }

  @Post('sessions')
  async createSession(@Body('title') title: string, @Request() req: any) {
    const { tenantId, sub: userId } = req.user;
    return this.chatService.createSession(tenantId, userId, title);
  }

  @Post('sessions/:id/message')
  async sendMessage(
    @Param('id') sessionId: string,
    @Body('content') content: string,
    @Body('attachments') attachments: any[],
    @Body('currentPath') currentPath: string,
    @Request() req: any,
  ) {
    const { tenantId, sub: userId } = req.user;
    return this.chatService.sendMessage(
      tenantId,
      userId,
      sessionId,
      content,
      attachments,
      currentPath,
    );
  }

  @Post('sessions/:id/action')
  async executeAction(
    @Param('id') sessionId: string,
    @Body('actionType') actionType: string,
    @Body('payload') payload: any,
    @Request() req: any,
  ) {
    const { tenantId, sub: userId } = req.user;
    return this.chatService.executeAction(
      tenantId,
      userId,
      sessionId,
      actionType,
      payload,
    );
  }
}
