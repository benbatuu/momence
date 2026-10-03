import { prisma } from '../utils/prisma';
import { LoggerService } from '../utils/logger';
import {
  BookingStatus,
  AttendanceStatus,
  ClientPackageStatus,
  ClassStatus,
  PackageType,
  Role,
} from '@prisma/client';

export interface CreateBookingInput {
  sessionId: string;
  userId: string;
  clientPackageId?: string; // Gönderilmezse müşterinin uygun aktif paketi otomatik seçilir
}

export interface AttendanceInput {
  bookingId: string;
  status: AttendanceStatus;
  notes?: string;
}

export interface Meta {
  ip?: string;
  userAgent?: string;
}

export class BookingService {
  /**
   * Derse Rezervasyon Yapar (Müşteri veya Admin Tarafından)
   */
  static async createBooking(
    studioId: string,
    actorId: string,
    data: CreateBookingInput,
    meta?: Meta
  ) {
    if (!studioId) throw new Error('Stüdyo kimliği bulunamadı.');

    // 1. Ders Seansını ve Mevcut Rezervasyon Sayısını Getir
    const session = await prisma.classSession.findFirst({
      where: { id: data.sessionId, studioId },
      include: {
        template: true,
        bookings: { where: { status: { in: ['CONFIRMED', 'WAITLIST'] } } },
      },
    });

    if (!session) throw new Error('Ders seansı bulunamadı.');
    if (session.status === ClassStatus.CANCELLED) throw new Error('İptal edilmiş derse kayıt yapılamaz.');
    if (new Date(session.startTime) < new Date()) throw new Error('Geçmiş derse kayıt yapılamaz.');

    // Zaten kayıtlı mı kontrolü
    const existingBooking = session.bookings.find((b) => b.userId === data.userId);
    if (existingBooking) throw new Error('Bu derse zaten kaydolunmuş.');

    // 2. Müşterinin Kullanılabilir Paketini Bul
    let targetClientPackageId = data.clientPackageId;

    if (!targetClientPackageId) {
      const activePackage = await prisma.clientPackage.findFirst({
        where: {
          studioId,
          userId: data.userId,
          status: ClientPackageStatus.ACTIVE,
          expiresAt: { gte: new Date() },
          package: {
            allowedDisciplines: { has: session.template?.discipline ?? 'PILATES' },
            allowedServices: { has: 'CLASS' },
          },
        },
        include: { package: true },
        orderBy: { expiresAt: 'asc' }, // Süresi en yakın dolacak paketi kullan
      });

      if (!activePackage) {
        throw new Error('Bu ders için geçerli ve aktif bir üyelik paketiniz bulunmuyor.');
      }

      // Kredi Bakiyesi Kontrolü (Sınırsız değilse)
      if (
        activePackage.package.type !== PackageType.UNLIMITED &&
        activePackage.creditsUsed >= activePackage.creditsTotal
      ) {
        throw new Error('Üyelik paketinizin ders kredisi tükenmiştir.');
      }

      targetClientPackageId = activePackage.id;
    }

    // Seçilen Paket Detayını Al
    const clientPackage = await prisma.clientPackage.findUnique({
      where: { id: targetClientPackageId },
      include: { package: true },
    });

    if (!clientPackage || clientPackage.studioId !== studioId) {
      throw new Error('Geçersiz paket seçimi.');
    }

    // 3. Kontenjan ve Waitlist Hesaplaması
    const confirmedCount = session.bookings.filter((b) => b.status === BookingStatus.CONFIRMED).length;
    const isFull = confirmedCount >= session.capacity;
    const bookingStatus = isFull ? BookingStatus.WAITLIST : BookingStatus.CONFIRMED;

    let waitlistOrder: number | null = null;
    if (isFull) {
      const waitlistCount = session.bookings.filter((b) => b.status === BookingStatus.WAITLIST).length;
      waitlistOrder = waitlistCount + 1;
    }

    // 4. Atomik İşlem (Transaction): Rezervasyon Oluştur ve Kredi Düş
    const booking = await prisma.$transaction(async (tx) => {
      const newBooking = await tx.booking.create({
        data: {
          sessionId: data.sessionId,
          userId: data.userId,
          clientPackageId: clientPackage.id,
          status: bookingStatus,
          waitlistOrder,
        },
        include: {
          session: { select: { title: true, startTime: true } },
          user: { select: { id: true, name: true, email: true } },
        },
      });

      // Kontenjan müsaitse ve paket sınırsız değilse kredisini düş
      if (bookingStatus === BookingStatus.CONFIRMED && clientPackage.package.type !== PackageType.UNLIMITED) {
        const updatedCreditsUsed = clientPackage.creditsUsed + 1;
        const newStatus =
          updatedCreditsUsed >= clientPackage.creditsTotal
            ? ClientPackageStatus.EXHAUSTED
            : ClientPackageStatus.ACTIVE;

        await tx.clientPackage.update({
          where: { id: clientPackage.id },
          data: {
            creditsUsed: updatedCreditsUsed,
            status: newStatus,
          },
        });
      }

      return newBooking;
    });

    await LoggerService.audit({
      studioId,
      actorId,
      category: 'BOOKING',
      action: 'BOOKING_CREATED',
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
      details: {
        bookingId: booking.id,
        sessionId: session.id,
        userId: data.userId,
        status: booking.status,
        waitlistOrder,
      },
    });

    return booking;
  }

  /**
   * Rezervasyonu İptal Eder (Müşteri veya Admin)
   */
  static async cancelBooking(
    requesterRole: Role,
    studioId: string | null | undefined,
    actorId: string,
    bookingId: string,
    meta?: Meta
  ) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        session: true,
        clientPackage: { include: { package: true } },
      },
    });

    if (!booking) throw new Error('Rezervasyon bulunamadı.');

    if (requesterRole !== 'SUPER_ADMIN' && studioId) {
      if (booking.session.studioId !== studioId) {
        throw new Error('Bu işlemi gerçekleştirme yetkiniz yok.');
      }
    }

    if (booking.status === BookingStatus.CANCELLED_EARLY || booking.status === BookingStatus.CANCELLED_LATE) {
      throw new Error('Bu rezervasyon zaten iptal edilmiş.');
    }

    const now = new Date();
    const sessionStartTime = new Date(booking.session.startTime);

    // İptal Süresi Kontrolü (Late Cancel)
    const hoursDifference = (sessionStartTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const isLateCancel = hoursDifference < booking.session.lateCancelHours;

    const newBookingStatus = isLateCancel ? BookingStatus.CANCELLED_LATE : BookingStatus.CANCELLED_EARLY;

    await prisma.$transaction(async (tx) => {
      // 1. Rezervasyon Durumunu Güncelle
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: newBookingStatus, waitlistOrder: null },
      });

      // 2. Erken İptal İse Krediyi İade Et
      if (
        newBookingStatus === BookingStatus.CANCELLED_EARLY &&
        booking.clientPackageId &&
        booking.clientPackage?.package.type !== PackageType.UNLIMITED &&
        booking.status === BookingStatus.CONFIRMED
      ) {
        await tx.clientPackage.update({
          where: { id: booking.clientPackageId },
          data: {
            creditsUsed: { decrement: 1 },
            status: ClientPackageStatus.ACTIVE,
          },
        });
      }

      // 3. İptal Edilen Ders CONFIRMED İse Waitlist'teki İlk Kişiyi Onayla
      if (booking.status === BookingStatus.CONFIRMED) {
        const nextInWaitlist = await tx.booking.findFirst({
          where: { sessionId: booking.sessionId, status: BookingStatus.WAITLIST },
          orderBy: { waitlistOrder: 'asc' },
          include: { clientPackage: { include: { package: true } } },
        });

        if (nextInWaitlist) {
          await tx.booking.update({
            where: { id: nextInWaitlist.id },
            data: { status: BookingStatus.CONFIRMED, waitlistOrder: null },
          });

          // Otomatik onaylanan üyenin kredisini düş
          if (
            nextInWaitlist.clientPackageId &&
            nextInWaitlist.clientPackage?.package.type !== PackageType.UNLIMITED
          ) {
            await tx.clientPackage.update({
              where: { id: nextInWaitlist.clientPackageId },
              data: { creditsUsed: { increment: 1 } },
            });
          }
        }
      }
    });

    await LoggerService.audit({
      studioId: booking.session.studioId,
      actorId,
      category: 'BOOKING',
      action: 'BOOKING_CANCELLED',
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
      details: {
        bookingId,
        cancellationType: newBookingStatus,
        isLateCancel,
      },
    });

    return {
      message: isLateCancel
        ? 'Ders geç iptal edildi. Geç iptal kuralları gereği kredi iadesi yapılmadı.'
        : 'Rezervasyonunuz başarıyla iptal edildi ve ders krediniz iade edildi.',
      status: newBookingStatus,
    };
  }

  /**
   * Dersteki Müşteriler İçin Yoklama Alır / Günceller (Eğitmen / Admin)
   */
  static async recordAttendance(
    studioId: string | null | undefined,
    actorId: string,
    data: AttendanceInput,
    meta?: Meta
  ) {
    const booking = await prisma.booking.findUnique({
      where: { id: data.bookingId },
      include: { session: true },
    });

    if (!booking) throw new Error('Rezervasyon bulunamadı.');

    if (studioId && booking.session.studioId !== studioId) {
      throw new Error('Bu derse yoklama girme yetkiniz yok.');
    }

    const attendance = await prisma.attendance.upsert({
      where: { bookingId: data.bookingId },
      create: {
        bookingId: data.bookingId,
        status: data.status,
        checkedInAt: new Date(),
        notes: data.notes ?? null,
      },
      update: {
        status: data.status,
        checkedInAt: new Date(),
        notes: data.notes ?? null,
      },
    });

    await LoggerService.audit({
      studioId: booking.session.studioId,
      actorId,
      category: 'BOOKING',
      action: 'ATTENDANCE_RECORDED',
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
      details: { bookingId: data.bookingId, status: data.status },
    });

    return attendance;
  }
}