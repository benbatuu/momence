import type { Context } from 'hono';
import type { AppEnv } from '../types/env';
import { FinancialService } from '../services/financials.service';
import { successResponse, errorResponse } from '../utils/response';
import HttpStatusCode from '../types/httpstatuscode';

export class FinancialController {
  /**
   * GET /api/financials/revenue-stats
   * Stüdyo Ciro & Gelir Analitiği
   */
  static async getRevenueStats(c: Context<AppEnv>): Promise<Response> {
    try {
      const actor = c.get('user');
      const studioId = (c.get('studioId') as string | undefined) || actor?.studioId || null;

      const startDate = c.req.query('startDate');
      const endDate = c.req.query('endDate');

      const stats = await FinancialService.getRevenueStats(actor.role, studioId, {
        startDate,
        endDate,
      });

      return successResponse(c, stats, 'Finansal analitik verileri getirildi.', HttpStatusCode.OK);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Finansal veriler alınamadı.';
      return errorResponse(c, message, HttpStatusCode.BAD_REQUEST);
    }
  }

  static async getPaymentById(c: Context<AppEnv>): Promise<Response> {
    try {
      const actor = c.get('user');
      const studioId = (c.get('studioId') as string | undefined) || actor?.studioId || null;
      const paymentId = c.req.param('id');

      if (!paymentId) {
        return errorResponse(c, 'Ödeme ID bilgisi eksik.', HttpStatusCode.BAD_REQUEST);
      }

      const payment = await FinancialService.getPaymentById(actor.role, studioId, paymentId);
      return successResponse(c, payment, 'Ödeme detayları getirildi.', HttpStatusCode.OK);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ödeme detayları alınamadı.';
      return errorResponse(c, message, HttpStatusCode.NOT_FOUND);
    }
  }
}