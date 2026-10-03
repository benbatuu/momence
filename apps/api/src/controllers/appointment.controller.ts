import type { Context } from 'hono';
import { AppointmentService } from '../services/appointment.service';
import { successResponse, errorResponse } from '../utils/response';
import type { Discipline, AppointmentStatus } from '@prisma/client';
import HttpStatusCode from '../types/httpstatuscode';

export class AppointmentController {
  private static getMeta(c: Context) {
    return {
      ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '127.0.0.1',
      userAgent: c.req.header('user-agent'),
    };
  }

  /**
   * GET /api/appointments
   */
  static async listAppointments(c: Context) {
    try {
      const actor = c.get('user');
      const studioId = c.get('studioId') || null;

      const startDateStr = c.req.query('startDate');
      const endDateStr = c.req.query('endDate');
      const instructorId = c.req.query('instructorId');
      const clientId = c.req.query('clientId');
      const status = c.req.query('status') as AppointmentStatus | undefined;

      const options = {
        startDate: startDateStr ? new Date(startDateStr) : undefined,
        endDate: endDateStr ? new Date(endDateStr) : undefined,
        instructorId,
        clientId,
        status,
      };

      const appointments = await AppointmentService.listAppointments(actor.role, studioId, options);
      return successResponse(c, appointments, 'Randevular listelendi.', HttpStatusCode.OK);
    } catch (err: any) {
      return errorResponse(c, err.message, HttpStatusCode.BAD_REQUEST);
    }
  }

  /**
   * GET /api/appointments/:id
   */
  static async getById(c: Context) {
    try {
      const studioId = c.get('studioId') || null;
      const id = c.req.param('id');
      if (!id) {
        return errorResponse(c, 'Randevu ID eksik.', HttpStatusCode.BAD_REQUEST);
      }

      const appointment = await AppointmentService.getById(id, studioId);
      return successResponse(c, appointment, 'Randevu detayları getirildi.', HttpStatusCode.OK);
    } catch (err: any) {
      return errorResponse(c, err.message, HttpStatusCode.NOT_FOUND);
    }
  }

  /**
   * POST /api/appointments
   */
  static async createAppointment(c: Context) {
    try {
      const studioId = c.get('studioId') || null;
      const actor = c.get('user');
      const body = await c.req.json();
      const meta = AppointmentController.getMeta(c);

      if (!studioId) {
        return errorResponse(c, 'Stüdyo bilgisi bulunamadı.', HttpStatusCode.BAD_REQUEST);
      }

      if (!actor?.id) {
        return errorResponse(c, 'Oturum bilgisi eksik.', HttpStatusCode.UNAUTHORIZED);
      }

      if (!body.clientId || !body.instructorId || !body.title || !body.startTime || !body.endTime) {
        return errorResponse(c, 'Müşteri, Eğitmen, Başlık ve Tarih alanları zorunludur.', HttpStatusCode.BAD_REQUEST);
      }

      const input = {
        ...body,
        startTime: new Date(body.startTime),
        endTime: new Date(body.endTime),
      };

      const appointment = await AppointmentService.createAppointment(studioId, actor.id, input, meta);
      return successResponse(c, appointment, 'Randevu başarıyla oluşturuldu.', HttpStatusCode.CREATED);
    } catch (err: any) {
      return errorResponse(c, err.message, HttpStatusCode.BAD_REQUEST);
    }
  }

  /**
   * PUT /api/appointments/:id
   */
  static async updateAppointment(c: Context) {
    try {
      const studioId = c.get('studioId') || null;
      const actor = c.get('user');
      const id = c.req.param('id');
      const body = await c.req.json();
      const meta = AppointmentController.getMeta(c);

      if (!actor?.id || !id) {
        return errorResponse(c, 'Gerekli parametreler eksik.', HttpStatusCode.BAD_REQUEST);
      }

      const input = {
        ...body,
        startTime: body.startTime ? new Date(body.startTime) : undefined,
        endTime: body.endTime ? new Date(body.endTime) : undefined,
      };

      const result = await AppointmentService.updateAppointment(studioId, actor.id, id, input, meta);
      return successResponse(c, result, 'Randevu güncellendi.', HttpStatusCode.OK);
    } catch (err: any) {
      return errorResponse(c, err.message, HttpStatusCode.BAD_REQUEST);
    }
  }
}