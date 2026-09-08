import {
  Controller,
  Post,
  Get,
  Headers,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { refreshDemoData } from './demo-refresh';

/**
 * Maintenance endpoints for the demo deployment.
 *
 * Called nightly by a Vercel Cron job. The HTTP call doubles as a wake-up for
 * the Render free tier, which sleeps after ~15 minutes of inactivity.
 *
 * Disabled unless DEMO_REFRESH_TOKEN is set, so it cannot be reached at all in
 * a normal deployment.
 */
@Controller('demo')
export class DemoController {
  private readonly logger = new Logger(DemoController.name);

  constructor(private readonly prisma: PrismaService) {}

  // A dedicated header rather than Authorization: TenantMiddleware tries to
  // JWT-verify every Bearer token and would log a failure on each cron call.
  private authorise(provided?: string) {
    const token = process.env.DEMO_REFRESH_TOKEN;
    if (!token) {
      throw new ForbiddenException('Demo endpoints are disabled.');
    }
    if (provided !== token) {
      throw new UnauthorizedException('Invalid demo refresh token.');
    }
  }

  /** Lightweight liveness probe that also touches the database. */
  @Get('ping')
  async ping(@Headers('x-demo-token') token?: string) {
    this.authorise(token);
    await this.prisma.$queryRawUnsafe('select 1');
    return { ok: true, at: new Date().toISOString() };
  }

  @Post('refresh')
  async refresh(@Headers('x-demo-token') token?: string) {
    this.authorise(token);
    const result = await refreshDemoData(this.prisma as any);
    this.logger.log(
      result.skipped
        ? 'Demo data already current; nothing shifted.'
        : `Shifted demo data forward ${result.shiftedDays} day(s) across ${result.tablesUpdated} tables.`,
    );
    return { ok: true, ...result };
  }
}
