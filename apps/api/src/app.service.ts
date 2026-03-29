import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getSystemUsers() {
    return this.prisma.user.findMany({
      include: {
        tenant: true,
        role: true,
      },
    });
  }
}
