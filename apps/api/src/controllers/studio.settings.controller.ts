import type { Context } from 'hono';
import type { AppEnv } from '../types/env';
import { successResponse, errorResponse } from '../utils/response';
import HttpStatusCode from '../types/httpstatuscode';
import { StudioSettingsService } from '../services/studio-settings.service';

export class StudioSettingsController {
  /**
   * GET /api/studio/settings
   */
  static async getSettings(c: Context<AppEnv>): Promise<Response> {
    try {
      const actor = c.get('user');
      const studioId = (c.get('studioId') as string | undefined) || actor?.studioId || null;
      const subdomain = c.req.header('x-studio-subdomain') || null;

      const settings = await StudioSettingsService.getStudioSettings(actor.role, studioId, subdomain);
      return successResponse(c, settings, 'Stüdyo ayarları başarıyla getirildi.', HttpStatusCode.OK);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Stüdyo ayarları alınamadı.';
      return errorResponse(c, message, HttpStatusCode.BAD_REQUEST);
    }
  }

  /**
   * PUT /api/studio/settings
   */
  static async updateSettings(c: Context<AppEnv>): Promise<Response> {
    try {
      const actor = c.get('user');
      const studioId = (c.get('studioId') as string | undefined) || actor?.studioId;
      const body = await c.req.json();

      if (!studioId || !actor?.id) {
        return errorResponse(c, 'Stüdyo veya oturum bilgisi bulunamadı.', HttpStatusCode.UNAUTHORIZED);
      }

      const updatedSettings = await StudioSettingsService.updateStudioSettings(studioId, body);
      return successResponse(c, updatedSettings, 'Stüdyo ayarları başarıyla güncellendi.', HttpStatusCode.OK);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Stüdyo ayarları güncellenemedi.';
      return errorResponse(c, message, HttpStatusCode.BAD_REQUEST);
    }
  }
}