import type { Context } from 'hono';
import { StudioService } from '../services/studio.service';
import { successResponse, errorResponse } from '../utils/response';
import HttpStatusCode from '../types/httpstatuscode';

export class StudioController {
  private static getMeta(c: Context) {
    return {
      ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '127.0.0.1',
      userAgent: c.req.header('user-agent'),
    };
  }

  /**
   * GET /api/super-admin/studios
   */
  static async listStudios(c: Context) {
    try {
      const search = c.req.query('search');
      const isActiveParam = c.req.query('isActive');
      const isActive = isActiveParam !== undefined ? isActiveParam === 'true' : undefined;

      const studios = await StudioService.listStudios(search, isActive);
      return successResponse(c, studios, 'Stüdyolar listelendi.', HttpStatusCode.OK);
    } catch (err: any) {
      return errorResponse(c, err.message, HttpStatusCode.BAD_REQUEST);
    }
  }

  /**
   * GET /api/super-admin/studios/metrics
   */
  static async getMetrics(c: Context) {
    try {
      const metrics = await StudioService.getPlatformMetrics();
      return successResponse(c, metrics, 'Platform metrikleri getirildi.', HttpStatusCode.OK);
    } catch (err: any) {
      return errorResponse(c, err.message, HttpStatusCode.BAD_REQUEST);
    }
  }

  /**
   * GET /api/super-admin/studios/:id
   */
  static async getStudioById(c: Context) {
    try {
      const id = c.req.param('id');
      if (!id) return errorResponse(c, 'Stüdyo ID belirtilmelidir.', HttpStatusCode.BAD_REQUEST);
      const studio = await StudioService.getStudioById(id);
      return successResponse(c, studio, 'Stüdyo detayları getirildi.', HttpStatusCode.OK);
    } catch (err: any) {
      return errorResponse(c, err.message, HttpStatusCode.NOT_FOUND);
    }
  }

  /**
   * POST /api/super-admin/studios
   */
  static async createStudio(c: Context) {
    try {
      const actor = c.get('user');
      const body = await c.req.json();
      const meta = StudioController.getMeta(c);

      if (!body.name || !body.subdomain || !body.adminName || !body.adminEmail) {
        return errorResponse(c, 'Stüdyo Adı, Subdomain, Admin Adı ve Admin E-posta alanları zorunludur.', HttpStatusCode.BAD_REQUEST);
      }

      const result = await StudioService.createStudio(actor.id, body, meta);
      return successResponse(c, result, 'Stüdyo ve Admin hesabı başarıyla oluşturuldu.', HttpStatusCode.CREATED);
    } catch (err: any) {
      return errorResponse(c, err.message, HttpStatusCode.BAD_REQUEST);
    }
  }

  /**
   * PUT /api/super-admin/studios/:id
   */
  static async updateStudio(c: Context) {
    try {
      const actor = c.get('user');
      const id = c.req.param('id');
      const body = await c.req.json();
      const meta = StudioController.getMeta(c);

      if (!id) {
        return errorResponse(c, 'Stüdyo ID belirtilmelidir.', HttpStatusCode.BAD_REQUEST);
      }

      const updated = await StudioService.updateStudio(actor.id, id, body, meta);
      return successResponse(c, updated, 'Stüdyo bilgileri güncellendi.', HttpStatusCode.OK);
    } catch (err: any) {
      return errorResponse(c, err.message, HttpStatusCode.BAD_REQUEST);
    }
  }

  /**
   * PATCH /api/super-admin/studios/:id/status
   */
  static async toggleStatus(c: Context) {
    try {
      const actor = c.get('user');
      const id = c.req.param('id');
      const { isActive } = await c.req.json();
      const meta = StudioController.getMeta(c);

      if (typeof isActive !== 'boolean') {
        return errorResponse(c, 'isActive değeri boolean olmalıdır.', HttpStatusCode.BAD_REQUEST);
      }

      if (!id) {
        return errorResponse(c, 'Kendi stüdyo durumunuzu değiştiremezsiniz.', HttpStatusCode.BAD_REQUEST);
      }

      const updated = await StudioService.toggleStudioStatus(actor.id, id, isActive, meta);
      return successResponse(c, updated, `Stüdyo durumu ${isActive ? 'aktif' : 'pasif'} yapıldı.`, HttpStatusCode.OK);
    } catch (err: any) {
      return errorResponse(c, err.message, HttpStatusCode.BAD_REQUEST);
    }
  }
}