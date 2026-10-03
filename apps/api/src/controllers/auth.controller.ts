import type { Context } from 'hono';
import { AuthService } from '../services/auth.service';
import { successResponse, errorResponse } from '../utils/response';

export class AuthController {
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
   * POST /api/auth/register
   * Müşteri / Danışan kaydı oluşturur.
   */
  static async register(c: Context) {
    try {
      const studioId = c.get('studioId') || null;
      const body = await c.req.json();
      const meta = AuthController.getMeta(c);

      const result = await AuthService.register(studioId, body, meta);
      return successResponse(c, result, 'Kayıt başarıyla tamamlandı.', 201);
    } catch (err: any) {
      return errorResponse(c, err.message, 400);
    }
  }

  /**
   * POST /api/auth/login
   * SUPER_ADMIN, ADMIN, INSTRUCTOR veya CLIENT girişi yapar.
   */
  static async login(c: Context) {
    try {
      const studioId = c.get('studioId') || null;
      const body = await c.req.json();
      const meta = AuthController.getMeta(c);

      const result = await AuthService.login(studioId, body.email, body.password, meta);
      return successResponse(c, result, 'Giriş başarılı.');
    } catch (err: any) {
      return errorResponse(c, err.message, 401);
    }
  }

  /**
   * GET /api/auth/me
   * Oturum açmış kullanıcının bilgilerini getirir.
   */
  static async me(c: Context) {
    try {
      const user = c.get('user');
      if (!user) {
        return errorResponse(c, 'Oturum bulunamadı veya geçersiz.', 401);
      }
      return successResponse(c, { user }, 'Kullanıcı profili getirildi.');
    } catch (err: any) {
      return errorResponse(c, err.message, 401);
    }
  }

  /**
   * POST /api/auth/refresh-token
   * Access token yeniler.
   */
  static async refreshToken(c: Context) {
    try {
      const body = await c.req.json();
      if (!body.refreshToken) {
        return errorResponse(c, 'Refresh token zorunludur.', 400);
      }

      const meta = AuthController.getMeta(c);
      const result = await AuthService.refreshToken(body.refreshToken, meta);
      return successResponse(c, result, 'Token başarıyla yenilendi.');
    } catch (err: any) {
      return errorResponse(c, err.message, 401);
    }
  }

  /**
   * POST /api/auth/forgot-password
   * Şifre sıfırlama OTP kodu talep eder.
   */
  static async forgotPassword(c: Context) {
    try {
      const studioId = c.get('studioId') || null;
      const body = await c.req.json();

      if (!body.email) {
        return errorResponse(c, 'E-posta adresi zorunludur.', 400);
      }

      const meta = AuthController.getMeta(c);
      const result = await AuthService.forgotPassword(studioId, body.email, meta);
      return successResponse(c, result);
    } catch (err: any) {
      return errorResponse(c, err.message, 400);
    }
  }

  /**
   * POST /api/auth/reset-password
   * OTP kodu ile şifreyi sıfırlar.
   */
  static async resetPassword(c: Context) {
    try {
      const studioId = c.get('studioId') || null;
      const body = await c.req.json();

      if (!body.email || !body.otpCode || !body.newPassword) {
        return errorResponse(c, 'E-posta, OTP kodu ve yeni şifre alanları zorunludur.', 400);
      }

      const meta = AuthController.getMeta(c);
      const result = await AuthService.resetPassword(
        studioId,
        body.email,
        body.otpCode,
        body.newPassword,
        meta
      );
      return successResponse(c, result);
    } catch (err: any) {
      return errorResponse(c, err.message, 400);
    }
  }

  /**
   * POST /api/auth/logout
   * Refresh token'ı iptal ederek çıkış yapar.
   */
  static async logout(c: Context) {
    try {
      const body = await c.req.json();
      if (!body.refreshToken) {
        return errorResponse(c, 'Refresh token zorunludur.', 400);
      }

      const meta = AuthController.getMeta(c);
      const result = await AuthService.logout(body.refreshToken, meta);
      return successResponse(c, result);
    } catch (err: any) {
      return errorResponse(c, err.message, 400);
    }
  }
}