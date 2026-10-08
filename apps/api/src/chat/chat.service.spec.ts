/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
import {
  ChatService,
  MAX_TOOL_ROUNDS,
  STEP_LIMIT_MESSAGE,
  parseToolArguments,
} from './chat.service';
import { ChatActionService } from './chat.action.service';
import { ChatContextService } from './chat-context.service';
import { ChatDataService } from './chat.data.service';
import { PrismaService } from '../prisma/prisma.service';

const usage = { input_tokens: 10, output_tokens: 5 };

const toolUse = (id: string, name: string, input: object = {}) => ({
  type: 'tool_use',
  id,
  name,
  input,
});
const text = (t: string) => ({ type: 'text', text: t });

function makePrisma(history: { role: string; content: string }[] = []) {
  return {
    tenant: {
      findUnique: jest
        .fn()
        .mockResolvedValue({ aiTokenBudget: 1_000_000, aiTokensUsed: 0 }),
      update: jest.fn().mockReturnValue('tenant-update'),
    },
    chatSession: {
      findFirst: jest.fn().mockResolvedValue({ id: 'session-1' }),
      update: jest.fn().mockReturnValue('session-update'),
    },
    chatMessage: {
      create: jest
        .fn()
        .mockImplementation(({ data }) =>
          Promise.resolve({ id: `msg-${data.role}`, ...data }),
        ),
      findMany: jest.fn().mockResolvedValue(history),
    },
    $transaction: jest.fn().mockResolvedValue([]),
  };
}

describe('ChatService', () => {
  let service: ChatService;
  let prisma: ReturnType<typeof makePrisma>;
  let chatData: Record<string, jest.Mock>;
  let anthropicCreate: jest.Mock;
  let mistralCreate: jest.Mock;

  async function build(history?: { role: string; content: string }[]) {
    prisma = makePrisma(history);
    chatData = {
      getHarvestStats: jest.fn().mockResolvedValue({ stems: 1200 }),
      getInventoryStock: jest.fn().mockResolvedValue({ items: 3 }),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: PrismaService, useValue: prisma },
        { provide: ChatActionService, useValue: {} },
        {
          provide: ChatContextService,
          useValue: { buildSystemPrompt: jest.fn().mockResolvedValue('sys') },
        },
        { provide: ChatDataService, useValue: chatData },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    anthropicCreate = jest.fn();
    mistralCreate = jest.fn();
    (service as any).anthropic = { messages: { create: anthropicCreate } };
    (service as any).mistral = {
      chat: { completions: { create: mistralCreate } },
    };
  }

  beforeEach(async () => {
    await build();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('answers every tool_use block when Claude requests several tools at once', async () => {
    anthropicCreate
      .mockResolvedValueOnce({
        stop_reason: 'tool_use',
        usage,
        content: [
          toolUse('t1', 'getHarvestStats', {
            startDate: '2026-10-01',
            endDate: '2026-10-07',
          }),
          toolUse('t2', 'getInventoryStock', { searchTerm: 'roses' }),
        ],
      })
      .mockResolvedValueOnce({
        stop_reason: 'end_turn',
        usage,
        content: [text('1,200 stems harvested; 3 items in stock.')],
      });

    const reply = await service.sendMessage(
      'tenant-1',
      'user-1',
      'session-1',
      'How are we doing?',
    );

    expect(chatData.getHarvestStats).toHaveBeenCalledWith(
      'tenant-1',
      '2026-10-01',
      '2026-10-07',
    );
    expect(chatData.getInventoryStock).toHaveBeenCalledWith(
      'tenant-1',
      'roses',
    );

    const secondCall = anthropicCreate.mock.calls[1][0];
    const toolResults = secondCall.messages.at(-1).content;
    expect(toolResults.map((r: any) => r.tool_use_id)).toEqual(['t1', 't2']);
    expect(reply.content).toBe('1,200 stems harvested; 3 items in stock.');
  });

  it('stops after MAX_TOOL_ROUNDS instead of looping forever', async () => {
    anthropicCreate.mockResolvedValue({
      stop_reason: 'tool_use',
      usage,
      content: [toolUse('t', 'getInventoryStock')],
    });

    const reply = await service.sendMessage(
      'tenant-1',
      'user-1',
      'session-1',
      'loop',
    );

    expect(anthropicCreate).toHaveBeenCalledTimes(MAX_TOOL_ROUNDS + 1);
    expect(reply.content).toBe(STEP_LIMIT_MESSAGE);
  });

  it('charges the tenant for every provider call, including a failed Claude attempt', async () => {
    anthropicCreate
      .mockResolvedValueOnce({
        stop_reason: 'tool_use',
        usage,
        content: [toolUse('t1', 'getInventoryStock')],
      })
      .mockRejectedValueOnce(new Error('overloaded'));
    mistralCreate.mockResolvedValueOnce({
      usage: { total_tokens: 40 },
      choices: [{ message: { role: 'assistant', content: 'From Mistral' } }],
    });

    const reply = await service.sendMessage(
      'tenant-1',
      'user-1',
      'session-1',
      'stock?',
    );

    expect(reply.content).toBe('From Mistral');
    expect(prisma.tenant.update).toHaveBeenCalledWith({
      where: { id: 'tenant-1' },
      data: { aiTokensUsed: { increment: 15 + 40 } },
    });
  });

  it('starts the Mistral fallback from the plain conversation, not Claude tool blocks', async () => {
    anthropicCreate
      .mockResolvedValueOnce({
        stop_reason: 'tool_use',
        usage,
        content: [toolUse('t1', 'getInventoryStock')],
      })
      .mockRejectedValueOnce(new Error('overloaded'));
    mistralCreate.mockResolvedValueOnce({
      usage: { total_tokens: 1 },
      choices: [{ message: { role: 'assistant', content: 'ok' } }],
    });

    await service.sendMessage('tenant-1', 'user-1', 'session-1', 'stock?');

    const messages = mistralCreate.mock.calls[0][0].messages;
    expect(messages).toEqual([
      { role: 'system', content: 'sys' },
      { role: 'user', content: 'stock?' },
    ]);
  });

  it('returns malformed Mistral tool arguments to the model as an error instead of throwing', async () => {
    anthropicCreate.mockRejectedValue(new Error('down'));
    mistralCreate
      .mockResolvedValueOnce({
        usage: { total_tokens: 1 },
        choices: [
          {
            message: {
              role: 'assistant',
              content: null,
              tool_calls: [
                {
                  id: 'c1',
                  type: 'function',
                  function: {
                    name: 'getInventoryStock',
                    arguments: '{bad json',
                  },
                },
              ],
            },
          },
        ],
      })
      .mockResolvedValueOnce({
        usage: { total_tokens: 1 },
        choices: [
          { message: { role: 'assistant', content: 'Sorry, retrying.' } },
        ],
      });

    const reply = await service.sendMessage(
      'tenant-1',
      'user-1',
      'session-1',
      'stock?',
    );

    expect(chatData.getInventoryStock).not.toHaveBeenCalled();
    const toolMessage = mistralCreate.mock.calls[1][0].messages.at(-1);
    expect(toolMessage).toEqual({
      role: 'tool',
      tool_call_id: 'c1',
      content: JSON.stringify({ error: 'Tool arguments were not valid JSON' }),
    });
    expect(reply.content).toBe('Sorry, retrying.');
  });

  it('sends the most recent history once, without repeating the new message', async () => {
    // findMany is ordered newest-first; the service must restore order and
    // drop a leading assistant turn.
    await build([
      { role: 'user', content: 'second question' },
      { role: 'assistant', content: 'first answer' },
      { role: 'user', content: 'first question' },
      { role: 'assistant', content: 'greeting' },
    ]);
    anthropicCreate.mockResolvedValueOnce({
      stop_reason: 'end_turn',
      usage,
      content: [text('done')],
    });

    await service.sendMessage(
      'tenant-1',
      'user-1',
      'session-1',
      'third question',
    );

    expect(prisma.chatMessage.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { sessionId: 'session-1', id: { not: 'msg-user' } },
        orderBy: { createdAt: 'desc' },
      }),
    );
    const sent = anthropicCreate.mock.calls[0][0].messages;
    expect(
      sent.map((m: any) =>
        typeof m.content === 'string' ? m.content : m.content[0].text,
      ),
    ).toEqual([
      'first question',
      'first answer',
      'second question',
      'third question',
    ]);
  });
});

describe('parseToolArguments', () => {
  it('parses objects and rejects everything else without throwing', () => {
    expect(parseToolArguments('{"limit":5}')).toEqual({ limit: 5 });
    expect(parseToolArguments('')).toEqual({});
    expect(parseToolArguments('{oops')).toBeNull();
    expect(parseToolArguments('[1]')).toBeNull();
  });
});
