import type { Context } from 'hono';
import type { AppEnv } from '../types/env';
import { PayoutService } from '../services/payouts.service';
import { successResponse, errorResponse } from '../utils/response';
import HttpStatusCode from '../types/httpstatuscode';

export class PayoutController {
  private static getMeta(c: Context<AppEnv>) {
    return {
      ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '127.0.0.1',
      userAgent: c.req.header('user-agent'),
    };
  }

  /**
   * GET /api/payouts/summary
   * Eğitmen Finansal Özet Metrikleri (Toplu Ödenen, Bekleyen, Eğitmen Bazlı)
   */
  static async getSummary(c: Context<AppEnv>): Promise<Response> {
    try {
      const actor = c.get('user');
      const studioId = (c.get('studioId') as string | undefined) || actor?.studioId || null;
      const instructorId = c.req.query('instructorId');

      // Eğer giriş yapan rol INSTRUCTOR ise sadece kendi özetini görebilir
      const targetInstructorId = actor.role === 'INSTRUCTOR' ? actor.id : instructorId;

      const summary = await PayoutService.getInstructorFinancialSummary(
        actor.role,
        studioId,
        targetInstructorId
      );

      return successResponse(c, summary, 'Eğitmen finansal özeti getirildi.', HttpStatusCode.OK);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Özet verileri alınamadı.';
      return errorResponse(c, message, HttpStatusCode.BAD_REQUEST);
    }
  }

  /**
   * GET /api/payouts
   * Hakediş Kayıtlarını Listele
   */
  static async listPayouts(c: Context<AppEnv>): Promise<Response> {
    try {
      const actor = c.get('user');
      const studioId = (c.get('studioId') as string | undefined) || actor?.studioId || null;
      const instructorId = c.req.query('instructorId');
      const isPaidParam = c.req.query('isPaid');

      const isPaid = isPaidParam !== undefined ? isPaidParam === 'true' : undefined;

      // Eğer INSTRUCTOR rolünde ise sadece kendi kayıtlarını görebilir
      const targetInstructorId = actor.role === 'INSTRUCTOR' ? actor.id : instructorId;

      const payouts = await PayoutService.listPayouts(actor.role, studioId, {
        instructorId: targetInstructorId,
        isPaid,
      });

      return successResponse(c, payouts, 'Eğitmen hakedişleri listelendi.', HttpStatusCode.OK);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Hakedişler listelenemedi.';
      return errorResponse(c, message, HttpStatusCode.BAD_REQUEST);
    }
  }

  /**
   * POST /api/payouts
   * Yeni Hakediş Tanımla
   */
  static async createPayout(c: Context<AppEnv>): Promise<Response> {
    try {
      const actor = c.get('user');
      const studioId = (c.get('studioId') as string | undefined) || actor?.studioId;
      const body = await c.req.json();
      const meta = PayoutController.getMeta(c);

      if (!studioId) {
        return errorResponse(c, 'Stüdyo bilgisi bulunamadı.', HttpStatusCode.BAD_REQUEST);
      }

      if (!actor?.id) {
        return errorResponse(c, 'Oturum bilgisi eksik.', HttpStatusCode.UNAUTHORIZED);
      }

      if (!body.instructorId || body.amount === undefined) {
        return errorResponse(c, 'Eğitmen ID ve Tutar zorunludur.', HttpStatusCode.BAD_REQUEST);
      }

      const payout = await PayoutService.createPayout(studioId, actor.id, body, meta);
      return successResponse(c, payout, 'Hakediş kaydı oluşturuldu.', HttpStatusCode.CREATED);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Hakediş oluşturulamadı.';
      return errorResponse(c, message, HttpStatusCode.BAD_REQUEST);
    }
  }

  /**
   * PATCH /api/payouts/:id/pay
   * Hakediş Ödemesini Tamamla
   */
  static async markAsPaid(c: Context<AppEnv>): Promise<Response> {
    try {
      const actor = c.get('user');
      const studioId = (c.get('studioId') as string | undefined) || actor?.studioId || null;
      const payoutId = c.req.param('id');
      const meta = PayoutController.getMeta(c);

      if (!actor?.id || !payoutId) {
        return errorResponse(c, 'Gerekli parametreler eksik.', HttpStatusCode.BAD_REQUEST);
      }

      const result = await PayoutService.markAsPaid(studioId, actor.id, payoutId, meta);
      return successResponse(c, result, 'Hakediş ödemesi yapıldı olarak işaretlendi.', HttpStatusCode.OK);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'İşlem tamamlanamadı.';
      return errorResponse(c, message, HttpStatusCode.BAD_REQUEST);
    }
  }

  /**
   * DELETE /api/payouts/:id
   * Hakediş Kaydını Sil
   */
  static async deletePayout(c: Context<AppEnv>): Promise<Response> {
    try {
      const actor = c.get('user');
      const studioId = (c.get('studioId') as string | undefined) || actor?.studioId || null;
      const payoutId = c.req.param('id');
      const meta = PayoutController.getMeta(c);

      if (!actor?.id || !payoutId) {
        return errorResponse(c, 'Gerekli parametreler eksik.', HttpStatusCode.BAD_REQUEST);
      }

      const result = await PayoutService.deletePayout(studioId, actor.id, payoutId, meta);
      return successResponse(c, result, 'Hakediş kaydı silindi.', HttpStatusCode.OK);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Hakediş kaydı silinemedi.';
      return errorResponse(c, message, HttpStatusCode.BAD_REQUEST);
    }
  }
}