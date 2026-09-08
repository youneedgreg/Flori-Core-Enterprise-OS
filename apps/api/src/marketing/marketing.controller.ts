import {
  Body,
  Controller,
  HttpCode,
  Ip,
  Logger,
  Post,
  ServiceUnavailableException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Resend } from 'resend';
import { DemoRequestDto } from './demo-request.dto';

/**
 * Public endpoints for the marketing site.
 *
 * Unauthenticated by necessity — a visitor requesting a demo has no account.
 * Three things keep that from being an open mail relay:
 *
 *  1. The recipient is read from the environment and never from the request, so
 *     this cannot be pointed at a third party.
 *  2. Every field is length-capped by DemoRequestDto and the global
 *     ValidationPipe.
 *  3. A per-IP rate limit, below.
 */
@Controller('marketing')
export class MarketingController {
  private readonly logger = new Logger(MarketingController.name);
  private readonly resend = new Resend(process.env.RESEND_API_KEY ?? '');

  /**
   * Submission timestamps per IP. In-memory, so it resets on deploy and is not
   * shared between instances — enough to stop a naive script, and honest about
   * being no more than that. A serious bot needs a WAF rule, not application code.
   */
  private readonly recent = new Map<string, number[]>();
  private static readonly WINDOW_MS = 60 * 60 * 1000;
  private static readonly MAX_PER_WINDOW = 5;

  private enforceRateLimit(ip: string) {
    const now = Date.now();
    const cutoff = now - MarketingController.WINDOW_MS;
    const hits = (this.recent.get(ip) ?? []).filter((t) => t > cutoff);

    if (hits.length >= MarketingController.MAX_PER_WINDOW) {
      throw new HttpException(
        'Too many enquiries from this address. Please email us directly.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    hits.push(now);
    this.recent.set(ip, hits);

    // The map would otherwise grow for the life of the process.
    if (this.recent.size > 5000) {
      for (const [key, times] of this.recent) {
        if (times.every((t) => t <= cutoff)) this.recent.delete(key);
      }
    }
  }

  @Post('demo-request')
  @HttpCode(HttpStatus.ACCEPTED)
  async demoRequest(@Body() dto: DemoRequestDto, @Ip() ip: string) {
    // Honeypot: accept, log, send nothing.
    if (dto.company) {
      this.logger.warn(`Demo request honeypot triggered from ${ip}`);
      return { ok: true };
    }

    this.enforceRateLimit(ip);

    const to = process.env.DEMO_ENQUIRY_TO;
    const from = process.env.RESEND_FROM_EMAIL;

    if (!process.env.RESEND_API_KEY || !to || !from) {
      this.logger.error(
        'Demo request received but RESEND_API_KEY, RESEND_FROM_EMAIL or DEMO_ENQUIRY_TO is unset.',
      );
      throw new ServiceUnavailableException(
        'Enquiries are temporarily unavailable. Please email us directly.',
      );
    }

    const rows: [string, string | undefined][] = [
      ['Name', dto.name],
      ['Farm', dto.farm],
      ['Role', dto.role],
      ['Email', dto.email],
      ['Phone', dto.phone],
      ['Hectares', dto.hectares],
      ['Headcount', dto.headcount],
    ];

    const html = `
      <h2>Demo request — ${escapeHtml(dto.farm)}</h2>
      <table cellpadding="6" style="border-collapse:collapse">
        ${rows
          .filter(([, v]) => v)
          .map(
            ([k, v]) =>
              `<tr><td style="color:#666">${k}</td><td><strong>${escapeHtml(v as string)}</strong></td></tr>`,
          )
          .join('')}
      </table>
      ${dto.notes ? `<h3>Notes</h3><p>${escapeHtml(dto.notes).replace(/\n/g, '<br>')}</p>` : ''}
    `;

    const response = await this.resend.emails.send({
      from,
      to: [to],
      replyTo: dto.email,
      subject: `Demo request — ${dto.farm}`,
      html,
    });

    if (response.error) {
      this.logger.error(`Resend rejected demo request: ${response.error.message}`);
      throw new ServiceUnavailableException(
        'We could not send your enquiry. Please email us directly.',
      );
    }

    this.logger.log(`Demo request from ${dto.email} (${dto.farm})`);
    return { ok: true };
  }
}

/** The enquiry is attacker-controlled and lands in an HTML email. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
