/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterTenantDto, LoginDto, DEFAULT_ROLES } from '@flori/shared';
import { EmailService } from '../communications/email.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async registerTenant(dto: RegisterTenantDto) {
    const { farmName, adminEmail, adminPassword } = dto;

    const existing = await this.prisma.user.findUnique({
      where: { email: adminEmail },
    });
    if (existing) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const slug = farmName.toLowerCase().replace(/[^a-z0-9]/g, '-');

    const result = await this.prisma.$transaction(async (prisma) => {
      const tenant = await prisma.tenant.create({
        data: { name: farmName, slug, status: 'ACTIVE' },
      });

      const createdRoles = await Promise.all(
        DEFAULT_ROLES.map((r) =>
          prisma.role.create({
            data: {
              name: r.name,
              isSystem: false,
              tenantId: tenant.id,
              permissions: r.permissions,
            },
          }),
        ),
      );

      const role = createdRoles.find((r) => r.name === 'gold_admin');
      if (!role) throw new Error('Missing gold_admin role');

      const user = await prisma.user.create({
        data: {
          email: adminEmail,
          passwordHash: hashedPassword,
          tenantId: tenant.id,
          roleId: role.id,
        },
      });

      return { tenant, role, user };
    });

    const payload = {
      sub: result.user.id,
      email: result.user.email,
      tenantId: result.tenant.id,
      role: result.role.name,
    };

    // --- Welcome Email Trigger ---
    try {
      await this.emailService.sendEmail({
        to: adminEmail,
        subject: `Welcome to Flori-Core, ${farmName}! 🌸`,
        html: this.generateWelcomeEmailHtml(farmName),
        tenantId: result.tenant.id,
        entityType: 'USER',
        entityId: result.user.id,
      });
    } catch (e) {
      console.error('[AUTH] Welcome email failed (likely Resend config):', e);
      // We don't throw here to avoid failing registration if email fails
    }

    const isOnboarded = !!(await this.prisma.farmProfile.findUnique({
      where: { tenantId: result.tenant.id },
    }));

    const access_token = this.jwtService.sign(payload);
    const refresh_token = this.jwtService.sign(payload, {
      secret:
        process.env.JWT_REFRESH_SECRET ||
        'even_more_secret_flori_core_refresh_key',
      expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN as any) || '7d',
    });

    return {
      access_token,
      refresh_token,
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.role.name,
      },
      isOnboarded,
    };
  }

  async login(dto: LoginDto) {
    console.log('[AUTH] login called, dto =', JSON.stringify(dto));
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: dto.email },
        include: { role: true },
      });
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }
      const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
      if (!isMatch) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const roleName = user.role?.name ?? 'unknown';
      const payload = {
        sub: user.id,
        email: user.email,
        tenantId: user.tenantId,
        role: roleName,
        mustChangePassword: user.mustChangePassword ?? false,
      };
      const isOnboarded = !!(await this.prisma.farmProfile.findUnique({
        where: { tenantId: user.tenantId },
      }));

      // Track last login
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      console.log(
        `[AUTH] Login success: user=${user.email}, tenantId=${user.tenantId}, isOnboarded=${isOnboarded}`,
      );

      const access_token = this.jwtService.sign(payload);
      const refresh_token = this.jwtService.sign(payload, {
        secret:
          process.env.JWT_REFRESH_SECRET ||
          'even_more_secret_flori_core_refresh_key',
        expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN as any) || '7d',
      });

      return {
        access_token,
        refresh_token,
        user: { id: user.id, email: user.email, role: roleName },
        isOnboarded,
        mustChangePassword: user.mustChangePassword ?? false,
      };
    } catch (e) {
      console.error('[AUTH ERROR]', e);
      throw e;
    }
  }

  refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret:
          process.env.JWT_REFRESH_SECRET ||
          'even_more_secret_flori_core_refresh_key',
      });

      // Issue new access token
      const newPayload = {
        sub: payload.sub,
        email: payload.email,
        tenantId: payload.tenantId,
        role: payload.role,
      };

      const access_token = this.jwtService.sign(newPayload);
      const refresh_token = this.jwtService.sign(newPayload, {
        secret:
          process.env.JWT_REFRESH_SECRET ||
          'even_more_secret_flori_core_refresh_key',
        expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN as any) || '7d',
      });

      return {
        access_token,
        refresh_token,
      };
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async changePassword(userId: string, dto: { currentPassword: string; newPassword: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Current password is incorrect');

    if (dto.newPassword.length < 8) {
      throw new BadRequestException('New password must be at least 8 characters');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, mustChangePassword: false },
    });

    return { message: 'Password updated successfully' };
  }

  async getRolesForTenant(tenantId: string) {
    return this.prisma.role.findMany({
      where: { tenantId },
      select: { id: true, name: true },
    });
  }

  private generateWelcomeEmailHtml(farmName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
          <style>
              body { font-family: 'Inter', system-ui, -apple-system, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: #f8fafc; }
              .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; }
              .header { background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); padding: 40px 20px; text-align: center; color: white; }
              .header h1 { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em; }
              .content { padding: 40px; }
              .welcome-text { font-size: 18px; font-weight: 600; color: #1e293b; margin-bottom: 24px; }
              .description { color: #475569; margin-bottom: 32px; font-size: 16px; }
              .cta-container { text-align: center; margin-bottom: 32px; }
              .button { display: inline-block; padding: 14px 32px; background: #8b5cf6; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; transition: all 0.2s; }
              .footer { padding: 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; background: #f8fafc; }
              .highlight { color: #ec4899; font-weight: bold; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>Flori-Core OS</h1>
              </div>
              <div class="content">
                  <div class="welcome-text">Welcome to the future of Floriculture, <span class="highlight">${farmName}</span>!</div>
                  <div class="description">
                      We're thrilled to have you on board. Your Enterprise OS is now ready, and you've taken the first step towards transforming your farm with precision production, IoT insights, and integrated financials.
                  </div>
                  <div class="cta-container">
                      <a href="https://app.floricore.io" class="button">Go to Dashboard</a>
                  </div>
                  <div class="description">
                      Need help getting started? Check out our <a href="#" style="color: #8b5cf6;">Onboarding Guide</a> or reply to this email for support.
                  </div>
              </div>
              <div class="footer">
                  © 2024 Flori-Core OS. Precision Agriculture for Modern Farms.<br>
                  You received this email because you signed up for Flori-Core.
              </div>
          </div>
      </body>
      </html>
    `;
  }
}
