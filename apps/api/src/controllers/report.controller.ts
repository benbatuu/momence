import type { Context } from 'hono';
import { ReportService } from '../services/report.service';
import { successResponse, errorResponse } from '../utils/response';
import HttpStatusCode from '../types/httpstatuscode';
import type { AppEnv } from '../types/env';

export class ReportController {
  /**
   * GET /api/reports/financial
   */
  static async getFinancialReport(c: Context) {
    try {
      const actor = c.get('user');
      const studioId = c.get('studioId') || null;

      const startDateStr = c.req.query('startDate');
      const endDateStr = c.req.query('endDate');

      if (!startDateStr || !endDateStr) {
        return errorResponse(
          c,
          'Başlangıç ve Bitiş tarihleri (startDate, endDate) zorunludur.',
          HttpStatusCode.BAD_REQUEST
        );
      }

      const options = {
        startDate: new Date(startDateStr),
        endDate: new Date(endDateStr),
      };

      const report = await ReportService.getFinancialReport(actor.role, studioId, options);
      return successResponse(c, report, 'Finansal rapor başarıyla oluşturuldu.', HttpStatusCode.OK);
    } catch (err: any) {
      return errorResponse(c, err.message, HttpStatusCode.BAD_REQUEST);
    }
  }

  /**
   * GET /api/reports/overview
   */
  static async getOverviewReport(c: Context<AppEnv>): Promise<Response> {
    try {
      const actor = c.get('user');
      const studioId = (c.get('studioId') as string | undefined) || actor?.studioId || null;

      const startDateStr = c.req.query('startDate');
      const endDateStr = c.req.query('endDate');

      // Varsayılan tarih aralığı: Son 30 Gün
      const endDate = endDateStr ? new Date(endDateStr) : new Date();
      const startDate = startDateStr
        ? new Date(startDateStr)
        : new Date(endDate.valueOf() - 30 * 24 * 60 * 60 * 1000);

      const report = await ReportService.getOverviewReport(actor.role, studioId, {
        startDate,
        endDate,
      });

      return successResponse(c, report, 'Genel stüdyo raporu getirildi.', HttpStatusCode.OK);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Raporlar alınamadı.';
      return errorResponse(c, message, HttpStatusCode.BAD_REQUEST);
    }
  }
}