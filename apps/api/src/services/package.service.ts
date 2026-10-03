import { prisma } from '../utils/prisma';
import { LoggerService } from '../utils/logger';
import { Sanitizer } from '../utils/sanitizer';
import {
  PackageType,
  Discipline,
  ServiceType,
  ClientPackageStatus,
  PaymentMethod,
  Role,
} from '@prisma/client';

export interface CreatePackageInput {
  name: string;
  type?: PackageType;
  creditCount: number; // -1 ise sınırsız
  price: number;
  validityDays: number;
  allowedDisciplines?: Discipline[];
  allowedServices?: ServiceType[];
  isOnlineSaleAllowed?: boolean;
}

export interface UpdatePackageInput {
  name?: string;
  type?: PackageType;
  creditCount?: number;
  price?: number;
  validityDays?: number;
  allowedDisciplines?: Discipline[];
  allowedServices?: ServiceType[];
  isOnlineSaleAllowed?: boolean;
  isActive?: boolean;
}

export interface AssignPackageInput {
  userId: string;
  packageId: string;
  customPrice?: number;
  customValidityDays?: number;
  paymentMethod?: PaymentMethod;
}

export interface Meta {
  ip?: string;
  userAgent?: string;
}

export class PackageService {
  // ==========================================
  // 1. PAKET ŞABLONLARI (Package Templates)
  // ==========================================

  /**
   * Stüdyo Paket Şablonlarını Listele
   */
  static async listPackages(
    requesterRole: Role,
    studioId: string | null | undefined,
    includeInactive: boolean = false
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

    return await prisma.package.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        studio: { select: { id: true, name: true, subdomain: true } },
        _count: { select: { clientPackages: true } },
      },
    });
  }

  /**
   * Tekil Paket Şablonu Detayı
   */
  static async getPackageById(packageId: string, studioId?: string | null) {
    const where: any = { id: packageId };
    if (studioId) where.studioId = studioId;

    const pkg = await prisma.package.findFirst({
      where,
      include: { studio: { select: { id: true, name: true, subdomain: true } } },
    });

    if (!pkg) throw new Error('Paket şablonu bulunamadı.');
    return pkg;
  }

  /**
   * Yeni Paket Şablonu Oluştur (ADMIN)
   */
  static async createPackage(
    studioId: string,
    actorId: string,
    data: CreatePackageInput,
    meta?: Meta
  ) {
    if (!studioId) throw new Error('Stüdyo kimliği bulunamadı.');

    const sanitizedName = Sanitizer.sanitizeString(data.name);

    const pkg = await prisma.package.create({
      data: {
        studioId,
        name: sanitizedName,
        type: data.type ?? PackageType.CREDIT_PACK,
        creditCount: data.creditCount,
        price: data.price,
        validityDays: data.validityDays,
        allowedDisciplines: data.allowedDisciplines ?? [Discipline.PILATES, Discipline.YOGA, Discipline.REFORMER],
        allowedServices: data.allowedServices ?? [ServiceType.CLASS],
        isOnlineSaleAllowed: data.isOnlineSaleAllowed ?? true,
        isActive: true,
      },
    });

    await LoggerService.audit({
      studioId,
      actorId,
      category: 'PACKAGE',
      action: 'PACKAGE_TEMPLATE_CREATED',
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
      details: { packageId: pkg.id, name: pkg.name, price: pkg.price, type: pkg.type },
    });

    return pkg;
  }

  /**
   * Paket Şablonunu Güncelle (ADMIN)
   */
  static async updatePackage(
    studioId: string | null | undefined,
    actorId: string,
    packageId: string,
    data: UpdatePackageInput,
    meta?: Meta
  ) {
    const existingPackage = await prisma.package.findUnique({ where: { id: packageId } });

    if (!existingPackage) {
      throw new Error('Paket şablonu bulunamadı.');
    }

    if (studioId && existingPackage.studioId !== studioId) {
      throw new Error('Bu paketi düzenleme yetkiniz bulunmuyor.');
    }

    const updated = await prisma.package.update({
      where: { id: packageId },
      data: {
        name: data.name ? Sanitizer.sanitizeString(data.name) : undefined,
        type: data.type ?? undefined,
        creditCount: data.creditCount !== undefined ? data.creditCount : undefined,
        price: data.price !== undefined ? data.price : undefined,
        validityDays: data.validityDays !== undefined ? data.validityDays : undefined,
        allowedDisciplines: data.allowedDisciplines ?? undefined,
        allowedServices: data.allowedServices ?? undefined,
        isOnlineSaleAllowed: data.isOnlineSaleAllowed !== undefined ? data.isOnlineSaleAllowed : undefined,
        isActive: data.isActive !== undefined ? data.isActive : undefined,
      },
    });

    await LoggerService.audit({
      studioId: updated.studioId,
      actorId,
      category: 'PACKAGE',
      action: 'PACKAGE_TEMPLATE_UPDATED',
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
      details: { packageId: updated.id, changes: data },
    });

    return updated;
  }

  // ==========================================
  // 2. MÜŞTERİ PAKETLERİ (Client Packages)
  // ==========================================

  /**
   * Müşteriye Paket Tanımla / Satın Al (Manuel veya Online)
   */
  static async assignPackageToClient(
    studioId: string,
    actorId: string,
    data: AssignPackageInput,
    meta?: Meta
  ) {
    const pkg = await prisma.package.findFirst({
      where: { id: data.packageId, studioId, isActive: true },
    });

    if (!pkg) {
      throw new Error('Geçerli bir paket şablonu bulunamadı.');
    }

    const user = await prisma.user.findFirst({
      where: { id: data.userId, studioId },
    });

    if (!user) {
      throw new Error('Müşteri bulunamadı.');
    }

    const pricePaid = data.customPrice ?? pkg.price;
    const validityDays = data.customValidityDays ?? pkg.validityDays;

    // Bitiş tarihi hesaplama
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + validityDays);

    // Atomik İşlem: Müşteri Paketi Tanımla ve Ödeme Kaydı Oluştur
    const clientPackage = await prisma.$transaction(async (tx) => {
      const assigned = await tx.clientPackage.create({
        data: {
          studioId,
          userId: data.userId,
          packageId: pkg.id,
          creditsTotal: pkg.creditCount,
          creditsUsed: 0,
          pricePaid,
          expiresAt,
          status: ClientPackageStatus.ACTIVE,
          isActive: true,
        },
        include: {
          package: true,
          user: { select: { id: true, name: true, email: true } },
        },
      });

      // Ödeme Kaydı
      await tx.payment.create({
        data: {
          studioId,
          userId: data.userId,
          clientPackageId: assigned.id,
          amount: pricePaid,
          paymentMethod: data.paymentMethod ?? PaymentMethod.CASH,
          status: 'SUCCESS',
        },
      });

      return assigned;
    });

    await LoggerService.audit({
      studioId,
      actorId,
      category: 'PACKAGE',
      action: 'CLIENT_PACKAGE_ASSIGNED',
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
      details: {
        clientPackageId: clientPackage.id,
        userId: data.userId,
        packageName: pkg.name,
        pricePaid,
        expiresAt,
      },
    });

    return clientPackage;
  }

  /**
   * Müşterinin Aktif ve Geçmiş Paketlerini Listele
   */
  static async getClientPackages(
    userId: string,
    studioId?: string | null,
    status?: ClientPackageStatus
  ) {
    const where: any = { userId };
    if (studioId) where.studioId = studioId;
    if (status) where.status = status;

    const packages = await prisma.clientPackage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        package: {
          select: {
            id: true,
            name: true,
            type: true,
            creditCount: true,
            allowedDisciplines: true,
            allowedServices: true,
          },
        },
        studio: { select: { id: true, name: true, subdomain: true } },
        _count: { select: { bookings: true, appointments: true } },
      },
    });

    // Otomatik Zaman Aşımı Kontrolü (Expired Status Update)
    const now = new Date();
    const updatedPackages = packages.map((cp) => {
      if (cp.status === ClientPackageStatus.ACTIVE && cp.expiresAt < now) {
        return { ...cp, status: ClientPackageStatus.EXPIRED };
      }
      return cp;
    });

    return updatedPackages;
  }

  /**
   * Manuel Kredi Düzenleme (Admin Tarafından Müşterinin Kredisini Artırma/Eksiltme)
   */
  static async adjustCredits(
    studioId: string | null | undefined,
    actorId: string,
    clientPackageId: string,
    creditDelta: number, // Pozitif ekler, negatif düşer
    reason?: string,
    meta?: Meta
  ) {
    const clientPackage = await prisma.clientPackage.findUnique({
      where: { id: clientPackageId },
      include: { package: true },
    });

    if (!clientPackage) throw new Error('Müşteri paketi bulunamadı.');

    if (studioId && clientPackage.studioId !== studioId) {
      throw new Error('Bu paketi düzenleme yetkiniz bulunmuyor.');
    }

    if (clientPackage.package.type === PackageType.UNLIMITED) {
      throw new Error('Sınırsız paketlerde kredi sayısı düzenlenemez.');
    }

    const newCreditsUsed = Math.max(0, clientPackage.creditsUsed - creditDelta);
    let newStatus = clientPackage.status;

    // Kredi bittiyse EXHAUSTED yap, kredi eklendiyse ve süresi geçmediyse ACTIVE yap
    if (newCreditsUsed >= clientPackage.creditsTotal) {
      newStatus = ClientPackageStatus.EXHAUSTED;
    } else if (newStatus === ClientPackageStatus.EXHAUSTED && clientPackage.expiresAt > new Date()) {
      newStatus = ClientPackageStatus.ACTIVE;
    }

    const updated = await prisma.clientPackage.update({
      where: { id: clientPackageId },
      data: {
        creditsUsed: newCreditsUsed,
        status: newStatus,
      },
    });

    await LoggerService.audit({
      studioId: clientPackage.studioId,
      actorId,
      category: 'PACKAGE',
      action: 'CLIENT_PACKAGE_CREDITS_ADJUSTED',
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
      details: {
        clientPackageId,
        creditDelta,
        newCreditsUsed,
        reason,
      },
    });

    return updated;
  }

  /**
   * Müşteri Paketini İptal Et (Admin)
   */
  static async cancelClientPackage(
    studioId: string | null | undefined,
    actorId: string,
    clientPackageId: string,
    reason?: string,
    meta?: Meta
  ) {
    const clientPackage = await prisma.clientPackage.findUnique({ where: { id: clientPackageId } });

    if (!clientPackage) throw new Error('Müşteri paketi bulunamadı.');

    if (studioId && clientPackage.studioId !== studioId) {
      throw new Error('Bu işlemi gerçekleştirme yetkiniz yok.');
    }

    const updated = await prisma.clientPackage.update({
      where: { id: clientPackageId },
      data: {
        status: ClientPackageStatus.CANCELLED,
        isActive: false,
      },
    });

    await LoggerService.audit({
      studioId: clientPackage.studioId,
      actorId,
      category: 'PACKAGE',
      action: 'CLIENT_PACKAGE_CANCELLED',
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
      details: { clientPackageId, reason },
    });

    return updated;
  }
}