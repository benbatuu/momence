import type { Context } from 'hono';
import { UserService } from '../services/user.service';
import { successResponse, errorResponse } from '../utils/response';
import type { Role } from '@prisma/client';
import HttpStatusCode from '../types/httpstatuscode';

export class UserController {
  /**
   * Helper: İstemci IP ve UserAgent bilgilerini extract eder
   */
  private static getMeta(c: Context) {
    return {
      ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '127.0.0.1',
      userAgent: c.req.header('user-agent'),
    };
  }

  /**
   * GET /api/users
   * Kullanıcıları listeler (SUPER_ADMIN tümünü, ADMIN kendi stüdyosunu görebilir)
   */
  static async listUsers(c: Context) {
    try {
      const actor = c.get('user');
      const studioId = c.get('studioId') || null;

      const search = c.req.query('search');
      const role = c.req.query('role') as Role | undefined;
      const isActiveParam = c.req.query('isActive');
      const page = Number(c.req.query('page')) || 1;
      const limit = Number(c.req.query('limit')) || 10;

      const isActive = isActiveParam !== undefined ? isActiveParam === 'true' : undefined;

      const result = await UserService.listUsers(actor.role, studioId, {
        search,
        role,
        isActive,
        page,
        limit,
      });

      return successResponse(c, result, 'Kullanıcılar listelendi.', HttpStatusCode.OK);
    } catch (err: any) {
      return errorResponse(c, err.message, HttpStatusCode.BAD_REQUEST);
    }
  }

  /**
   * GET /api/users/:id
   * Tekil kullanıcı detayını getirir
   */
  static async getUserById(c: Context) {
    try {
      const actor = c.get('user');
      const studioId = c.get('studioId') || null;
      const userId = c.req.param('id');

      if (!userId) {
        return errorResponse(c, 'Kullanıcı ID gereklidir.', HttpStatusCode.BAD_REQUEST);
      }

      const user = await UserService.getById(actor.role, studioId, userId);
      return successResponse(c, user, 'Kullanıcı detayları getirildi.', HttpStatusCode.OK);
    } catch (err: any) {
      return errorResponse(c, err.message, HttpStatusCode.NOT_FOUND);
    }
  }

  /**
   * POST /api/users
   * Yeni kullanıcı / personel oluşturur (Admin)
   */
  static async createUser(c: Context) {
    try {
      const studioId = c.get('studioId') || null;
      const actor = c.get('user');
      const body = await c.req.json();
      const meta = UserController.getMeta(c);

      if (!actor?.id) {
        return errorResponse(c, 'Oturum bilgisi bulunamadı.', HttpStatusCode.UNAUTHORIZED);
      }

      if (!body.name || !body.email || !body.role) {
        return errorResponse(c, 'Ad Soyad, E-posta ve Rol alanları zorunludur.', HttpStatusCode.BAD_REQUEST);
      }

      const newUser = await UserService.createUser(studioId, body, actor.id, meta);
      return successResponse(c, newUser, 'Kullanıcı başarıyla oluşturuldu.', HttpStatusCode.CREATED);
    } catch (err: any) {
      return errorResponse(c, err.message, HttpStatusCode.BAD_REQUEST);
    }
  }

  /**
   * PUT /api/users/profile
   * Oturum açmış kullanıcının kendi profilini güncellemesi (/dashboard/settings)
   */
  static async updateProfile(c: Context) {
    try {
      const actor = c.get('user');
      const body = await c.req.json();
      const meta = UserController.getMeta(c);

      if (!actor?.id) {
        return errorResponse(c, 'Oturum bilgisi bulunamadı.', HttpStatusCode.UNAUTHORIZED);
      }

      const updatedUser = await UserService.updateProfile(actor.id, body, meta);
      return successResponse(c, updatedUser, 'Profil başarıyla güncellendi.', HttpStatusCode.OK);
    } catch (err: any) {
      return errorResponse(c, err.message, HttpStatusCode.BAD_REQUEST);
    }
  }

  /**
   * POST /api/users/change-password
   * Oturum açmış kullanıcının şifresini değiştirmesi (/dashboard/settings)
   */
  static async changePassword(c: Context) {
    try {
      const actor = c.get('user');
      const { currentPassword, newPassword } = await c.req.json();
      const meta = UserController.getMeta(c);

      if (!actor?.id) {
        return errorResponse(c, 'Oturum bilgisi bulunamadı.', HttpStatusCode.UNAUTHORIZED);
      }

      if (!currentPassword || !newPassword) {
        return errorResponse(c, 'Mevcut şifre ve yeni şifre alanları zorunludur.', HttpStatusCode.BAD_REQUEST);
      }

      const result = await UserService.changePassword(actor.id, currentPassword, newPassword, meta);
      return successResponse(c, result, 'Şifre başarıyla değiştirildi.', HttpStatusCode.OK);
    } catch (err: any) {
      return errorResponse(c, err.message, HttpStatusCode.BAD_REQUEST);
    }
  }

  /**
   * PATCH /api/users/:id/status
   * Kullanıcı durumunu aktif/pasif yapar (Admin)
   */
  static async toggleStatus(c: Context) {
    try {
      const actor = c.get('user');
      const studioId = c.get('studioId') || null;
      const targetUserId = c.req.param('id');
      const body = await c.req.json();
      const meta = UserController.getMeta(c);

      if (!actor?.id || !targetUserId) {
        return errorResponse(c, 'Gerekli parametreler eksik.', HttpStatusCode.BAD_REQUEST);
      }

      if (typeof body.isActive !== 'boolean') {
        return errorResponse(c, 'isActive değeri boolean olarak belirtilmelidir.', HttpStatusCode.BAD_REQUEST);
      }

      const result = await UserService.toggleUserStatus(
        actor.role,
        studioId,
        targetUserId,
        body.isActive,
        actor.id,
        meta
      );

      return successResponse(
        c,
        result,
        `Kullanıcı durumu ${body.isActive ? 'aktif' : 'pasif'} yapıldı.`,
        HttpStatusCode.OK
      );
    } catch (err: any) {
      return errorResponse(c, err.message, HttpStatusCode.BAD_REQUEST);
    }
  }
}