import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../communications/email.service';
import {
  FarmProfileDto,
  ZoneDto,
  InviteTeamMemberDto,
  IoTDeviceDto,
} from './dto/onboarding.dto';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async upsertFarmProfile(tenantId: string, dto: FarmProfileDto) {
    return this.prisma.farmProfile.upsert({
      where: { tenantId },
      update: dto,
      create: { tenantId, ...dto },
    });
  }

  async setZones(tenantId: string, zones: ZoneDto[]) {
    // Delete old zones and recreate (simple replace strategy for wizard flow)
    await this.prisma.zone.deleteMany({ where: { tenantId } });
    return this.prisma.$transaction(
      zones.map((z) => this.prisma.zone.create({ data: { tenantId, ...z } })),
    );
  }

  async inviteTeamMembers(tenantId: string, invites: InviteTeamMemberDto[]) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const results = [];
    for (const invite of invites) {
      const role = await this.prisma.role.findFirst({
        where: { id: invite.roleId, tenantId },
      });
      if (!role) continue;

      // Generate a temporary password and create placeholder user
      const tempPassword = crypto.randomBytes(10).toString('hex');
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      const user = await this.prisma.user.upsert({
        where: { email: invite.email },
        update: { roleId: invite.roleId, tenantId },
        create: {
          email: invite.email,
          passwordHash,
          roleId: invite.roleId,
          tenantId,
        },
      });

      // Send the actual invite email via Resend
      await this.emailService.sendEmail({
        to: invite.email,
        subject: `You're invited to ${tenant.name} on Flori-Core OS`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:auto;">
            <h2 style="color:#10b981;">Welcome to ${tenant.name}!</h2>
            <p>You have been invited to join <strong>${tenant.name}</strong> on Flori-Core Enterprise OS.</p>
            <p>Your temporary login credentials:</p>
            <ul>
              <li><strong>Email:</strong> ${invite.email}</li>
              <li><strong>Temporary Password:</strong> ${tempPassword}</li>
            </ul>
            <p>Please log in and change your password immediately.</p>
            <a href="${process.env.APP_URL ?? 'http://localhost:3000'}/auth/login" 
               style="display:inline-block;padding:12px 24px;background:#10b981;color:white;border-radius:8px;text-decoration:none;margin-top:16px;">
              Log In Now
            </a>
          </div>
        `,
        tenantId,
        entityType: 'UserInvite',
        entityId: user.id,
      });

      results.push({ email: invite.email, userId: user.id });
    }
    return results;
  }

  async registerIotDevices(tenantId: string, devices: IoTDeviceDto[]) {
    return this.prisma.$transaction(
      devices.map((d) =>
        this.prisma.ioTDevice.upsert({
          where: { macAddress: d.macAddress },
          update: { tenantId, ...d },
          create: { tenantId, ...d },
        }),
      ),
    );
  }
}
