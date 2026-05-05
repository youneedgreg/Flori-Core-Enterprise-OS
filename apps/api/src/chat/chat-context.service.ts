/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { searchKnowledgeBase, getAllModules } from './knowledge-base';

interface UserContext {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  roleName: string;
  permissions: string[];
  tenantName: string;
}

/** Maps role permissions to human-readable module access */
const MODULE_PERMISSION_MAP: Record<string, string> = {
  'dashboard:read': 'Dashboard',
  'zones:read': 'Farm Zones',
  'production:read': 'Production',
  'operations:read': 'Farm Operations',
  'pack-house:read': 'Pack House',
  'cold-room:read': 'Cold Room',
  'team:read': 'Team',
  'hr:read': 'HR & Training',
  'inventory:read': 'Inventory',
  'stores:read': 'Stores',
  'procurement:read': 'Procurement',
  'sales:read': 'Sales & CRM',
  'logistics:read': 'Logistics',
  'compliance:read': 'Compliance',
  'financials:read': 'Financials',
  'payroll:read': 'Payroll',
  'settings:read': 'Settings',
  'telemetry:read': 'Telemetry',
  'audit-logs:read': 'Audit Logs',
};

@Injectable()
export class ChatContextService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  /**
   * Fetch the user's profile, role, and permissions.
   */
  async getUserContext(
    tenantId: string,
    userId: string,
  ): Promise<UserContext | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        tenant: { select: { name: true } },
      },
    });

    if (!user) return null;

    let permissions: string[] = [];
    try {
      const permsRaw = user.role?.permissions;
      if (Array.isArray(permsRaw)) {
        permissions = permsRaw as string[];
      } else if (typeof permsRaw === 'string') {
        permissions = JSON.parse(permsRaw);
      }
    } catch {
      permissions = [];
    }

    return {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roleName: user.role?.name || 'Unknown',
      permissions,
      tenantName: (user.tenant as any)?.name || 'Unknown',
    };
  }

  /**
   * Fetch recent audit logs for error/issue diagnosis.
   */
  async getRecentAuditLogs(
    tenantId: string,
    filters?: { action?: string; entityType?: string },
  ) {
    return this.auditLogService.findAll(tenantId, {
      action: filters?.action,
      entityType: filters?.entityType,
    });
  }

  /**
   * Determine which modules a user CAN and CANNOT access based on permissions.
   */
  getModuleAccess(permissions: string[]): {
    accessible: string[];
    restricted: string[];
  } {
    const accessible: string[] = [];
    const restricted: string[] = [];

    // If permissions array is empty or includes wildcard, assume full access
    if (
      permissions.length === 0 ||
      permissions.includes('*') ||
      permissions.includes('admin')
    ) {
      return {
        accessible: Object.values(MODULE_PERMISSION_MAP),
        restricted: [],
      };
    }

    for (const [perm, moduleName] of Object.entries(MODULE_PERMISSION_MAP)) {
      if (permissions.includes(perm)) {
        accessible.push(moduleName);
      } else {
        restricted.push(moduleName);
      }
    }

    return { accessible, restricted };
  }

  /**
   * Build the full system prompt with dynamic context for the LLM.
   */
  async buildSystemPrompt(
    tenantId: string,
    userId: string,
    userQuery: string,
  ): Promise<string> {
    const userCtx = await this.getUserContext(tenantId, userId);
    const kbResults = searchKnowledgeBase(userQuery, 5);

    const parts: string[] = [];

    // ── Core identity ─────────────────────────────────────────────
    parts.push(
      `You are Flori Assistant, the AI helper for Flori-Core Enterprise OS — a comprehensive farm management platform for flower farms. You help users navigate the system, explain features, diagnose issues, and answer questions.`,
    );

    parts.push(
      `Always be concise, helpful, and professional. Use markdown formatting: **bold** for emphasis, numbered lists for steps, and [link text](/path) for deep links to dashboard pages.`,
    );

    // ── User context ──────────────────────────────────────────────
    if (userCtx) {
      parts.push(
        `\n## Current User Context\n- Name: ${userCtx.firstName || ''} ${userCtx.lastName || ''} (${userCtx.email})\n- Role: ${userCtx.roleName}\n- Tenant/Farm: ${userCtx.tenantName}`,
      );

      const { accessible, restricted } = this.getModuleAccess(
        userCtx.permissions,
      );
      if (restricted.length > 0) {
        parts.push(
          `- Accessible modules: ${accessible.join(', ')}\n- Restricted modules (no access): ${restricted.join(', ')}`,
        );
      } else {
        parts.push(`- Access level: Full access to all modules`);
      }
    }

    // ── Knowledge base results ────────────────────────────────────
    if (kbResults.length > 0) {
      parts.push(`\n## Relevant Knowledge Base Articles`);
      for (const article of kbResults) {
        parts.push(
          `### ${article.title} [${article.category}]\n${article.content}`,
        );
      }
    }

    // ── Error diagnosis context ───────────────────────────────────
    const errorKeywords = [
      'fail',
      'error',
      'issue',
      'problem',
      'broke',
      'broken',
      'wrong',
      'not working',
      'bug',
      'crash',
    ];
    const queryLower = userQuery.toLowerCase();
    const isErrorQuery = errorKeywords.some((kw) => queryLower.includes(kw));

    if (isErrorQuery) {
      try {
        const recentLogs = await this.getRecentAuditLogs(tenantId);
        if (recentLogs && (recentLogs as any[]).length > 0) {
          const logSummaries = (recentLogs as any[])
            .slice(0, 10)
            .map(
              (log: any) =>
                `- [${new Date(log.timestamp).toISOString()}] ${log.action} on ${log.entityType}${log.entityId ? ` (${log.entityId})` : ''} by ${log.actor?.email || 'system'}`,
            );
          parts.push(
            `\n## Recent Audit Logs (for diagnosis)\n${logSummaries.join('\n')}`,
          );
        }
      } catch {
        // Audit logs unavailable — continue without them
      }
    }

    // ── Permission query context ──────────────────────────────────
    const permissionKeywords = [
      "can't see",
      'cannot see',
      'no access',
      'permission',
      'why can',
      'hidden',
      'not visible',
      'restricted',
      'locked',
    ];
    const isPermQuery = permissionKeywords.some((kw) =>
      queryLower.includes(kw),
    );

    if (isPermQuery && userCtx) {
      parts.push(
        `\n## Permission Analysis\nThe user's role "${userCtx.roleName}" has these permissions: ${JSON.stringify(userCtx.permissions)}.\nWhen answering permission questions, explain which specific permission is needed and suggest they contact their administrator to update their role in Team → [/dashboard/team](/dashboard/team).`,
      );
    }

    // ── Module overview request ───────────────────────────────────
    const moduleKeywords = [
      'what does',
      'what is',
      'explain',
      'tell me about',
      'overview',
      'features of',
    ];
    const isModuleQuery = moduleKeywords.some((kw) => queryLower.includes(kw));
    if (isModuleQuery && kbResults.length === 0) {
      const allModules = getAllModules();
      parts.push(
        `\n## Available Modules\n${allModules.map((m) => `- **${m.title}**: ${m.content.slice(0, 100)}...`).join('\n')}`,
      );
    }

    // ── OCR / Import instructions (preserve existing) ─────────────
    parts.push(
      `\n## Data Import Actions\nIf the user uploads a delivery note image, extract data and return: <action-preview>{"type":"CREATE_GRN","payload":{"vendorName":"...","items":[{"sku":"...","quantity":0,"unitPrice":0}]}}</action-preview>\nIf the user uploads a spray log image, return: <action-preview>{"type":"CREATE_SPRAY_LOG","payload":{"chemicalName":"...","zoneId":"","phiDays":0,"quantity":0,"unit":"L","date":"..."}}</action-preview>\nIf the user uploads a CSV for inventory, return: <action-preview>{"type":"IMPORT_INVENTORY","payload":{"items":[{"sku":"...","name":"...","category":"...","quantity":0,"unitCost":0}]}}</action-preview>\nOnly use action-preview blocks for import/creation actions. For Q&A, answer normally with markdown.`,
    );

    // ── Data Visualization Instructions ─────────────
    const today = new Date().toISOString().split('T')[0];
    parts.push(
      `\n## Data Queries & Visualisation\n` +
        `The current date is ${today}. Use this to resolve relative dates like "last week" or "this month" when calling data query tools.\n` +
        `When you receive data from a tool, you can format it for the user in several ways:\n` +
        `1. **Markdown Tables**: For structured tabular data, use standard markdown tables (e.g. | Header | Header |).\n` +
        `2. **Charts**: To display trends or comparisons, use the custom chart tag. Examples:\n` +
        `   <chart type="bar" data='[{"name":"Jan","value":10},{"name":"Feb","value":20}]' xKey="name" yKey="value" />\n` +
        `   <chart type="line" data='[{"date":"2026-05-01","stems":500}]' xKey="date" yKey="stems" />\n` +
        `3. **CSV Export**: If the user asks to export or download data, use the custom csv tag:\n` +
        `   <csv filename="export.csv" data='Col1,Col2\\nVal1,Val2' />\n` +
        `Always choose the most appropriate visualization. For "top 5" or distributions, use a bar chart. For trends over time, use a line chart.`,
    );

    return parts.join('\n\n');
  }
}
