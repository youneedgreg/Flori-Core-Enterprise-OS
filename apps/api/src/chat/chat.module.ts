import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatActionService } from './chat.action.service';
import { ChatContextService } from './chat-context.service';

import { PrismaModule } from '../prisma/prisma.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [PrismaModule, AuditLogModule],
  controllers: [ChatController],
  providers: [ChatService, ChatActionService, ChatContextService],
})
export class ChatModule {}
