import { prisma } from '../utils/prisma';
import { LoggerService } from '../utils/logger';
import { Sanitizer } from '../utils/sanitizer';

export interface CreateStudioInput {
  name: string;
  subdomain: string;
  phone?: string;
  taxNumber?: string;
  taxOffice?: string;
  address?: string;
  currency?: string;
  paytrMerchantId?: string;
  paytrSecretKey?: string;
  // İlk Admin Hesabı Bilgileri
  adminName: string;
  adminEmail: string;
  adminPassword?: string;
}

export interface UpdateStudioInput {
  name?: string;
  phone?: string;
  taxNumber?: string;
  taxOffice?: string;
  address?: string;
  currency?: string;
  paytrMerchantId?: string;
  paytrSecretKey?: string;
  isActive?: boolean;
}

export interface Meta {
  ip?: string;
  userAgent?: string;
}

export class StudioService {
  /**
   * Tüm Stüdyoları Listeler (Sadece SUPER_ADMIN)
   */
  static async listStudios(search?: string, isActive?: boolean) {
    const where: any = {};

    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    }

    if (search) {
      const searchTerm = search.trim();
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { subdomain: { contains: searchTerm, mode: 'insensitive' } },
        { phone: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    return await prisma.studio.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            users: true,
            classSessions: true,
            clientPackages: true,
            payments: true,
          },
        },
      },
    });
  }

  /**
   * Tekil Stüdyo Detayını Getirir
   */
  static async getStudioById(studioId: string) {
    const studio = await prisma.studio.findUnique({
      where: { id: studioId },
      include: {
        users: {
          where: { role: 'ADMIN' },
          select: { id: true, name: true, email: true, phone: true, createdAt: true },
        },
        _count: {
          select: {
            users: true,
            classSessions: true,
            packages: true,
            products: true,
          },
        },
      },
    });

    if (!studio) throw new Error('Stüdyo bulunamadı.');
    return studio;
  }

  /**
   * Yeni Stüdyo ve İlk Stüdyo Admin Hesabını Oluşturur (SUPER_ADMIN)
   */
  static async createStudio(actorId: string, data: CreateStudioInput, meta?: Meta) {
    const normalizedSubdomain = data.subdomain.toLowerCase().trim();

    // Subdomain çakışma kontrolü
    const existingStudio = await prisma.studio.findUnique({
      where: { subdomain: normalizedSubdomain },
    });

    if (existingStudio) {
      throw new Error('Bu subdomain başka bir stüdyo tarafından kullanılmaktadır.');
    }

    const normalizedAdminEmail = Sanitizer.normalizeEmail(data.adminEmail);

    // Atomik İşlem: Stüdyo ve Admin Hesabı Birlikte Oluşturulur
    const result = await prisma.$transaction(async (tx) => {
      const newStudio = await tx.studio.create({
        data: {
          name: Sanitizer.sanitizeString(data.name),
          subdomain: normalizedSubdomain,
          phone: data.phone ?? null,
          taxNumber: data.taxNumber ?? null,
          taxOffice: data.taxOffice ?? null,
          address: data.address ? Sanitizer.sanitizeString(data.address) : null,
          currency: data.currency ?? 'TRY',
          paytrMerchantId: data.paytrMerchantId ?? null,
          paytrSecretKey: data.paytrSecretKey ?? null,
          isActive: true,
        },
      });

      // Varsayılan şifre tanımlama ve hashleme
      const { hashPassword } = await import('../utils/jwt');
      const hashedPassword = await hashPassword(data.adminPassword || '123456');

      const studioAdmin = await tx.user.create({
        data: {
          studioId: newStudio.id,
          name: Sanitizer.sanitizeString(data.adminName),
          email: normalizedAdminEmail,
          password: hashedPassword,
          role: 'ADMIN',
          phone: data.phone ?? null,
          isActive: true,
        },
        select: { id: true, name: true, email: true, role: true },
      });

      return { studio: newStudio, admin: studioAdmin };
    });

    await LoggerService.audit({
      studioId: result.studio.id,
      actorId,
      category: 'SYSTEM',
      action: 'STUDIO_CREATED',
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
      details: { studioId: result.studio.id, subdomain: result.studio.subdomain },
    });

    return result;
  }

  /**
   * Stüdyo Bilgilerini Günceller
   */
  static async updateStudio(actorId: string, studioId: string, data: UpdateStudioInput, meta?: Meta) {
    const studio = await prisma.studio.findUnique({ where: { id: studioId } });
    if (!studio) throw new Error('Stüdyo bulunamadı.');

    const updated = await prisma.studio.update({
      where: { id: studioId },
      data: {
        name: data.name ? Sanitizer.sanitizeString(data.name) : undefined,
        phone: data.phone !== undefined ? data.phone : undefined,
        taxNumber: data.taxNumber !== undefined ? data.taxNumber : undefined,
        taxOffice: data.taxOffice !== undefined ? data.taxOffice : undefined,
        address: data.address !== undefined ? Sanitizer.sanitizeString(data.address) : undefined,
        currency: data.currency ?? undefined,
        paytrMerchantId: data.paytrMerchantId !== undefined ? data.paytrMerchantId : undefined,
        paytrSecretKey: data.paytrSecretKey !== undefined ? data.paytrSecretKey : undefined,
        isActive: data.isActive !== undefined ? data.isActive : undefined,
      },
    });

    await LoggerService.audit({
      studioId,
      actorId,
      category: 'SYSTEM',
      action: 'STUDIO_UPDATED',
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
      details: { studioId, changes: data },
    });

    return updated;
  }

  /**
   * Stüdyoyu Aktif/Pasif Yapma (Askıya Alma)
   */
  static async toggleStudioStatus(actorId: string, studioId: string, isActive: boolean, meta?: Meta) {
    const studio = await prisma.studio.findUnique({ where: { id: studioId } });
    if (!studio) throw new Error('Stüdyo bulunamadı.');

    const updated = await prisma.studio.update({
      where: { id: studioId },
      data: { isActive },
    });

    // Stüdyo pasife çekildiğinde bağlı tüm kullanıcıların aktif refresh token'larını iptal et
    if (!isActive) {
      await prisma.refreshToken.updateMany({
        where: { user: { studioId } },
        data: { revoked: true },
      });
    }

    await LoggerService.audit({
      studioId,
      actorId,
      category: 'SYSTEM',
      action: isActive ? 'STUDIO_ACTIVATED' : 'STUDIO_DEACTIVATED',
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
      details: { studioId, isActive },
    });

    return updated;
  }

  /**
   * SaaS Genel Metrikleri ve Dashboard Özet Raporu
   */
  static async getPlatformMetrics() {
    const [totalStudios, activeStudios, totalUsers, totalPayments] = await Promise.all([
      prisma.studio.count(),
      prisma.studio.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: { not: 'SUPER_ADMIN' } } }),
      prisma.payment.aggregate({
        where: { status: 'SUCCESS' },
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    return {
      totalStudios,
      activeStudios,
      totalUsers,
      totalRevenue: totalPayments._sum.amount || 0,
      totalTransactions: totalPayments._count.id || 0,
    };
  }
}