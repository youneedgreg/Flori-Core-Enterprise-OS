import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogService } from '../../audit-log/audit-log.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private auditLogService: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, tenantId, user } = request;

    // Only log state-changing actions (POST, PATCH, DELETE)
    // and skip sensitive or administrative endpoints
    if (
      !['POST', 'PATCH', 'DELETE'].includes(method) ||
      url.includes('/audit-logs') ||
      url.includes('/auth/login') ||
      url.includes('/auth/register')
    ) {
      return next.handle();
    }

    return next.handle().pipe(
      tap((responseContent) => {
        if (!tenantId) return; // Cannot log without a tenant context
        // Derive entityType from the URL (e.g., /onboarding/farm-profile -> FarmProfile)
        const parts = url.split('/').filter(Boolean);
        const entityType = parts[parts.length - 1]
          ? parts[parts.length - 1]
              .split('-')
              .map((s: string) => s.charAt(0).toUpperCase() + s.slice(1))
              .join('')
          : 'Unknown';

        void this.auditLogService.create({
          tenantId,
          actorId: user?.sub,
          action: method,
          entityType,
          entityId: responseContent?.id,
          afterState: body, // In a more complex app, we'd log the specific diff
        });
      }),
    );
  }
}
