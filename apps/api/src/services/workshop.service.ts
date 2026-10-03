import { prisma } from '../utils/prisma';
import { LoggerService } from '../utils/logger';
import { Sanitizer } from '../utils/sanitizer';
import { PaymentMethod, PaymentStatus, Role } from '@prisma/client';

export interface CreateWorkshopInput {
  title: string;
  description?: string;
  instructor?: string;
  price: number;
  capacity: number;
  startTime: Date;
  endTime: Date;
  location?: string;
}

export interface UpdateWorkshopInput {
  title?: string;
  description?: string;
  instructor?: string;
  price?: number;
  capacity?: number;
  startTime?: Date;
  endTime?: Date;
  location?: string;
  isActive?: boolean;
}

export interface BuyTicketInput {
  userId: string;
  paymentMethod?: PaymentMethod;
}

export interface Meta {
  ip?: string;
  userAgent?: string;
}

export class WorkshopService {
  /**
   * Atölyeleri Listeler
   */
  static async listWorkshops(
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

    return await prisma.workshop.findMany({
      where,
      orderBy: { startTime: 'asc' },
      include: {
        studio: { select: { id: true, name: true, subdomain: true } },
        _count: { select: { tickets: true } },
      },
    });
  }

  /**
   * Tekil Atölye Detayı ve Katılımcı Bilet Listesi
   */
  static async getWorkshopById(workshopId: string, studioId?: string | null) {
    const where: any = { id: workshopId };
    if (studioId) where.studioId = studioId;

    const workshop = await prisma.workshop.findFirst({
      where,
      include: {
        studio: { select: { id: true, name: true, subdomain: true } },
        tickets: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
      },
    });

    if (!workshop) throw new Error('Atölye bulunamadı.');
    return workshop;
  }

  /**
   * Yeni Atölye / Workshop Oluştur (SUPER_ADMIN, ADMIN)
   */
  static async createWorkshop(
    studioId: string,
    actorId: string,
    data: CreateWorkshopInput,
    meta?: Meta
  ) {
    if (!studioId) throw new Error('Stüdyo kimliği bulunamadı.');

    const workshop = await prisma.workshop.create({
      data: {
        studioId,
        title: Sanitizer.sanitizeString(data.title),
        description: data.description ? Sanitizer.sanitizeString(data.description) : null,
        instructor: data.instructor ? Sanitizer.sanitizeString(data.instructor) : null,
        price: data.price,
        capacity: data.capacity,
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location ? Sanitizer.sanitizeString(data.location) : null,
        isActive: true,
      },
    });

    await LoggerService.audit({
      studioId,
      actorId,
      category: 'WORKSHOP',
      action: 'WORKSHOP_CREATED',
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
      details: { workshopId: workshop.id, title: workshop.title, price: workshop.price },
    });

    return workshop;
  }

  /**
   * Atölyeyi Güncelle (SUPER_ADMIN, ADMIN)
   */
  static async updateWorkshop(
    studioId: string | null | undefined,
    actorId: string,
    workshopId: string,
    data: UpdateWorkshopInput,
    meta?: Meta
  ) {
    const workshop = await prisma.workshop.findUnique({ where: { id: workshopId } });

    if (!workshop) throw new Error('Atölye bulunamadı.');

    if (studioId && workshop.studioId !== studioId) {
      throw new Error('Bu atölyeyi düzenleme yetkiniz yok.');
    }

    const updated = await prisma.workshop.update({
      where: { id: workshopId },
      data: {
        title: data.title ? Sanitizer.sanitizeString(data.title) : undefined,
        description: data.description !== undefined ? Sanitizer.sanitizeString(data.description) : undefined,
        instructor: data.instructor !== undefined ? Sanitizer.sanitizeString(data.instructor) : undefined,
        price: data.price ?? undefined,
        capacity: data.capacity ?? undefined,
        startTime: data.startTime ?? undefined,
        endTime: data.endTime ?? undefined,
        location: data.location !== undefined ? Sanitizer.sanitizeString(data.location) : undefined,
        isActive: data.isActive !== undefined ? data.isActive : undefined,
      },
    });

    await LoggerService.audit({
      studioId: workshop.studioId,
      actorId,
      category: 'WORKSHOP',
      action: 'WORKSHOP_UPDATED',
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
      details: { workshopId, changes: data },
    });

    return updated;
  }

  /**
   * Atölye Bileti Satın Al / Bilet Kes
   */
  static async buyTicket(
    studioId: string,
    actorId: string,
    workshopId: string,
    data: BuyTicketInput,
    meta?: Meta
  ) {
    if (!studioId) throw new Error('Stüdyo kimliği bulunamadı.');

    const workshop = await prisma.workshop.findFirst({
      where: { id: workshopId, studioId, isActive: true },
      include: { _count: { select: { tickets: true } } },
    });

    if (!workshop) throw new Error('Geçerli bir atölye bulunamadı.');
    if (workshop._count.tickets >= workshop.capacity) throw new Error('Atölye kontenjanı dolmuştur.');

    const user = await prisma.user.findFirst({ where: { id: data.userId, studioId } });
    if (!user) throw new Error('Müşteri bulunamadı.');

    // Zaten bileti var mı kontrolü
    const existingTicket = await prisma.workshopTicket.findFirst({
      where: { workshopId, userId: data.userId },
    });
    if (existingTicket) throw new Error('Müşteri bu atölye için zaten bir bilete sahip.');

    // Atomik İşlem: Bilet ve Ödeme Kaydı
    const result = await prisma.$transaction(async (tx) => {
      const ticket = await tx.workshopTicket.create({
        data: {
          workshopId,
          userId: data.userId,
          pricePaid: workshop.price,
        },
        include: {
          workshop: { select: { title: true, startTime: true } },
          user: { select: { id: true, name: true, email: true } },
        },
      });

      await tx.payment.create({
        data: {
          studioId,
          userId: data.userId,
          amount: workshop.price,
          paymentMethod: data.paymentMethod ?? PaymentMethod.CASH,
          status: PaymentStatus.SUCCESS,
        },
      });

      return ticket;
    });

    await LoggerService.audit({
      studioId,
      actorId,
      category: 'WORKSHOP',
      action: 'WORKSHOP_TICKET_PURCHASED',
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
      details: { ticketId: result.id, workshopId, userId: data.userId, pricePaid: workshop.price },
    });

    return result;
  }
}