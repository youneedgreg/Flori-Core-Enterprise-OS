/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatActionService } from './chat.action.service';
import { ChatContextService } from './chat-context.service';
import { ChatDataService } from './chat.data.service';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class ChatService {
  private anthropic: Anthropic;

  constructor(
    private prisma: PrismaService,
    private chatAction: ChatActionService,
    private chatContext: ChatContextService,
    private chatData: ChatDataService,
  ) {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });
  }

  async getSessions(tenantId: string, userId: string) {
    return this.prisma.chatSession.findMany({
      where: { tenantId, userId },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });
  }

  async getSessionMessages(
    tenantId: string,
    userId: string,
    sessionId: string,
  ) {
    // Verify ownership
    const session = await this.prisma.chatSession.findFirst({
      where: { id: sessionId, tenantId, userId },
    });

    if (!session) {
      throw new HttpException('Session not found', HttpStatus.NOT_FOUND);
    }

    return this.prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createSession(tenantId: string, userId: string, title?: string) {
    return this.prisma.chatSession.create({
      data: {
        tenantId,
        userId,
        title: title || 'New Conversation',
      },
    });
  }

  async sendMessage(
    tenantId: string,
    userId: string,
    sessionId: string,
    content: string,
    attachments?: any[],
  ) {
    // 1. Verify session & tenant limits
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { aiTokenBudget: true, aiTokensUsed: true },
    });

    if (!tenant)
      throw new HttpException('Tenant not found', HttpStatus.NOT_FOUND);

    if (tenant.aiTokensUsed >= tenant.aiTokenBudget) {
      throw new HttpException(
        'Token budget exceeded. Please contact administrator.',
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    let session = await this.prisma.chatSession.findFirst({
      where: { id: sessionId, tenantId, userId },
    });

    if (!session) {
      session = await this.createSession(
        tenantId,
        userId,
        content.slice(0, 50),
      );
    }

    // Map attachments for DB - don't store full base64 data to save space
    const dbAttachments = attachments?.map((att) => ({
      name: att.name,
      type: att.type,
      size: att.size,
    }));

    // 2. Save user message
    await this.prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: 'user',
        content,
        attachments: dbAttachments ? (dbAttachments as any) : undefined,
      },
    });

    // 3. Fetch past messages for context
    const pastMessages = await this.prisma.chatMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'asc' },
      take: 20, // last 20 messages for context
    });

    const anthropicMessages = pastMessages.map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    })) as Anthropic.MessageParam[];

    // Add current message with attachments
    const currentMessageContent: any[] = [];
    if (attachments && attachments.length > 0) {
      for (const att of attachments) {
        if (att.type.startsWith('image/') && att.data) {
          const base64Data = att.data.split(',')[1];
          currentMessageContent.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: att.type as any,
              data: base64Data,
            },
          });
        } else if (att.type === 'text/csv' && att.data) {
          // If CSV, decode base64 and add as text
          const base64Data = att.data.split(',')[1] || att.data;
          const decodedCsv = Buffer.from(base64Data, 'base64').toString(
            'utf-8',
          );
          currentMessageContent.push({
            type: 'text',
            text: `CSV File Content (${att.name}):\n${decodedCsv}`,
          });
        }
      }
    }

    if (content) {
      currentMessageContent.push({
        type: 'text',
        text: content,
      });
    }

    if (currentMessageContent.length > 0) {
      anthropicMessages.push({
        role: 'user',
        content: currentMessageContent,
      });
    }

    try {
      // 4. Build context-aware system prompt
      const systemPrompt = await this.chatContext.buildSystemPrompt(
        tenantId,
        userId,
        content,
      );

      const chatTools: Anthropic.Tool[] = [
        {
          name: 'getHarvestStats',
          description:
            'Get daily harvest statistics (stems, rejected stems) for a specific date range.',
          input_schema: {
            type: 'object',
            properties: {
              startDate: {
                type: 'string',
                description: 'Start date in YYYY-MM-DD format',
              },
              endDate: {
                type: 'string',
                description: 'End date in YYYY-MM-DD format',
              },
            },
            required: ['startDate', 'endDate'],
          },
        },
        {
          name: 'getEmployeeKPIs',
          description: 'Get top employees by KPI score.',
          input_schema: {
            type: 'object',
            properties: {
              limit: {
                type: 'number',
                description: 'Number of employees to return (default 5)',
              },
              metricType: {
                type: 'string',
                description: 'Optional KPI name to filter by',
              },
            },
            required: [],
          },
        },
        {
          name: 'getInventoryStock',
          description:
            'Get current stock levels for general store items and flowers.',
          input_schema: {
            type: 'object',
            properties: {
              searchTerm: {
                type: 'string',
                description: 'Optional item name or SKU to search for',
              },
            },
            required: [],
          },
        },
        {
          name: 'getExpiringDocuments',
          description:
            'Get employee documents and training certificates expiring soon.',
          input_schema: {
            type: 'object',
            properties: {
              daysThreshold: {
                type: 'number',
                description:
                  'Number of days from now to check for expiry (default 30)',
              },
            },
            required: [],
          },
        },
        {
          name: 'getFinancialSummary',
          description:
            'Get total revenue, expenses, and net profit for a given date range.',
          input_schema: {
            type: 'object',
            properties: {
              startDate: {
                type: 'string',
                description: 'Start date in YYYY-MM-DD format',
              },
              endDate: {
                type: 'string',
                description: 'End date in YYYY-MM-DD format',
              },
            },
            required: ['startDate', 'endDate'],
          },
        },
      ];

      // 5. Call Anthropic
      let response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: systemPrompt,
        messages: anthropicMessages,
        tools: chatTools,
      });

      let inputTokens = response.usage.input_tokens;
      let outputTokens = response.usage.output_tokens;

      // Handle tool calls
      while (response.stop_reason === 'tool_use') {
        const toolUse = response.content.find(
          (c) => c.type === 'tool_use',
        ) as Anthropic.ToolUseBlock;
        if (!toolUse) break;

        anthropicMessages.push({
          role: 'assistant',
          content: response.content,
        });

        const toolArgs = toolUse.input as Record<string, any>;
        let toolResultData: any;

        try {
          switch (toolUse.name) {
            case 'getHarvestStats':
              toolResultData = await this.chatData.getHarvestStats(
                tenantId,
                toolArgs.startDate,
                toolArgs.endDate,
              );
              break;
            case 'getEmployeeKPIs':
              toolResultData = await this.chatData.getEmployeeKPIs(
                tenantId,
                toolArgs.limit,
                toolArgs.metricType,
              );
              break;
            case 'getInventoryStock':
              toolResultData = await this.chatData.getInventoryStock(
                tenantId,
                toolArgs.searchTerm,
              );
              break;
            case 'getExpiringDocuments':
              toolResultData = await this.chatData.getExpiringDocuments(
                tenantId,
                toolArgs.daysThreshold,
              );
              break;
            case 'getFinancialSummary':
              toolResultData = await this.chatData.getFinancialSummary(
                tenantId,
                toolArgs.startDate,
                toolArgs.endDate,
              );
              break;
            default:
              toolResultData = { error: `Unknown tool ${toolUse.name}` };
          }
        } catch (e: any) {
          toolResultData = { error: e.message };
        }

        anthropicMessages.push({
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: JSON.stringify(toolResultData),
            },
          ],
        });

        response = await this.anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2048,
          system: systemPrompt,
          messages: anthropicMessages,
          tools: chatTools,
        });

        inputTokens += response.usage.input_tokens;
        outputTokens += response.usage.output_tokens;
      }

      const textContent = response.content.find(
        (c) => c.type === 'text',
      ) as Anthropic.TextBlock;
      const responseContent = textContent
        ? textContent.text
        : 'No text response';
      const totalTokens = inputTokens + outputTokens;

      // 6. Save assistant message
      const assistantMessage = await this.prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          role: 'assistant',
          content: responseContent,
          tokensUsed: totalTokens,
        },
      });

      // 7. Update tenant token usage and session timestamp
      await this.prisma.$transaction([
        this.prisma.tenant.update({
          where: { id: tenantId },
          data: { aiTokensUsed: { increment: totalTokens } },
        }),
        this.prisma.chatSession.update({
          where: { id: session.id },
          data: { updatedAt: new Date() },
        }),
      ]);

      return assistantMessage;
    } catch (error: any) {
      console.error('Anthropic API Error:', error);
      throw new HttpException(
        'Failed to generate AI response',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async executeAction(
    tenantId: string,
    userId: string,
    sessionId: string,
    actionType: string,
    payload: any,
  ) {
    // Verify session
    const session = await this.prisma.chatSession.findFirst({
      where: { id: sessionId, tenantId, userId },
    });

    if (!session) {
      throw new HttpException('Session not found', HttpStatus.NOT_FOUND);
    }

    return this.chatAction.executeAction(tenantId, userId, actionType, payload);
  }
}
