/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';

declare module 'express' {
  interface Request {
    tenantId?: string;
    user?: any;
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const payload: any = this.jwtService.verify(token, {
          secret: process.env.JWT_SECRET || 'super_secret_flori_core_key',
        });
        req.tenantId = payload.tenantId;
        console.log(`[TenantMiddleware] Found tenantId: ${req.tenantId}`);
      } catch (err) {
        console.error(
          `[TenantMiddleware] Token verification failed: ${err.message}`,
        );
        // Invalid token handled by JwtAuthGuard later
      }
    }
    next();
  }
}
