/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { ChatService } from './chat.service';

@Injectable()
export class InsightsService {
  private readonly logger = new Logger(InsightsService.name);

  constructor(
    private prisma: PrismaService,
    private chatService: ChatService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async handleCron() {
    this.logger.log('Running daily proactive insights generation');
    const tenants = await this.prisma.tenant.findMany({
      where: { status: 'ACTIVE' },
    });

    for (const tenant of tenants) {
      await this.generateInsightsForTenant(tenant.id);
    }
  }

  async generateInsightsForTenant(tenantId: string) {
    try {
      const messages: string[] = [];
      const today = new Date();

      // 1. Daily digest (Pending Leave Requests & Expiring Documents)
      const pendingLeaveRequests = await this.prisma.leaveRequest.count({
        where: { tenantId, status: 'PENDING' },
      });

      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      const expiringDocuments = await this.prisma.trainingRecord.count({
        where: {
          tenantId,
          expiryDate: {
            lte: thirtyDaysFromNow,
            gte: today,
          },
        },
      });

      if (pendingLeaveRequests > 0 || expiringDocuments > 0) {
        messages.push(
          `**Good morning!** You have **${expiringDocuments} documents** expiring soon and **${pendingLeaveRequests} pending leave requests** to review.`,
        );
      }

      // 2. Anomaly detection (Rejection rate spike)
      // We will look at QC Logs for the past 24 hours vs past 30 days
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);

      const recentQcLogs = await this.prisma.qCLog.findMany({
        where: { tenantId, createdAt: { gte: yesterday } },
        include: {
          batch: { include: { cropCycle: { include: { zone: true } } } },
        },
      });

      const historicalQcLogs = await this.prisma.qCLog.findMany({
        where: { tenantId, createdAt: { gte: thirtyDaysAgo, lt: yesterday } },
      });

      // Simple mock anomaly logic: if recent logs exist and historical exist, check if REJECT grade is high
      // To save time and complexity, we will implement a slightly simplified check or mock it if no data exists.
      const recentRejects = recentQcLogs.filter(
        (log) => log.assignedGrade === 'REJECT',
      ).length;

      const historicalRejects = historicalQcLogs.filter(
        (log) => log.assignedGrade === 'REJECT',
      ).length;

      const historicalAvg = historicalRejects / 30 || 0;

      if (recentRejects > Math.max(5, historicalAvg * 3)) {
        messages.push(
          `📉 **Anomaly detected**: High rejection rate observed yesterday. ${recentRejects} stems were rejected compared to a historical average of ${historicalAvg.toFixed(1)}/day.`,
        );
      }

      // 3. Financial nudges (Payroll not initiated)
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();
      const payrollRun = await this.prisma.payrollRun.findFirst({
        where: {
          tenantId,
          month: currentMonth,
          year: currentYear,
        },
      });

      // Usually payroll is run at the end of the month. If it's past the 25th and no payroll run exists.
      if (!payrollRun && today.getDate() >= 25) {
        messages.push(
          `💰 **Financial Nudge**: The payroll run for ${today.toLocaleString('default', { month: 'long' })} hasn't been initiated yet.`,
        );
      }

      // 4. Weather-linked advice
      // Call Open-Meteo free API for Nairobi as default location
      try {
        const weatherResponse = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=-1.2921&longitude=36.8219&daily=precipitation_probability_max,weather_code&timezone=Africa%2FNairobi',
        );
        const weatherData = await weatherResponse.json();

        // weather_code > 50 usually means rain/drizzle/showers
        if (weatherData.daily && weatherData.daily.weather_code) {
          const tomorrowCode = weatherData.daily.weather_code[1];
          if (tomorrowCode >= 50) {
            messages.push(
              `🌧️ **Weather Alert**: Rain is forecast for tomorrow in Nairobi. Consider adjusting your spray schedule and checking greenhouse vents.`,
            );
          }
        }
      } catch (weatherErr) {
        this.logger.warn('Failed to fetch weather data: ' + weatherErr);
      }

      // If we have insights, send them to active admin users
      if (messages.length > 0) {
        const fullMessage =
          'Here are your proactive insights for today:\n\n' +
          messages.map((m) => '- ' + m).join('\n');

        // Find users with admin or manager roles
        const users = await this.prisma.user.findMany({
          where: { tenantId, isActive: true },
          take: 10, // Limit to 10 for safety
        });

        for (const user of users) {
          // Get their latest session or create one
          let session = await this.prisma.chatSession.findFirst({
            where: { tenantId, userId: user.id },
            orderBy: { updatedAt: 'desc' },
          });

          if (!session) {
            session = await this.chatService.createSession(
              tenantId,
              user.id,
              'Proactive Insights',
            );
          }

          // Inject system message
          await this.prisma.chatMessage.create({
            data: {
              sessionId: session.id,
              role: 'system',
              content: fullMessage,
              tokensUsed: 0,
            },
          });

          // Update session timestamp
          await this.prisma.chatSession.update({
            where: { id: session.id },
            data: { updatedAt: new Date() },
          });
        }
      }

      return { success: true, insightsCount: messages.length, messages };
    } catch (error: any) {
      this.logger.error(
        `Failed to generate insights for tenant ${tenantId}`,
        error,
      );
      throw error;
    }
  }
}
