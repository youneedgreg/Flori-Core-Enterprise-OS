/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class ChatService {
  private anthropic: Anthropic;

  constructor(private prisma: PrismaService) {
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

    // 2. Save user message
    await this.prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: 'user',
        content,
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

    try {
      // 4. Call Anthropic
      const response = await this.anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        system:
          'You are a helpful AI assistant for Flori-Core Enterprise OS, a farm management and cold chain logistics platform. Provide concise and accurate answers.',
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
}
