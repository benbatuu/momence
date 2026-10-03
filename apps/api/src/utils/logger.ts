import pino from 'pino';
import { prisma } from './prisma';
import type { Role } from '@prisma/client';

export const pinoLogger = pino({
  level: 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'pid,hostname',
      translateTime: 'SYS:HH:MM:ss.l',
    },
  },
});

export type AuditCategoryType = 'AUTH' | 'USER_MANAGEMENT' | 'PACKAGE' | 'BOOKING' | 'PAYMENT' | 'SYSTEM' | 'APPOINTMENT' | 'STORE' | 'WORKSHOP';
export type SeverityType = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

export interface AuditLogPayload {
  studioId?: string;
  actorId?: string;
  actorRole?: Role;
  category: AuditCategoryType;
  action: string;
  severity?: SeverityType;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
  metadata?: Record<string, any>;
}

export class LoggerService {
  static async audit(payload: AuditLogPayload) {
    pinoLogger.info(
      { action: payload.action, category: payload.category, details: payload.details },
      `[AUDIT LOG] ${payload.action}`
    );

    try {
      await prisma.auditLog.create({
        data: {
          studioId: payload.studioId ?? null,
          actorId: payload.actorId ?? null,
          actorRole: payload.actorRole ?? null,
          category: payload.category,
          action: payload.action,
          severity: payload.severity ?? 'INFO',
          ipAddress: payload.ipAddress ?? null,
          userAgent: payload.userAgent ?? null,
          details: payload.details ? payload.details : undefined,
          metadata: payload.metadata ? payload.metadata : undefined,
        },
      });
    } catch (err) {
      pinoLogger.error(err, '🔥 DB AuditLog kayıt hatası');
    }
  }

  static async error(
    err: Error,
    contextInfo?: {
      studioId?: string;
      userId?: string;
      path?: string;
      method?: string;
      statusCode?: number;
      requestBody?: any;
      queryParams?: any;
    }
  ) {
    pinoLogger.error({ err, contextInfo }, `🔥 [SYSTEM ERROR] ${err.message}`);

    try {
      await prisma.errorLog.create({
        data: {
          studioId: contextInfo?.studioId ?? null,
          userId: contextInfo?.userId ?? null,
          errorName: err.name || 'UnhandledError',
          message: err.message || 'Bilinmeyen hata',
          stackTrace: err.stack ?? null,
          path: contextInfo?.path ?? null,
          method: contextInfo?.method ?? null,
          statusCode: contextInfo?.statusCode ?? 500,
          requestBody: contextInfo?.requestBody ? contextInfo.requestBody : undefined,
          queryParams: contextInfo?.queryParams ? contextInfo.queryParams : undefined,
        },
      });
    } catch (dbErr) {
      pinoLogger.error(dbErr, '🔥 DB ErrorLog yazma hatası');
    }
  }
}