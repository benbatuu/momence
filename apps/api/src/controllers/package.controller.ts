import type { Context } from 'hono';
import { PackageService } from '../services/package.service';
import { successResponse, errorResponse } from '../utils/response';
import HttpStatusCode from '../types/httpstatuscode';

export class PackageController {
  private static getMeta(c: Context) {
    return {
      ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '127.0.0.1',
      userAgent: c.req.header('user-agent'),
    };
  }

  /**
   * GET /api/packages
   * Stüdyo Paket Şablonlarını Listele
   */
  static async listPackages(c: Context) {
    try {
      const actor = c.get('user');
      const studioId = c.get('studioId') || null;
      const includeInactive = c.req.query('includeInactive') === 'true';

      const packages = await PackageService.listPackages(actor.role, studioId, includeInactive);
      return successResponse(c, packages, 'Paket şablonları listelendi.', HttpStatusCode.OK);
    } catch (err: any) {
      return errorResponse(c, err.message, HttpStatusCode.BAD_REQUEST);
    }
  }

  /**
   * GET /api/packages/:id
   * Tekil Paket Şablonu Detayı
   */
  static async getPackageById(c: Context) {
    try {
      const studioId = c.get('studioId') || null;
      const packageId = c.req.param('id');
      if(!packageId) {
        return errorResponse(c, 'Paket ID eksik.', HttpStatusCode.BAD_REQUEST);
      }

      const pkg = await PackageService.getPackageById(packageId, studioId);
      return successResponse(c, pkg, 'Paket detayları getirildi.', HttpStatusCode.OK);
    } catch (err: any) {
      return errorResponse(c, err.message, HttpStatusCode.NOT_FOUND);
    }
  }

  /**
   * POST /api/packages
   * Yeni Paket Şablonu Ekle (SUPER_ADMIN, ADMIN)
   */
  static async createPackage(c: Context) {
    try {
      const studioId = c.get('studioId') || null;
      const actor = c.get('user');
      const body = await c.req.json();
      const meta = PackageController.getMeta(c);

      if (!studioId) {
        return errorResponse(c, 'Stüdyo bilgisi bulunamadı.', HttpStatusCode.BAD_REQUEST);
      }

      if (!actor?.id) {
        return errorResponse(c, 'Oturum bilgisi eksik.', HttpStatusCode.UNAUTHORIZED);
      }

      if (!body.name || body.creditCount === undefined || !body.price || !body.validityDays) {
        return errorResponse(c, 'Gerekli paket bilgileri eksik.', HttpStatusCode.BAD_REQUEST);
      }

      const pkg = await PackageService.createPackage(studioId, actor.id, body, meta);
      return successResponse(c, pkg, 'Paket şablonu oluşturuldu.', HttpStatusCode.CREATED);
    } catch (err: any) {
      return errorResponse(c, err.message, HttpStatusCode.BAD_REQUEST);
    }
  }

  /**
   * PUT /api/packages/:id
   * Paket Şablonu Güncelle (SUPER_ADMIN, ADMIN)
   */
  static async updatePackage(c: Context) {
    try {
      const studioId = c.get('studioId') || null;
      const actor = c.get('user');
      const packageId = c.req.param('id');
      const body = await c.req.json();
      const meta = PackageController.getMeta(c);

      if (!actor?.id || !packageId) {
        return errorResponse(c, 'Gerekli parametreler eksik.', HttpStatusCode.BAD_REQUEST);
      }

      const updated = await PackageService.updatePackage(studioId, actor.id, packageId, body, meta);
      return successResponse(c, updated, 'Paket şablonu güncellendi.', HttpStatusCode.OK);
    } catch (err: any) {
      return errorResponse(c, err.message, HttpStatusCode.BAD_REQUEST);
    }
  }

  /**
   * POST /api/packages/assign
   * Müşteriye Paket Tanımla / Satış Yap (SUPER_ADMIN, ADMIN)
   */
  static async assignPackage(c: Context) {
    try {
      const studioId = c.get('studioId') || null;
      const actor = c.get('user');
      const body = await c.req.json();
      const meta = PackageController.getMeta(c);

      if (!studioId) {
        return errorResponse(c, 'Stüdyo bilgisi bulunamadı.', HttpStatusCode.BAD_REQUEST);
      }

      if (!actor?.id) {
        return errorResponse(c, 'Oturum bilgisi eksik.', HttpStatusCode.UNAUTHORIZED);
      }

      if (!body.userId || !body.packageId) {
        return errorResponse(c, 'Kullanıcı ve Paket seçimi zorunludur.', HttpStatusCode.BAD_REQUEST);
      }

      const assigned = await PackageService.assignPackageToClient(studioId, actor.id, body, meta);
      return successResponse(c, assigned, 'Paket müşteriye başarıyla tanımlandı.', HttpStatusCode.CREATED);
    } catch (err: any) {
      return errorResponse(c, err.message, HttpStatusCode.BAD_REQUEST);
    }
  }

  /**
   * GET /api/packages/client/:userId
   * Müşterinin Paketlerini Listele
   */
  static async getClientPackages(c: Context) {
    try {
      const studioId = c.get('studioId') || null;
      const user = c.get('user');
      const targetUserId = c.req.param('userId') || user.id;

      const packages = await PackageService.getClientPackages(targetUserId, studioId);
      return successResponse(c, packages, 'Müşteri paketleri listelendi.', HttpStatusCode.OK);
    } catch (err: any) {
      return errorResponse(c, err.message, HttpStatusCode.BAD_REQUEST);
    }
  }

  /**
   * PATCH /api/packages/client-package/:id/adjust-credits
   * Manuel Kredi Düzenleme (SUPER_ADMIN, ADMIN)
   */
  static async adjustCredits(c: Context) {
    try {
      const studioId = c.get('studioId') || null;
      const actor = c.get('user');
      const clientPackageId = c.req.param('id');
      const { creditDelta, reason } = await c.req.json();
      const meta = PackageController.getMeta(c);

      if (!actor?.id || !clientPackageId || creditDelta === undefined) {
        return errorResponse(c, 'Eksik parametre gönderildi.', HttpStatusCode.BAD_REQUEST);
      }

      const updated = await PackageService.adjustCredits(
        studioId,
        actor.id,
        clientPackageId,
        creditDelta,
        reason,
        meta
      );

      return successResponse(c, updated, 'Müşteri paket kredisi güncellendi.', HttpStatusCode.OK);
    } catch (err: any) {
      return errorResponse(c, err.message, HttpStatusCode.BAD_REQUEST);
    }
  }

  /**
   * PATCH /api/packages/client-package/:id/cancel
   * Müşteri Paketini İptal Et (SUPER_ADMIN, ADMIN)
   */
  static async cancelClientPackage(c: Context) {
    try {
      const studioId = c.get('studioId') || null;
      const actor = c.get('user');
      const clientPackageId = c.req.param('id');
      const { reason } = await c.req.json();
      const meta = PackageController.getMeta(c);

      if (!actor?.id || !clientPackageId) {
        return errorResponse(c, 'Eksik parametre gönderildi.', HttpStatusCode.BAD_REQUEST);
      }

      const updated = await PackageService.cancelClientPackage(
        studioId,
        actor.id,
        clientPackageId,
        reason,
        meta
      );

      return successResponse(c, updated, 'Müşteri paketi iptal edildi.', HttpStatusCode.OK);
    } catch (err: any) {
      return errorResponse(c, err.message, HttpStatusCode.BAD_REQUEST);
    }
  }
}