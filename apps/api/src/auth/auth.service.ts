/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
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

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async registerTenant(dto: RegisterTenantDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.role.name,
      },
    };
  }

  async login(dto: LoginDto) {
    console.log('[AUTH] login called, dto =', JSON.stringify(dto));
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
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, email: user.email, role: roleName },
    };
  }
}
