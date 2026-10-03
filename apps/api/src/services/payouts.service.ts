import { prisma } from '../utils/prisma';
import { LoggerService } from '../utils/logger';
import { Role } from '@prisma/client';

export interface CreatePayoutInput {
  instructorId: string;
  sessionId?: string;
  amount: number;
}

export interface PayoutFilterOptions {
  instructorId?: string;
  isPaid?: boolean;
}

export interface Meta {
  ip?: string;
  userAgent?: string;
}

export class PayoutService {
  /**
   * Eğitmen Finansal Özet Tablosu (Ödenen, Bekleyen, Toplam Hakediş)
   */
  static async getInstructorFinancialSummary(
    requesterRole: Role,
    studioId: string | null | undefined,
    instructorId?: string
  ) {
    const where: any = {};

    if (requesterRole !== 'SUPER_ADMIN') {
      if (!studioId) throw new Error('Stüdyo kimliği bulunamadı.');
      where.studioId = studioId;
    } else if (studioId) {
      where.studioId = studioId;
    }

    if (instructorId) {
      where.instructorId = instructorId;
    }

    // Tüm Hakediş Kayıtları
    const payouts = await prisma.instructorPayout.findMany({
      where,
      include: {
        instructor: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    let totalPaid = 0;
    let totalPending = 0;

    const instructorMap = new Map<
      string,
      {
        instructorId: string;
        name: string;
        email: string;
        totalEarned: number;
        paidAmount: number;
        pendingAmount: number;
        payoutCount: number;
      }
    >();

    for (const p of payouts) {
      if (p.isPaid) {
        totalPaid += p.amount;
      } else {
        totalPending += p.amount;
      }

      const existing = instructorMap.get(p.instructorId) || {
        instructorId: p.instructorId,
        name: p.instructor.name,
        email: p.instructor.email,
        totalEarned: 0,
        paidAmount: 0,
        pendingAmount: 0,
        payoutCount: 0,
      };

      existing.totalEarned += p.amount;
      if (p.isPaid) {
        existing.paidAmount += p.amount;
      } else {
        existing.pendingAmount += p.amount;
      }
      existing.payoutCount += 1;

      instructorMap.set(p.instructorId, existing);
    }

    return {
      summary: {
        totalEarned: totalPaid + totalPending,
        totalPaid,
        totalPending,
      },
      instructors: Array.from(instructorMap.values()),
    };
  }

  /**
   * Stüdyo Hakediş Kayıtlarını Listele
   */
  static async listPayouts(
    requesterRole: Role,
    studioId: string | null | undefined,
    options: PayoutFilterOptions
  ) {
    const where: any = {};

    if (requesterRole !== 'SUPER_ADMIN') {
      if (!studioId) throw new Error('Stüdyo kimliği bulunamadı.');
      where.studioId = studioId;
    } else if (studioId) {
      where.studioId = studioId;
    }

    if (options.instructorId) where.instructorId = options.instructorId;
    if (typeof options.isPaid === 'boolean') where.isPaid = options.isPaid;

    return await prisma.instructorPayout.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        instructor: { select: { id: true, name: true, email: true, phone: true } },
        session: { select: { id: true, title: true, startTime: true, status: true } },
        studio: { select: { id: true, name: true, subdomain: true } },
      },
    });
  }

  /**
   * Manuel veya Ders Bazlı Hakediş Kaydı Oluştur
   */
  static async createPayout(
    studioId: string,
    actorId: string,
    data: CreatePayoutInput,
    meta?: Meta
  ) {
    if (!studioId) throw new Error('Stüdyo kimliği bulunamadı.');

    const instructor = await prisma.user.findFirst({
      where: { id: data.instructorId, studioId, role: { in: ['INSTRUCTOR', 'ADMIN'] } },
    });

    if (!instructor) throw new Error('Eğitmen bulunamadı.');

    if (data.sessionId) {
      const session = await prisma.classSession.findFirst({
        where: { id: data.sessionId, studioId },
      });
      if (!session) throw new Error('Ders seansı bulunamadı.');
    }

    const payout = await prisma.instructorPayout.create({
      data: {
        studioId,
        instructorId: data.instructorId,
        sessionId: data.sessionId ?? null,
        amount: data.amount,
        isPaid: false,
      },
      include: {
        instructor: { select: { id: true, name: true } },
        session: { select: { id: true, title: true } },
      },
    });

    await LoggerService.audit({
      studioId,
      actorId,
      category: 'SYSTEM',
      action: 'INSTRUCTOR_PAYOUT_CREATED',
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
      details: { payoutId: payout.id, instructorId: payout.instructorId, amount: payout.amount },
    });

    return payout;
  }

  /**
   * Hakediş Ödemesini Tamamlandı / Ödendi Olarak İşaretle
   */
  static async markAsPaid(
    studioId: string | null | undefined,
    actorId: string,
    payoutId: string,
    meta?: Meta
  ) {
    const payout = await prisma.instructorPayout.findUnique({ where: { id: payoutId } });

    if (!payout) throw new Error('Hakediş kaydı bulunamadı.');

    if (studioId && payout.studioId !== studioId) {
      throw new Error('Bu hakediş kaydını güncelleme yetkiniz yok.');
    }

    const updated = await prisma.instructorPayout.update({
      where: { id: payoutId },
      data: { isPaid: true },
      include: {
        instructor: { select: { id: true, name: true, email: true } },
      },
    });

    await LoggerService.audit({
      studioId: payout.studioId,
      actorId,
      category: 'SYSTEM',
      action: 'INSTRUCTOR_PAYOUT_PAID',
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
      details: { payoutId, amount: updated.amount },
    });

    return updated;
  }

  /**
   * Hakediş Kaydını Sil (SUPER_ADMIN, ADMIN)
   */
  static async deletePayout(
    studioId: string | null | undefined,
    actorId: string,
    payoutId: string,
    meta?: Meta
  ) {
    const payout = await prisma.instructorPayout.findUnique({ where: { id: payoutId } });

    if (!payout) throw new Error('Hakediş kaydı bulunamadı.');

    if (studioId && payout.studioId !== studioId) {
      throw new Error('Bu hakediş kaydını silme yetkiniz yok.');
    }

    await prisma.instructorPayout.delete({ where: { id: payoutId } });

    await LoggerService.audit({
      studioId: payout.studioId,
      actorId,
      category: 'SYSTEM',
      action: 'INSTRUCTOR_PAYOUT_DELETED',
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
      details: { payoutId, instructorId: payout.instructorId, amount: payout.amount },
    });

    return { message: 'Hakediş kaydı silindi.' };
  }
}