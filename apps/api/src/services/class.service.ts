import { prisma } from '../utils/prisma';
import { LoggerService } from '../utils/logger';
import { Sanitizer } from '../utils/sanitizer';
import { Discipline, ClassStatus, Role } from '@prisma/client';

export interface CreateClassTemplateInput {
  title: string;
  description?: string;
  discipline?: Discipline;
  durationMin?: number;
  maxCapacity?: number;
  level?: string;
}

export interface UpdateClassTemplateInput {
  title?: string;
  description?: string;
  discipline?: Discipline;
  durationMin?: number;
  maxCapacity?: number;
  level?: string;
  isActive?: boolean;
}

export interface CreateClassSessionInput {
  templateId?: string;
  instructorId: string;
  title: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime?: Date; // Gönderilmezse durationMin kullanılarak otomatik hesaplanır
  capacity: number;
  lateCancelHours?: number;
}

export interface UpdateClassSessionInput {
  instructorId?: string;
  title?: string;
  description?: string;
  location?: string;
  startTime?: Date;
  endTime?: Date;
  capacity?: number;
  lateCancelHours?: number;
  status?: ClassStatus;
}

export interface CalendarFilterOptions {
  startDate: Date;
  endDate: Date;
  instructorId?: string;
  discipline?: Discipline;
  status?: ClassStatus;
}

export interface Meta {
  ip?: string;
  userAgent?: string;
}

export class ClassService {
  // ==========================================
  // 1. DERS ŞABLONLARI (Class Templates)
  // ==========================================

  /**
   * Stüdyonun Ders Şablonlarını Listeler
   */
  static async listTemplates(
    requesterRole: Role,
    studioId: string | null | undefined,
    includeInactive = false
  ) {
    const where: any = {};

    if (requesterRole !== 'SUPER_ADMIN') {
      if (!studioId) throw new Error('Stüdyo kimliği bulunamadı.');
      where.studioId = studioId;
    } else if (studioId) {
      where.studioId = studioId;
    }

    if (!includeInactive) {
      where.isActive = true;
    }

    return await prisma.classTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        studio: { select: { id: true, name: true, subdomain: true } },
        _count: { select: { sessions: true } },
      },
    });
  }

  /**
   * Yeni Ders Şablonu Oluşturur (SUPER_ADMIN, ADMIN)
   */
  static async createTemplate(
    studioId: string,
    actorId: string,
    data: CreateClassTemplateInput,
    meta?: Meta
  ) {
    if (!studioId) throw new Error('Stüdyo kimliği bulunamadı.');

    const sanitizedTitle = Sanitizer.sanitizeString(data.title);

    const template = await prisma.classTemplate.create({
      data: {
        studioId,
        title: sanitizedTitle,
        description: data.description ? Sanitizer.sanitizeString(data.description) : null,
        discipline: data.discipline ?? Discipline.PILATES,
        durationMin: data.durationMin ?? 50,
        maxCapacity: data.maxCapacity ?? 10,
        level: data.level ? Sanitizer.sanitizeString(data.level) : 'All Levels',
        isActive: true,
      },
    });

    await LoggerService.audit({
      studioId,
      actorId,
      category: 'SYSTEM',
      action: 'CLASS_TEMPLATE_CREATED',
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
      details: { templateId: template.id, title: template.title },
    });

    return template;
  }

  /**
   * Ders Şablonunu Günceller (SUPER_ADMIN, ADMIN)
   */
  static async updateTemplate(
    studioId: string | null | undefined,
    actorId: string,
    templateId: string,
    data: UpdateClassTemplateInput,
    meta?: Meta
  ) {
    const template = await prisma.classTemplate.findUnique({ where: { id: templateId } });

    if (!template) throw new Error('Ders şablonu bulunamadı.');

    if (studioId && template.studioId !== studioId) {
      throw new Error('Bu ders şablonunu düzenleme yetkiniz yok.');
    }

    const updated = await prisma.classTemplate.update({
      where: { id: templateId },
      data: {
        title: data.title ? Sanitizer.sanitizeString(data.title) : undefined,
        description: data.description !== undefined ? Sanitizer.sanitizeString(data.description) : undefined,
        discipline: data.discipline ?? undefined,
        durationMin: data.durationMin ?? undefined,
        maxCapacity: data.maxCapacity ?? undefined,
        level: data.level !== undefined ? Sanitizer.sanitizeString(data.level) : undefined,
        isActive: data.isActive !== undefined ? data.isActive : undefined,
      },
    });

    await LoggerService.audit({
      studioId: template.studioId,
      actorId,
      category: 'SYSTEM',
      action: 'CLASS_TEMPLATE_UPDATED',
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
      details: { templateId, changes: data },
    });

    return updated;
  }

  // ==========================================
  // 2. CANLI DERS SEANSLARI & TAKVİM (Class Sessions)
  // ==========================================

  /**
   * Tarih Aralığına Göre Takvim / Ders Programını Döner
   */
  static async getCalendar(
    requesterRole: Role,
    studioId: string | null | undefined,
    options: CalendarFilterOptions
  ) {
    const where: any = {
      startTime: {
        gte: options.startDate,
        lte: options.endDate,
      },
    };

    if (requesterRole !== 'SUPER_ADMIN') {
      if (!studioId) throw new Error('Stüdyo kimliği bulunamadı.');
      where.studioId = studioId;
    } else if (studioId) {
      where.studioId = studioId;
    }

    if (options.instructorId) {
      where.instructorId = options.instructorId;
    }

    if (options.status) {
      where.status = options.status;
    }

    if (options.discipline) {
      where.template = { discipline: options.discipline };
    }

    return await prisma.classSession.findMany({
      where,
      orderBy: { startTime: 'asc' },
      include: {
        instructor: { select: { id: true, name: true, avatarUrl: true } },
        template: { select: { id: true, discipline: true, level: true, durationMin: true } },
        studio: { select: { id: true, name: true, subdomain: true } },
        _count: {
          select: {
            bookings: {
              where: { status: { in: ['CONFIRMED', 'WAITLIST'] } },
            },
          },
        },
      },
    });
  }

  /**
   * Tekil Ders Seansı Detayını ve Katılımcı Listesini Döner
   */
  static async getSessionById(sessionId: string, studioId?: string | null) {
    const where: any = { id: sessionId };
    if (studioId) where.studioId = studioId;

    const session = await prisma.classSession.findFirst({
      where,
      include: {
        instructor: { select: { id: true, name: true, avatarUrl: true, phone: true } },
        template: true,
        studio: { select: { id: true, name: true, subdomain: true } },
        bookings: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true } },
            clientPackage: { select: { id: true, package: { select: { name: true } } } },
            attendance: true,
          },
        },
      },
    });

    if (!session) throw new Error('Ders seansı bulunamadı.');
    return session;
  }

  /**
   * Takvime Yeni Ders Seansı Ekler (SUPER_ADMIN, ADMIN)
   */
  static async createSession(
    studioId: string,
    actorId: string,
    data: CreateClassSessionInput,
    meta?: Meta
  ) {
    if (!studioId) throw new Error('Stüdyo kimliği bulunamadı.');

    // Eğitmen Kontrolü
    const instructor = await prisma.user.findFirst({
      where: { id: data.instructorId, studioId, role: { in: ['INSTRUCTOR', 'ADMIN'] } },
    });

    if (!instructor) {
      throw new Error('Belirtilen eğitmen stüdyoda bulunamadı.');
    }

    // Bitiş saati otomatik hesaplama
    let endTime = data.endTime;
    if (!endTime) {
      let durationMin = 50;
      if (data.templateId) {
        const tmpl = await prisma.classTemplate.findUnique({ where: { id: data.templateId } });
        if (tmpl) durationMin = tmpl.durationMin;
      }
      endTime = new Date(data.startTime.getTime() + durationMin * 60000);
    }

    // Çakışma Kontrolü (Eğitmenin aynı saatte başka dersi var mı?)
    const conflictingSession = await prisma.classSession.findFirst({
      where: {
        instructorId: data.instructorId,
        status: ClassStatus.SCHEDULED,
        OR: [
          { startTime: { lte: data.startTime }, endTime: { gt: data.startTime } },
          { startTime: { lt: endTime }, endTime: { gte: endTime } },
        ],
      },
    });

    if (conflictingSession) {
      throw new Error('Eğitmenin seçilen saat aralığında başka bir dersi bulunmaktadır.');
    }

    const session = await prisma.classSession.create({
      data: {
        studioId,
        templateId: data.templateId ?? null,
        instructorId: data.instructorId,
        title: Sanitizer.sanitizeString(data.title),
        description: data.description ? Sanitizer.sanitizeString(data.description) : null,
        location: data.location ? Sanitizer.sanitizeString(data.location) : null,
        startTime: data.startTime,
        endTime,
        capacity: data.capacity,
        lateCancelHours: data.lateCancelHours ?? 12,
        status: ClassStatus.SCHEDULED,
      },
      include: {
        instructor: { select: { id: true, name: true } },
        template: { select: { discipline: true } },
      },
    });

    await LoggerService.audit({
      studioId,
      actorId,
      category: 'BOOKING',
      action: 'CLASS_SESSION_CREATED',
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
      details: { sessionId: session.id, title: session.title, startTime: session.startTime },
    });

    return session;
  }

  /**
   * Ders Seansını Günceller (SUPER_ADMIN, ADMIN)
   */
  static async updateSession(
    studioId: string | null | undefined,
    actorId: string,
    sessionId: string,
    data: UpdateClassSessionInput,
    meta?: Meta
  ) {
    const session = await prisma.classSession.findUnique({ where: { id: sessionId } });

    if (!session) throw new Error('Ders seansı bulunamadı.');

    if (studioId && session.studioId !== studioId) {
      throw new Error('Bu ders seansını düzenleme yetkiniz yok.');
    }

    const updated = await prisma.classSession.update({
      where: { id: sessionId },
      data: {
        instructorId: data.instructorId ?? undefined,
        title: data.title ? Sanitizer.sanitizeString(data.title) : undefined,
        description: data.description !== undefined ? Sanitizer.sanitizeString(data.description) : undefined,
        location: data.location !== undefined ? Sanitizer.sanitizeString(data.location) : undefined,
        startTime: data.startTime ?? undefined,
        endTime: data.endTime ?? undefined,
        capacity: data.capacity ?? undefined,
        lateCancelHours: data.lateCancelHours ?? undefined,
        status: data.status ?? undefined,
      },
    });

    await LoggerService.audit({
      studioId: session.studioId,
      actorId,
      category: 'BOOKING',
      action: 'CLASS_SESSION_UPDATED',
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
      details: { sessionId, changes: data },
    });

    return updated;
  }

  /**
   * Ders Seansını İptal Eder (SUPER_ADMIN, ADMIN)
   */
  static async cancelSession(
    studioId: string | null | undefined,
    actorId: string,
    sessionId: string,
    reason?: string,
    meta?: Meta
  ) {
    const session = await prisma.classSession.findUnique({
      where: { id: sessionId },
      include: { bookings: { where: { status: 'CONFIRMED' } } },
    });

    if (!session) throw new Error('Ders seansı bulunamadı.');

    if (studioId && session.studioId !== studioId) {
      throw new Error('Bu dersi iptal etme yetkiniz yok.');
    }

    // Ders İptali ve Rezerve Üyelerin Haklarının İadesi (Transaction)
    await prisma.$transaction(async (tx) => {
      // 1. Seansı İptal Et
      await tx.classSession.update({
        where: { id: sessionId },
        data: { status: ClassStatus.CANCELLED },
      });

      // 2. Rezervasyonları İptal Et ve İade İşlemlerini Yap
      for (const booking of session.bookings) {
        await tx.booking.update({
          where: { id: booking.id },
          data: { status: 'CANCELLED_EARLY' },
        });

        // Paket kredisini iade et
        if (booking.clientPackageId) {
          await tx.clientPackage.update({
            where: { id: booking.clientPackageId },
            data: { creditsUsed: { decrement: 1 } },
          });
        }
      }
    });

    await LoggerService.audit({
      studioId: session.studioId,
      actorId,
      category: 'BOOKING',
      action: 'CLASS_SESSION_CANCELLED',
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
      details: { sessionId, affectedBookings: session.bookings.length, reason },
    });

    return { message: 'Ders başarıyla iptal edildi ve katılımcı hakları iade edildi.' };
  }
}