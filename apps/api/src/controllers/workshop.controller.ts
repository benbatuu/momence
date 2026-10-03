import type { Context } from 'hono';
import { WorkshopService } from '../services/workshop.service';
import { successResponse, errorResponse } from '../utils/response';
import HttpStatusCode from '../types/httpstatuscode';

export class WorkshopController {
  private static getMeta(c: Context) {
    return {
      ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '127.0.0.1',
      userAgent: c.req.header('user-agent'),
    };
  }

  /**
   * GET /api/workshops
   */
  static async listWorkshops(c: Context) {
    try {
      const actor = c.get('user');
      const studioId = c.get('studioId') || null;
      const includeInactive = c.req.query('includeInactive') === 'true';

      const workshops = await WorkshopService.listWorkshops(actor.role, studioId, includeInactive);
      return successResponse(c, workshops, 'Atölyeler listelendi.', HttpStatusCode.OK);
    } catch (err: any) {
      return errorResponse(c, err.message, HttpStatusCode.BAD_REQUEST);
    }
  }

  /**
   * GET /api/workshops/:id
   */
  static async getWorkshopById(c: Context) {
    try {
      const studioId = c.get('studioId') || null;
      const id = c.req.param('id');
      if (!id) return errorResponse(c, 'Atölye ID belirtilmelidir.', HttpStatusCode.BAD_REQUEST);
      const workshop = await WorkshopService.getWorkshopById(id, studioId);
      return successResponse(c, workshop, 'Atölye detayları getirildi.', HttpStatusCode.OK);
    } catch (err: any) {
      return errorResponse(c, err.message, HttpStatusCode.NOT_FOUND);
    }
  }

  /**
   * POST /api/workshops
   */
  static async createWorkshop(c: Context) {
    try {
      const studioId = c.get('studioId') || null;
      const actor = c.get('user');
      const body = await c.req.json();
      const meta = WorkshopController.getMeta(c);

      if (!studioId) {
        return errorResponse(c, 'Stüdyo bilgisi bulunamadı.', HttpStatusCode.BAD_REQUEST);
      }

      if (!actor?.id) {
        return errorResponse(c, 'Oturum bilgisi eksik.', HttpStatusCode.UNAUTHORIZED);
      }

      if (!body.title || !body.price || !body.capacity || !body.startTime || !body.endTime) {
        return errorResponse(c, 'Başlık, Fiyat, Kapasite ve Başlangıç/Bitiş saatleri zorunludur.', HttpStatusCode.BAD_REQUEST);
      }

      const input = {
        ...body,
        startTime: new Date(body.startTime),
        endTime: new Date(body.endTime),
      };

      const workshop = await WorkshopService.createWorkshop(studioId, actor.id, input, meta);
      return successResponse(c, workshop, 'Atölye başarıyla oluşturuldu.', HttpStatusCode.CREATED);
    } catch (err: any) {
      return errorResponse(c, err.message, HttpStatusCode.BAD_REQUEST);
    }
  }

  /**
   * PUT /api/workshops/:id
   */
  static async updateWorkshop(c: Context) {
    try {
      const studioId = c.get('studioId') || null;
      const actor = c.get('user');
      const id = c.req.param('id');
      const body = await c.req.json();
      const meta = WorkshopController.getMeta(c);

      if (!actor?.id || !id) {
        return errorResponse(c, 'Gerekli parametreler eksik.', HttpStatusCode.BAD_REQUEST);
      }

      const input = {
        ...body,
        startTime: body.startTime ? new Date(body.startTime) : undefined,
        endTime: body.endTime ? new Date(body.endTime) : undefined,
      };

      const updated = await WorkshopService.updateWorkshop(studioId, actor.id, id, input, meta);
      return successResponse(c, updated, 'Atölye güncellendi.', HttpStatusCode.OK);
    } catch (err: any) {
      return errorResponse(c, err.message, HttpStatusCode.BAD_REQUEST);
    }
  }

  /**
   * POST /api/workshops/:id/tickets
   */
  static async buyTicket(c: Context) {
    try {
      const studioId = c.get('studioId') || null;
      const actor = c.get('user');
      const workshopId = c.req.param('id');
      const body = await c.req.json();
      const meta = WorkshopController.getMeta(c);

      if (!studioId) {
        return errorResponse(c, 'Stüdyo bilgisi bulunamadı.', HttpStatusCode.BAD_REQUEST);
      }

      if (!actor?.id || !workshopId) {
        return errorResponse(c, 'Gerekli parametreler eksik.', HttpStatusCode.BAD_REQUEST);
      }

      const ticketInput = {
        userId: body.userId || actor.id,
        paymentMethod: body.paymentMethod,
      };

      const ticket = await WorkshopService.buyTicket(studioId, actor.id, workshopId, ticketInput, meta);
      return successResponse(c, ticket, 'Atölye bileti başarıyla alındı.', HttpStatusCode.CREATED);
    } catch (err: any) {
      return errorResponse(c, err.message, HttpStatusCode.BAD_REQUEST);
    }
  }
}