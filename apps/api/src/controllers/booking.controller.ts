import type { Context } from 'hono';
import { BookingService } from '../services/booking.service';
import { successResponse, errorResponse } from '../utils/response';
import HttpStatusCode from '../types/httpstatuscode';

export class BookingController {
  private static getMeta(c: Context) {
    return {
      ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '127.0.0.1',
      userAgent: c.req.header('user-agent'),
    };
  }

  /**
   * POST /api/bookings
   * Derse Rezervasyon Yap
   */
  static async createBooking(c: Context) {
    try {
      const studioId = c.get('studioId') || null;
      const actor = c.get('user');
      const body = await c.req.json();
      const meta = BookingController.getMeta(c);

      if (!studioId) {
        return errorResponse(c, 'Stüdyo bilgisi bulunamadı.', HttpStatusCode.BAD_REQUEST);
      }

      if (!actor?.id) {
        return errorResponse(c, 'Oturum bilgisi eksik.', HttpStatusCode.UNAUTHORIZED);
      }

      if (!body.sessionId) {
        return errorResponse(c, 'Ders seansı ID zorunludur.', HttpStatusCode.BAD_REQUEST);
      }

      const bookingData = {
        sessionId: body.sessionId,
        userId: body.userId || actor.id, // Admin başkası adına yapabilir, üye kendi adına yapar
        clientPackageId: body.clientPackageId,
      };

      const result = await BookingService.createBooking(studioId, actor.id, bookingData, meta);
      return successResponse(c, result, 'Ders kaydı başarıyla oluşturuldu.', HttpStatusCode.CREATED);
    } catch (err: any) {
      return errorResponse(c, err.message, HttpStatusCode.BAD_REQUEST);
    }
  }

  /**
   * PATCH /api/bookings/:id/cancel
   * Rezervasyonu İptal Et
   */
  static async cancelBooking(c: Context) {
    try {
      const studioId = c.get('studioId') || null;
      const actor = c.get('user');
      const bookingId = c.req.param('id');
      const meta = BookingController.getMeta(c);

      if (!actor?.id || !bookingId) {
        return errorResponse(c, 'Gerekli parametreler eksik.', HttpStatusCode.BAD_REQUEST);
      }

      const result = await BookingService.cancelBooking(actor.role, studioId, actor.id, bookingId, meta);
      return successResponse(c, result, result.message, HttpStatusCode.OK);
    } catch (err: any) {
      return errorResponse(c, err.message, HttpStatusCode.BAD_REQUEST);
    }
  }

  /**
   * POST /api/bookings/attendance
   * Dersteki Üye İçin Yoklama Gir (Eğitmen / Admin)
   */
  static async recordAttendance(c: Context) {
    try {
      const studioId = c.get('studioId') || null;
      const actor = c.get('user');
      const body = await c.req.json();
      const meta = BookingController.getMeta(c);

      if (!actor?.id) {
        return errorResponse(c, 'Oturum bilgisi eksik.', HttpStatusCode.UNAUTHORIZED);
      }

      if (!body.bookingId || !body.status) {
        return errorResponse(c, 'Rezervasyon ID ve Yoklama Durumu zorunludur.', HttpStatusCode.BAD_REQUEST);
      }

      const result = await BookingService.recordAttendance(studioId, actor.id, body, meta);
      return successResponse(c, result, 'Yoklama kaydı güncellendi.', HttpStatusCode.OK);
    } catch (err: any) {
      return errorResponse(c, err.message, HttpStatusCode.BAD_REQUEST);
    }
  }
}