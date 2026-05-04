import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../communications/email.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

export interface InviteMemberDto {
  email: string;
  roleId: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  jobTitle?: string;
}

export interface UpdateMemberDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  roleId?: string;
  isActive?: boolean;
}

@Injectable()
export class TeamService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async findAll(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        mustChangePassword: true,
        lastLoginAt: true,
        createdAt: true,
        roleId: true,
        role: { select: { id: true, name: true, permissions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        mustChangePassword: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        roleId: true,
        role: { select: { id: true, name: true, permissions: true } },
        actorAuditLogs: {
          orderBy: { timestamp: 'desc' },
          take: 20,
          select: {
            id: true,
            action: true,
            entityType: true,
            entityId: true,
            timestamp: true,
          },
        },
      },
    });
    if (!user) throw new NotFoundException('Team member not found');
    return user;
  }

  async inviteMember(tenantId: string, dto: InviteMemberDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const role = await this.prisma.role.findFirst({
      where: { id: dto.roleId, tenantId },
    });
    if (!role) throw new BadRequestException('Invalid role selected');

    const tempPassword = crypto.randomBytes(10).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing && existing.tenantId !== tenantId) {
      throw new BadRequestException('Email already registered to another workspace');
    }

    const user = await this.prisma.user.upsert({
      where: { email: dto.email },
      update: {
        roleId: dto.roleId,
        tenantId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        passwordHash,
        mustChangePassword: true,
        isActive: true,
      },
      create: {
        email: dto.email,
        passwordHash,
        roleId: dto.roleId,
        tenantId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        mustChangePassword: true,
        isActive: true,
      },
    });

    try {
      await this.emailService.sendEmail({
        to: dto.email,
        subject: `You're invited to join ${tenant.name} on Flori-Core OS`,
        html: this.buildInviteEmail({
          name: dto.firstName ? `${dto.firstName}` : dto.email,
          farmName: tenant.name,
          email: dto.email,
          tempPassword,
          role: role.name,
        }),
        tenantId,
        entityType: 'UserInvite',
        entityId: user.id,
      });
    } catch (e) {
      console.error('[TEAM] Invite email failed:', e);
    }

    return { id: user.id, email: user.email, tempPassword };
  }

  async updateMember(tenantId: string, id: string, dto: UpdateMemberDto) {
    await this.findOne(tenantId, id);

    if (dto.roleId) {
      const role = await this.prisma.role.findFirst({
        where: { id: dto.roleId, tenantId },
      });
      if (!role) throw new BadRequestException('Invalid role selected');
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.firstName !== undefined && { firstName: dto.firstName }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.roleId !== undefined && { roleId: dto.roleId }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        mustChangePassword: true,
        lastLoginAt: true,
        createdAt: true,
        role: { select: { id: true, name: true } },
      },
    });
  }

  async resetPassword(tenantId: string, id: string) {
    const member = await this.findOne(tenantId, id);

    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const tempPassword = crypto.randomBytes(10).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    await this.prisma.user.update({
      where: { id },
      data: { passwordHash, mustChangePassword: true },
    });

    try {
      await this.emailService.sendEmail({
        to: member.email,
        subject: `Your Flori-Core password has been reset`,
        html: this.buildPasswordResetEmail({
          name: member.firstName ?? member.email,
          farmName: tenant.name,
          email: member.email,
          tempPassword,
        }),
        tenantId,
        entityType: 'PasswordReset',
        entityId: id,
      });
    } catch (e) {
      console.error('[TEAM] Password reset email failed:', e);
    }

    return { tempPassword, message: 'Password reset. New credentials sent to member.' };
  }

  async removeMember(tenantId: string, id: string, requesterId: string) {
    await this.findOne(tenantId, id);

    if (id === requesterId) {
      throw new ForbiddenException('You cannot remove your own account');
    }

    // Prevent removing the last active gold_admin
    const admins = await this.prisma.user.findMany({
      where: { tenantId, isActive: true, role: { name: 'gold_admin' } },
      select: { id: true },
    });
    const member = await this.prisma.user.findFirst({
      where: { id },
      include: { role: true },
    });
    if (member?.role?.name === 'gold_admin' && admins.length === 1) {
      throw new ForbiddenException('Cannot remove the last Gold Admin from the workspace');
    }

    return this.prisma.user.delete({ where: { id } });
  }

  async getRoles(tenantId: string) {
    return this.prisma.role.findMany({
      where: { tenantId },
      select: { id: true, name: true, description: true, permissions: true, isSystem: true },
      orderBy: { name: 'asc' },
    });
  }

  private buildInviteEmail(opts: {
    name: string;
    farmName: string;
    email: string;
    tempPassword: string;
    role: string;
  }) {
    return `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px;background:#0a0f0e;color:#e2e8f0;border-radius:16px;border:1px solid #1a2e24;">
        <div style="text-align:center;padding:32px 0 24px;">
          <div style="display:inline-block;background:#10b981;border-radius:12px;padding:12px 20px;">
            <span style="color:#0a0f0e;font-weight:900;font-size:18px;letter-spacing:-0.025em;">Flori-Core OS</span>
          </div>
        </div>
        <h2 style="color:#10b981;margin-bottom:8px;">You've been invited</h2>
        <p style="color:#94a3b8;">Hi <strong style="color:#e2e8f0;">${opts.name}</strong>, you've been added to <strong style="color:#10b981;">${opts.farmName}</strong> as <strong style="color:#e2e8f0;">${opts.role.replace(/_/g, ' ')}</strong>.</p>
        <div style="background:#111b17;padding:24px;border-radius:12px;margin:24px 0;border:1px solid #1a2e24;">
          <p style="margin:0 0 12px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;font-weight:700;">Your Login Credentials</p>
          <p style="margin:4px 0;color:#e2e8f0;"><strong>Email:</strong> ${opts.email}</p>
          <p style="margin:4px 0;color:#e2e8f0;"><strong>Temporary Password:</strong> <code style="background:#0a0f0e;padding:3px 8px;border-radius:6px;font-family:monospace;color:#10b981;">${opts.tempPassword}</code></p>
        </div>
        <p style="color:#64748b;font-size:13px;">You will be required to set a new password on your first login.</p>
        <div style="text-align:center;margin-top:32px;">
          <a href="${process.env.APP_URL ?? 'http://localhost:3000'}/login" style="display:inline-block;padding:14px 32px;background:#10b981;color:#0a0f0e;border-radius:10px;text-decoration:none;font-weight:900;font-size:14px;">Access Dashboard</a>
        </div>
        <p style="color:#334155;font-size:11px;text-align:center;margin-top:32px;">Flori-Core Enterprise OS • ${opts.farmName}</p>
      </div>
    `;
  }

  private buildPasswordResetEmail(opts: {
    name: string;
    farmName: string;
    email: string;
    tempPassword: string;
  }) {
    return `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px;background:#0a0f0e;color:#e2e8f0;border-radius:16px;border:1px solid #1a2e24;">
        <div style="text-align:center;padding:32px 0 24px;">
          <div style="display:inline-block;background:#10b981;border-radius:12px;padding:12px 20px;">
            <span style="color:#0a0f0e;font-weight:900;font-size:18px;letter-spacing:-0.025em;">Flori-Core OS</span>
          </div>
        </div>
        <h2 style="color:#f59e0b;margin-bottom:8px;">Password Reset</h2>
        <p style="color:#94a3b8;">Hi <strong style="color:#e2e8f0;">${opts.name}</strong>, your password for <strong style="color:#10b981;">${opts.farmName}</strong> has been reset by an administrator.</p>
        <div style="background:#111b17;padding:24px;border-radius:12px;margin:24px 0;border:1px solid #1a2e24;">
          <p style="margin:0 0 12px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;font-weight:700;">New Temporary Credentials</p>
          <p style="margin:4px 0;color:#e2e8f0;"><strong>Email:</strong> ${opts.email}</p>
          <p style="margin:4px 0;color:#e2e8f0;"><strong>Temporary Password:</strong> <code style="background:#0a0f0e;padding:3px 8px;border-radius:6px;font-family:monospace;color:#10b981;">${opts.tempPassword}</code></p>
        </div>
        <p style="color:#64748b;font-size:13px;">You will be asked to set a new password immediately upon login.</p>
        <div style="text-align:center;margin-top:32px;">
          <a href="${process.env.APP_URL ?? 'http://localhost:3000'}/login" style="display:inline-block;padding:14px 32px;background:#10b981;color:#0a0f0e;border-radius:10px;text-decoration:none;font-weight:900;font-size:14px;">Login Now</a>
        </div>
        <p style="color:#334155;font-size:11px;text-align:center;margin-top:32px;">Flori-Core Enterprise OS • ${opts.farmName}</p>
      </div>
    `;
  }
}
