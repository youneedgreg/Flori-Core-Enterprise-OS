import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../communications/email.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TeamService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async findAll(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      include: {
        role: {
          select: { name: true, id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId },
      include: { role: true },
    });
    if (!user) throw new NotFoundException('Team member not found');
    return user;
  }

  async inviteMember(tenantId: string, dto: { email: string; roleId: string }) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const role = await this.prisma.role.findFirst({
      where: { id: dto.roleId, tenantId },
    });
    if (!role) throw new BadRequestException('Invalid role selected');

    // Generate a temporary password
    const tempPassword = crypto.randomBytes(10).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const user = await this.prisma.user.upsert({
      where: { email: dto.email },
      update: { roleId: dto.roleId, tenantId },
      create: {
        email: dto.email,
        passwordHash,
        roleId: dto.roleId,
        tenantId,
      },
    });

    // Send invite email
    await this.emailService.sendEmail({
      to: dto.email,
      subject: `Official Invitation: Join ${tenant.name} on Flori-Core OS`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #e2e8f0;border-radius:16px;">
          <h2 style="color:#10b981;margin-bottom:24px;">Workspace Invitation</h2>
          <p>You have been formally invited to join the <strong>${tenant.name}</strong> workforce on Flori-Core Enterprise OS.</p>
          <div style="background:#f8fafc;padding:24px;border-radius:12px;margin:24px 0;">
            <p style="margin:0 0 8px 0;"><strong>Active Credentials:</strong></p>
            <p style="margin:4px 0;">Email: ${dto.email}</p>
            <p style="margin:4px 0;">Temp Password: <code style="background:#fff;padding:2px 6px;border-radius:4px;">${tempPassword}</code></p>
          </div>
          <p>Upon your first login, you will be required to update your security credentials.</p>
          <a href="${process.env.APP_URL ?? 'http://localhost:3000'}/login" 
             style="display:inline-block;padding:14px 28px;background:#10b981;color:white;border-radius:12px;text-decoration:none;font-weight:bold;margin-top:16px;">
            Access Dashboard
          </a>
        </div>
      `,
      tenantId,
      entityType: 'UserInvite',
      entityId: user.id,
    });

    return user;
  }

  async removeMember(tenantId: string, id: string) {
    await this.findOne(tenantId, id);

    // Prevent self-deletion or removing the last admin in a more complex app,
    // but here we just ensure ownership.
    return this.prisma.user.delete({
      where: { id },
    });
  }

  async getRoles(tenantId: string) {
    return this.prisma.role.findMany({
      where: { tenantId },
      select: { id: true, name: true },
    });
  }
}
