import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { ChatActionService } from './chat.action.service';
import { ChatContextService } from './chat-context.service';
import { ChatDataService } from './chat.data.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ChatService', () => {
  let service: ChatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: PrismaService, useValue: {} },
        { provide: ChatActionService, useValue: {} },
        { provide: ChatContextService, useValue: {} },
        { provide: ChatDataService, useValue: {} },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
