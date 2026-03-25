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
        const payload = this.jwtService.verify(token, {
          secret: process.env.JWT_SECRET || 'super_secret',
        });
        req.tenantId = payload.tenantId;
      } catch (err) {
        // Invalid token handled by JwtAuthGuard later
      }
    }
    next();
  }
}
