import { prisma } from '../utils/prisma';
import { LoggerService } from '../utils/logger';
import { Sanitizer } from '../utils/sanitizer';
import {
  AppointmentStatus,
  ClientPackageStatus,
  Discipline,
  PackageType,
  Role,
} from '@prisma/client';

export interface CreateAppointmentInput {
  clientId: string;
  instructorId: string;
  discipline?: Discipline;
  title: string;
  startTime: Date;
  endTime: Date;
  price?: number;
  clientPackageId?: string;
  notes?: string;
}

export interface UpdateAppointmentInput {
  instructorId?: string;
  discipline?: Discipline;
  title?: string;
  startTime?: Date;
  endTime?: Date;
  price?: number;
  status?: AppointmentStatus;
  notes?: string;
}

export interface AppointmentFilterOptions {
  startDate?: Date;
  endDate?: Date;
  instructorId?: string;
  clientId?: string;
  status?: AppointmentStatus;
}

export interface Meta {
  ip?: string;
  userAgent?: string;
}

export class AppointmentService {
  /**
   * Randevuları Listele (Tarih, Eğitmen veya Müşteri Filtreli)
   */
  static async listAppointments(
    requesterRole: Role,
    studioId: string | null | undefined,
    options: AppointmentFilterOptions
  ) {
    const where: any = {};

    if (requesterRole !== 'SUPER_ADMIN') {
      if (!studioId) throw new Error('Stüdyo kimliği bulunamadı.');
      where.studioId = studioId;
    } else if (studioId) {
      where.studioId = studioId;
    }

    if (options.startDate && options.endDate) {
      where.startTime = {
        gte: options.startDate,
        lte: options.endDate,
      };
    }

    if (options.instructorId) where.instructorId = options.instructorId;
    if (options.clientId) where.clientId = options.clientId;
    if (options.status) where.status = options.status;

    return await prisma.appointment.findMany({
      where,
      orderBy: { startTime: 'asc' },
      include: {
        client: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true } },
        instructor: { select: { id: true, name: true, avatarUrl: true } },
        clientPackage: { select: { id: true, package: { select: { name: true } } } },
        studio: { select: { id: true, name: true, subdomain: true } },
      },
    });
  }

  /**
   * Tekil Randevu Detayı
   */
  static async getById(appointmentId: string, studioId?: string | null) {
    const where: any = { id: appointmentId };
    if (studioId) where.studioId = studioId;

    const appointment = await prisma.appointment.findFirst({
      where,
      include: {
        client: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true } },
        instructor: { select: { id: true, name: true, avatarUrl: true, phone: true } },
        clientPackage: { select: { id: true, package: true } },
        studio: { select: { id: true, name: true, subdomain: true } },
      },
    });

    if (!appointment) throw new Error('Randevu bulunamadı.');
    return appointment;
  }

  /**
   * Yeni Özel Randevu Oluştur
   */
  static async createAppointment(
    studioId: string,
    actorId: string,
    data: CreateAppointmentInput,
    meta?: Meta
  ) {
    if (!studioId) throw new Error('Stüdyo kimliği bulunamadı.');

    // 1. Müşteri ve Eğitmen Kontrolü
    const [client, instructor] = await Promise.all([
      prisma.user.findFirst({ where: { id: data.clientId, studioId } }),
      prisma.user.findFirst({
        where: { id: data.instructorId, studioId, role: { in: ['INSTRUCTOR', 'ADMIN'] } },
      }),
    ]);

    if (!client) throw new Error('Müşteri bulunamadı.');
    if (!instructor) throw new Error('Eğitmen bulunamadı.');

    // 2. Eğitmen Saat Çakışması Kontrolü (Aynı saatte başka randevusu veya canlı dersi var mı?)
    const [conflictingAppt, conflictingSession] = await Promise.all([
      prisma.appointment.findFirst({
        where: {
          instructorId: data.instructorId,
          status: AppointmentStatus.SCHEDULED,
          OR: [
            { startTime: { lte: data.startTime }, endTime: { gt: data.startTime } },
            { startTime: { lt: data.endTime }, endTime: { gte: data.endTime } },
          ],
        },
      }),
      prisma.classSession.findFirst({
        where: {
          instructorId: data.instructorId,
          status: 'SCHEDULED',
          OR: [
            { startTime: { lte: data.startTime }, endTime: { gt: data.startTime } },
            { startTime: { lt: data.endTime }, endTime: { gte: data.endTime } },
          ],
        },
      }),
    ]);

    if (conflictingAppt || conflictingSession) {
      throw new Error('Eğitmenin seçilen saat aralığında başka bir dersi veya randevusu bulunmaktadır.');
    }

    // 3. Paket Seçimi & Kredi Düşme İşlemi
    let targetClientPackageId = data.clientPackageId;

    if (!targetClientPackageId) {
      const activePackage = await prisma.clientPackage.findFirst({
        where: {
          studioId,
          userId: data.clientId,
          status: ClientPackageStatus.ACTIVE,
          expiresAt: { gte: new Date() },
          package: {
            allowedDisciplines: { has: data.discipline ?? Discipline.PILATES },
            allowedServices: { has: 'APPOINTMENT' },
          },
        },
        include: { package: true },
        orderBy: { expiresAt: 'asc' },
      });

      if (activePackage) {
        if (
          activePackage.package.type !== PackageType.UNLIMITED &&
          activePackage.creditsUsed >= activePackage.creditsTotal
        ) {
          throw new Error('Müşterinin üyelik paketindeki ders kredisi tükenmiştir.');
        }
        targetClientPackageId = activePackage.id;
      }
    }

    // 4. Atomik İşlem: Randevu Oluştur ve Kredi Düş
    const appointment = await prisma.$transaction(async (tx) => {
      let finalPrice = data.price ?? 0;

      if (targetClientPackageId) {
        const cp = await tx.clientPackage.findUnique({
          where: { id: targetClientPackageId },
          include: { package: true },
        });

        if (cp && cp.package.type !== PackageType.UNLIMITED) {
          const updatedCredits = cp.creditsUsed + 1;
          const newStatus =
            updatedCredits >= cp.creditsTotal
              ? ClientPackageStatus.EXHAUSTED
              : ClientPackageStatus.ACTIVE;

          await tx.clientPackage.update({
            where: { id: cp.id },
            data: { creditsUsed: updatedCredits, status: newStatus },
          });
        }
      }

      return await tx.appointment.create({
        data: {
          studioId,
          clientId: data.clientId,
          instructorId: data.instructorId,
          clientPackageId: targetClientPackageId ?? null,
          discipline: data.discipline ?? Discipline.PILATES,
          title: Sanitizer.sanitizeString(data.title),
          startTime: data.startTime,
          endTime: data.endTime,
          price: finalPrice,
          status: AppointmentStatus.SCHEDULED,
          notes: data.notes ? Sanitizer.sanitizeString(data.notes) : null,
        },
        include: {
          client: { select: { id: true, name: true, email: true } },
          instructor: { select: { id: true, name: true } },
        },
      });
    });

    await LoggerService.audit({
      studioId,
      actorId,
      category: 'APPOINTMENT',
      action: 'APPOINTMENT_CREATED',
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
      details: {
        appointmentId: appointment.id,
        clientId: data.clientId,
        instructorId: data.instructorId,
        startTime: data.startTime,
      },
    });

    return appointment;
  }

  /**
   * Randevuyu Güncelle veya İptal Et
   */
  static async updateAppointment(
    studioId: string | null | undefined,
    actorId: string,
    appointmentId: string,
    data: UpdateAppointmentInput,
    meta?: Meta
  ) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { clientPackage: { include: { package: true } } },
    });

    if (!appointment) throw new Error('Randevu bulunamadı.');

    if (studioId && appointment.studioId !== studioId) {
      throw new Error('Bu randevuyu düzenleme yetkiniz yok.');
    }

    // İptal Durumuna Alınıyorsa ve Kredi Kullanılmışsa İade Et
    if (
      data.status === AppointmentStatus.CANCELLED &&
      appointment.status !== AppointmentStatus.CANCELLED
    ) {
      await prisma.$transaction(async (tx) => {
        if (
          appointment.clientPackageId &&
          appointment.clientPackage?.package.type !== PackageType.UNLIMITED
        ) {
          await tx.clientPackage.update({
            where: { id: appointment.clientPackageId },
            data: {
              creditsUsed: { decrement: 1 },
              status: ClientPackageStatus.ACTIVE,
            },
          });
        }

        await tx.appointment.update({
          where: { id: appointmentId },
          data: { status: AppointmentStatus.CANCELLED },
        });
      });
    } else {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          instructorId: data.instructorId ?? undefined,
          discipline: data.discipline ?? undefined,
          title: data.title ? Sanitizer.sanitizeString(data.title) : undefined,
          startTime: data.startTime ?? undefined,
          endTime: data.endTime ?? undefined,
          price: data.price ?? undefined,
          status: data.status ?? undefined,
          notes: data.notes !== undefined ? Sanitizer.sanitizeString(data.notes) : undefined,
        },
      });
    }

    await LoggerService.audit({
      studioId: appointment.studioId,
      actorId,
      category: 'APPOINTMENT',
      action: 'APPOINTMENT_UPDATED',
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
      details: { appointmentId, changes: data },
    });

    return { message: 'Randevu başarıyla güncellendi.' };
  }
}