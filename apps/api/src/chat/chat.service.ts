/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatActionService } from './chat.action.service';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class ChatService {
  private anthropic: Anthropic;

  constructor(
    private prisma: PrismaService,
    private chatAction: ChatActionService
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
          const decodedCsv = Buffer.from(base64Data, 'base64').toString('utf-8');
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
      // 4. Call Anthropic
      const response = await this.anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        system:
          'You are a helpful AI assistant for Flori-Core Enterprise OS. If the user uploads a delivery note, extract the data and return ONLY an action preview block using this format exactly: <action-preview>{"type":"CREATE_GRN","payload":{"vendorName":"...","items":[{"sku":"...","quantity":0,"unitPrice":0}]}}</action-preview>. If the user uploads a spray log, extract the data and return: <action-preview>{"type":"CREATE_SPRAY_LOG","payload":{"chemicalName":"...","zoneId":"","phiDays":0,"quantity":0,"unit":"L","date":"..."}}</action-preview>. If the user uploads a CSV inventory, extract: <action-preview>{"type":"IMPORT_INVENTORY","payload":{"items":[{"sku":"...","name":"...","category":"...","quantity":0,"unitCost":0}]}}</action-preview>. Otherwise, answer normally.',
        messages: anthropicMessages,
      });

      const responseContent =
        response.content[0].type === 'text'
          ? response.content[0].text
          : 'No text response';
      const inputTokens = response.usage.input_tokens;
      const outputTokens = response.usage.output_tokens;
      const totalTokens = inputTokens + outputTokens;

      // 5. Save assistant message
      const assistantMessage = await this.prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          role: 'assistant',
          content: responseContent,
          tokensUsed: totalTokens,
        },
      });

      // 6. Update tenant token usage and session timestamp
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
