import { prisma } from '../utils/prisma';
import { Sanitizer } from '../utils/sanitizer';
import { hashPassword, verifyPassword } from '../utils/jwt';
import { LoggerService } from '../utils/logger';
import type { Role } from '@prisma/client';

export interface UserFilterOptions {
  search?: string;
  role?: Role;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateUserData {
  name: string;
  email: string;
  password?: string;
  role: Role;
  phone?: string;
  identityNumber?: string;
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface Meta {
  ip?: string;
  userAgent?: string;
}

export class UserService {
  /**
   * Kullanıcıları Listeler (SUPER_ADMIN tümünü, ADMIN sadece kendi stüdyosunu görebilir)
   */
  static async listUsers(
    requesterRole: Role,
    studioId: string | null | undefined,
    options: UserFilterOptions
  ) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, options.limit || 10);
    const skip = (page - 1) * limit;

    const where: any = {};

    // Güvenlik Kilidi: SUPER_ADMIN değilse studioId zorunludur!
    if (requesterRole !== 'SUPER_ADMIN') {
      if (!studioId) {
        throw new Error('Stüdyo kimliği bulunamadı.');
      }
      where.studioId = studioId;
    } else if (studioId) {
      // SUPER_ADMIN belirli bir stüdyoyu filtrelemek isterse
      where.studioId = studioId;
    }

    if (options.role) {
      where.role = options.role;
    }

    if (typeof options.isActive === 'boolean') {
      where.isActive = options.isActive;
    }

    if (options.search) {
      const searchTerm = options.search.trim();
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { phone: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          studioId: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          avatarUrl: true,
          identityNumber: true,
          createdAt: true,
          updatedAt: true,
          studio: {
            select: {
              id: true,
              name: true,
              subdomain: true, // Prisma şemasındaki 'subdomain' alanına güncellendi
            },
          },
          _count: {
            select: {
              clientPackages: true,
              bookings: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Tekil Kullanıcı Detayı Getirir
   */
  static async getById(requesterRole: Role, studioId: string | null | undefined, userId: string) {
    const where: any = { id: userId };

    if (requesterRole !== 'SUPER_ADMIN') {
      if (!studioId) throw new Error('Stüdyo kimliği bulunamadı.');
      where.studioId = studioId;
    }

    const user = await prisma.user.findFirst({
      where,
      select: {
        id: true,
        studioId: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        avatarUrl: true,
        identityNumber: true,
        createdAt: true,
        updatedAt: true,
        clientPackages: {
          where: { status: 'ACTIVE' },
          include: { package: true },
        },
        bookings: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { 
            session: { // Booking -> ClassSession ilişkisinin şemadaki adı 'session'
              include: { template: true } 
            } 
          },
        },
      },
    });

    if (!user) {
      throw new Error('Kullanıcı bulunamadı.');
    }

    return user;
  }

  /**
   * Admin Panelinden Yeni Kullanıcı / Personel Ekleme
   */
  static async createUser(
    studioId: string | null | undefined,
    data: CreateUserData,
    actorId: string,
    meta?: Meta
  ) {
    if (!studioId) throw new Error('Stüdyo kimliği bulunamadı.');

    const normalizedEmail = Sanitizer.normalizeEmail(data.email);
    const sanitizedName = Sanitizer.sanitizeString(data.name);

    // Stüdyo içinde mükerrer e-posta kontrolü
    const existingUser = await prisma.user.findFirst({
      where: { email: normalizedEmail, studioId },
    });

    if (existingUser) {
      throw new Error('Bu e-posta adresi bu stüdyoda zaten kayıtlı.');
    }

    const defaultPassword = data.password || '123456';
    const hashedPassword = await hashPassword(defaultPassword);

    const newUser = await prisma.user.create({
      data: {
        studioId,
        name: sanitizedName,
        email: normalizedEmail,
        password: hashedPassword,
        role: data.role,
        phone: data.phone ?? null,
        identityNumber: data.identityNumber ?? null,
        isActive: true,
      },
      select: {
        id: true,
        studioId: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });

    await LoggerService.audit({
      studioId,
      actorId,
      category: 'USER_MANAGEMENT',
      action: 'USER_CREATED',
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
      details: { createdUserId: newUser.id, role: newUser.role },
    });

    return newUser;
  }

  /**
   * Oturum Açmış Kullanıcının Kendi Profilini Güncellemesi (/dashboard/settings)
   */
  static async updateProfile(userId: string, data: UpdateProfileData, meta?: Meta) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('Kullanıcı bulunamadı.');

    const updateData: any = {};

    if (data.name) updateData.name = Sanitizer.sanitizeString(data.name);
    if (data.phone) updateData.phone = data.phone;
    if (data.avatarUrl) updateData.avatarUrl = data.avatarUrl;

    if (data.email && data.email !== user.email) {
      const normalizedEmail = Sanitizer.normalizeEmail(data.email);
      const existing = await prisma.user.findFirst({
        where: { email: normalizedEmail, studioId: user.studioId },
      });
      if (existing) throw new Error('Bu e-posta adresi kullanımda.');
      updateData.email = normalizedEmail;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        role: true,
      },
    });

    await LoggerService.audit({
      studioId: user.studioId ?? 'GLOBAL',
      actorId: userId,
      category: 'USER_MANAGEMENT',
      action: 'PROFILE_UPDATED',
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return updatedUser;
  }

  /**
   * Oturum Açmış Kullanıcının Kendi Şifresini Değiştirmesi (/dashboard/settings)
   */
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    meta?: Meta
  ) {
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Yeni şifre en az 6 karakter olmalıdır.');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.password) throw new Error('Kullanıcı bulunamadı.');

    const isValid = await verifyPassword(currentPassword, user.password);
    if (!isValid) throw new Error('Mevcut şifreniz hatalı.');

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Oturum güvenliği: Eski refresh token'ları iptal et
    await prisma.refreshToken.updateMany({
      where: { userId },
      data: { revoked: true },
    });

    await LoggerService.audit({
      studioId: user.studioId ?? 'GLOBAL',
      actorId: userId,
      category: 'USER_MANAGEMENT',
      action: 'PASSWORD_CHANGED',
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return { message: 'Şifreniz başarıyla değiştirildi.' };
  }

  /**
   * Admin Tarafından Kullanıcı Durumunu Aktif/Pasif Yapma
   */
  static async toggleUserStatus(
    requesterRole: Role,
    studioId: string | null | undefined,
    targetUserId: string,
    isActive: boolean,
    actorId: string,
    meta?: Meta
  ) {
    const where: any = { id: targetUserId };
    if (requesterRole !== 'SUPER_ADMIN') {
      if (!studioId) throw new Error('Stüdyo kimliği bulunamadı.');
      where.studioId = studioId;
    }

    const user = await prisma.user.findFirst({ where });
    if (!user) throw new Error('Kullanıcı bulunamadı.');

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { isActive },
      select: { id: true, name: true, isActive: true },
    });

    // Kullanıcı pasife alındıysa aktif oturumlarını düşür
    if (!isActive) {
      await prisma.refreshToken.updateMany({
        where: { userId: targetUserId },
        data: { revoked: true },
      });
    }

    await LoggerService.audit({
      studioId: user.studioId ?? 'GLOBAL',
      actorId,
      category: 'USER_MANAGEMENT',
      action: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
      details: { targetUserId },
    });

    return updated;
  }
}