import type { Context } from 'hono';
import { AuditLogService } from '../services/auditlog.service';
import { successResponse, errorResponse } from '../utils/response';
import type { AuditCategory } from '@prisma/client';
import HttpStatusCode from '../types/httpstatuscode';

export class AuditLogController {
  /**
   * GET /api/audit-logs
   */
  static async listLogs(c: Context) {
    try {
      const actor = c.get('user');
      const studioId = c.get('studioId') || null;

      const actorId = c.req.query('actorId');
      const category = c.req.query('category') as AuditCategory | undefined;
      const action = c.req.query('action');
      const startDateStr = c.req.query('startDate');
      const endDateStr = c.req.query('endDate');
      const page = Number(c.req.query('page')) || 1;
      const limit = Number(c.req.query('limit')) || 20;

      const options = {
        actorId,
        category,
        action,
        startDate: startDateStr ? new Date(startDateStr) : undefined,
        endDate: endDateStr ? new Date(endDateStr) : undefined,
        page,
        limit,
      };

      const result = await AuditLogService.listLogs(actor.role, studioId, options);
      return successResponse(c, result, 'Denetim günlükleri getirildi.', HttpStatusCode.OK);
    } catch (err: any) {
      return errorResponse(c, err.message, HttpStatusCode.BAD_REQUEST);
    }
  }

  /**
   * GET /api/audit-logs/:id
   */
  static async getLogById(c: Context) {
    try {
      const actor = c.get('user');
      const studioId = c.get('studioId') || null;
      const id = c.req.param('id');
      if (!id) return errorResponse(c, 'Denetim günlüğü kimliği sağlanmadı.', HttpStatusCode.BAD_REQUEST);

      const log = await AuditLogService.getLogById(actor.role, studioId, id);
      return successResponse(c, log, 'Denetim günlüğü detayı getirildi.', HttpStatusCode.OK);
    } catch (err: any) {
      return errorResponse(c, err.message, HttpStatusCode.NOT_FOUND);
    }
  }
}