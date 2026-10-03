import type { Context } from 'hono';
import { ClassService } from '../services/class.service';
import { successResponse, errorResponse } from '../utils/response';
import type { Discipline, ClassStatus } from '@prisma/client';
import HttpStatusCode from '../types/httpstatuscode';

export class ClassController {
  private static getMeta(c: Context) {
    return {
      ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '127.0.0.1',
      userAgent: c.req.header('user-agent'),
    };
  }

  // ==========================================
  // DERS ŞABLONLARI (Templates)
  // ==========================================

  /**
   * GET /api/classes/templates
   */
  static async listTemplates(c: Context) {
    try {
      const actor = c.get('user');
      const studioId = c.get('studioId') || null;
      const includeInactive = c.req.query('includeInactive') === 'true';

      const templates = await ClassService.listTemplates(actor.role, studioId, includeInactive);
      return successResponse(c, templates, 'Ders şablonları listelendi.', HttpStatusCode.OK);
    } catch (err: any) {
      return errorResponse(c, err.message, HttpStatusCode.BAD_REQUEST);
    }
  }

  /**
   * POST /api/classes/templates
   */
  static async createTemplate(c: Context) {
    try {
      const studioId = c.get('studioId') || null;
      const actor = c.get('user');
      const body = await c.req.json();
      const meta = ClassController.getMeta(c);

      if (!studioId) {
        return errorResponse(c, 'Stüdyo bilgisi bulunamadı.', HttpStatusCode.BAD_REQUEST);
      }

      if (!actor?.id) {
        return errorResponse(c, 'Oturum bilgisi eksik.', HttpStatusCode.UNAUTHORIZED);
      }

      if (!body.title) {
        return errorResponse(c, 'Ders şablon adı zorunludur.', HttpStatusCode.BAD_REQUEST);
      }

      const template = await ClassService.createTemplate(studioId, actor.id, body, meta);
      return successResponse(c, template, 'Ders şablonu oluşturuldu.', HttpStatusCode.CREATED);
    } catch (err: any) {
      return errorResponse(c, err.message, HttpStatusCode.BAD_REQUEST);
    }
  }

  /**
   * PUT /api/classes/templates/:id
   */
  static async updateTemplate(c: Context) {
    try {
      const studioId = c.get('studioId') || null;
      const actor = c.get('user');
      const templateId = c.req.param('id');
      const body = await c.req.json();
      const meta = ClassController.getMeta(c);

      if (!actor?.id || !templateId) {
        return errorResponse(c, 'Gerekli parametreler eksik.', HttpStatusCode.BAD_REQUEST);
      }

      const updated = await ClassService.updateTemplate(studioId, actor.id, templateId, body, meta);
      return successResponse(c, updated, 'Ders şablonu güncellendi.', HttpStatusCode.OK);
    } catch (err: any) {
      return errorResponse(c, err.message, HttpStatusCode.BAD_REQUEST);
    }
  }

  // ==========================================
  // CANLI SEANSLAR & TAKVİM (Sessions & Calendar)
  // ==========================================

  /**
   * GET /api/classes/calendar
   */
  static async getCalendar(c: Context) {
    try {
      const actor = c.get('user');
      const studioId = c.get('studioId') || null;

      const startDateStr = c.req.query('startDate');
      const endDateStr = c.req.query('endDate');
      const instructorId = c.req.query('instructorId');
      const discipline = c.req.query('discipline') as Discipline | undefined;
      const status = c.req.query('status') as ClassStatus | undefined;

      if (!startDateStr || !endDateStr) {
        return errorResponse(c, 'Başlangıç ve bitiş tarihleri (startDate, endDate) zorunludur.', HttpStatusCode.BAD_REQUEST);
      }

      const options = {
        startDate: new Date(startDateStr),
        endDate: new Date(endDateStr),
        instructorId,
        discipline,
        status,
      };

      const calendar = await ClassService.getCalendar(actor.role, studioId, options);
      return successResponse(c, calendar, 'Ders takvimi getirildi.', HttpStatusCode.OK);
    } catch (err: any) {
      return errorResponse(c, err.message, HttpStatusCode.BAD_REQUEST);
    }
  }

  /**
   * GET /api/classes/sessions/:id
   */
  static async getSessionById(c: Context) {
    try {
      const studioId = c.get('studioId') || null;
      const sessionId = c.req.param('id');

      if (!sessionId) {
        return errorResponse(c, 'Ders seans ID\'si gereklidir.', HttpStatusCode.BAD_REQUEST);
      }

      const session = await ClassService.getSessionById(sessionId, studioId);
      return successResponse(c, session, 'Ders seansı detayları getirildi.', HttpStatusCode.OK);
    } catch (err: any) {
      return errorResponse(c, err.message, HttpStatusCode.NOT_FOUND);
    }
  }

  /**
   * POST /api/classes/sessions
   */
  static async createSession(c: Context) {
    try {
      const studioId = c.get('studioId') || null;
      const actor = c.get('user');
      const body = await c.req.json();
      const meta = ClassController.getMeta(c);

      if (!studioId) {
        return errorResponse(c, 'Stüdyo bilgisi bulunamadı.', HttpStatusCode.BAD_REQUEST);
      }

      if (!actor?.id) {
        return errorResponse(c, 'Oturum bilgisi eksik.', HttpStatusCode.UNAUTHORIZED);
      }

      if (!body.title || !body.instructorId || !body.startTime || !body.capacity) {
        return errorResponse(c, 'Başlık, Eğitmen, Başlangıç Tarihi ve Kapasite alanları zorunludur.', HttpStatusCode.BAD_REQUEST);
      }

      const sessionData = {
        ...body,
        startTime: new Date(body.startTime),
        endTime: body.endTime ? new Date(body.endTime) : undefined,
      };

      const session = await ClassService.createSession(studioId, actor.id, sessionData, meta);
      return successResponse(c, session, 'Ders seansı takvime eklendi.', HttpStatusCode.CREATED);
    } catch (err: any) {
      return errorResponse(c, err.message, HttpStatusCode.BAD_REQUEST);
    }
  }

  /**
   * PUT /api/classes/sessions/:id
   */
  static async updateSession(c: Context) {
    try {
      const studioId = c.get('studioId') || null;
      const actor = c.get('user');
      const sessionId = c.req.param('id');
      const body = await c.req.json();
      const meta = ClassController.getMeta(c);

      if (!actor?.id || !sessionId) {
        return errorResponse(c, 'Gerekli parametreler eksik.', HttpStatusCode.BAD_REQUEST);
      }

      const sessionData = {
        ...body,
        startTime: body.startTime ? new Date(body.startTime) : undefined,
        endTime: body.endTime ? new Date(body.endTime) : undefined,
      };

      const updated = await ClassService.updateSession(studioId, actor.id, sessionId, sessionData, meta);
      return successResponse(c, updated, 'Ders seansı güncellendi.', HttpStatusCode.OK);
    } catch (err: any) {
      return errorResponse(c, err.message, HttpStatusCode.BAD_REQUEST);
    }
  }

  /**
   * PATCH /api/classes/sessions/:id/cancel
   */
  static async cancelSession(c: Context) {
    try {
      const studioId = c.get('studioId') || null;
      const actor = c.get('user');
      const sessionId = c.req.param('id');
      const { reason } = await c.req.json().catch(() => ({ reason: undefined }));
      const meta = ClassController.getMeta(c);

      if (!actor?.id || !sessionId) {
        return errorResponse(c, 'Gerekli parametreler eksik.', HttpStatusCode.BAD_REQUEST);
      }

      const result = await ClassService.cancelSession(studioId, actor.id, sessionId, reason, meta);
      return successResponse(c, result, 'Ders seansı iptal edildi.', HttpStatusCode.OK);
    } catch (err: any) {
      return errorResponse(c, err.message, HttpStatusCode.BAD_REQUEST);
    }
  }
}