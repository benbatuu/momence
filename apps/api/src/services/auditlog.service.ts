import { prisma } from '../utils/prisma';
import type { Role, AuditCategory } from '@prisma/client';

export interface AuditLogFilterOptions {
  actorId?: string;
  category?: AuditCategory;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export class AuditLogService {
  /**
   * Audit Log Kayıtlarını Listeler
   * - SUPER_ADMIN tüm platform loglarını veya belirli bir stüdyoyu sorgulayabilir.
   * - ADMIN sadece kendi stüdyosuna ait logları görebilir.
   */
  static async listLogs(
    requesterRole: Role,
    studioId: string | null | undefined,
    options: AuditLogFilterOptions
  ) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    // Tenancy ve Güvenlik Kilidi
    if (requesterRole !== 'SUPER_ADMIN') {
      if (!studioId) throw new Error('Stüdyo kimliği bulunamadı.');
      where.studioId = studioId;
    } else if (studioId) {
      where.studioId = studioId;
    }

    if (options.actorId) {
      where.actorId = options.actorId;
    }

    if (options.category) {
      where.category = options.category;
    }

    if (options.action) {
      where.action = { contains: options.action, mode: 'insensitive' };
    }

    if (options.startDate || options.endDate) {
      where.createdAt = {};
      if (options.startDate) where.createdAt.gte = options.startDate;
      if (options.endDate) where.createdAt.lte = options.endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          studio: {
            select: {
              id: true,
              name: true,
              subdomain: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Tekil Log Detayını Getirir
   */
  static async getLogById(requesterRole: Role, studioId: string | null | undefined, logId: string) {
    const where: any = { id: logId };

    if (requesterRole !== 'SUPER_ADMIN') {
      if (!studioId) throw new Error('Stüdyo kimliği bulunamadı.');
      where.studioId = studioId;
    }

    const log = await prisma.auditLog.findFirst({
      where,
      include: {
        actor: {
          select: { id: true, name: true, email: true, role: true },
        },
        studio: {
          select: { id: true, name: true, subdomain: true },
        },
      },
    });

    if (!log) throw new Error('Denetim günlüğü bulunamadı.');
    return log;
  }
}