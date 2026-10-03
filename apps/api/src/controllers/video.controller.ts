import type { Context } from 'hono';
import type { AppEnv } from '../types/env';

import { VideoService } from '../services/video.service';
import { successResponse, errorResponse } from '../utils/response';
import type { Discipline } from '@prisma/client';
import HttpStatusCode from '../types/httpstatuscode';
import type { StorageFolder } from '../services/storage.service';

export class VideoController {
  private static getMeta(c: Context<AppEnv>) {
    return {
      ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '127.0.0.1',
      userAgent: c.req.header('user-agent'),
    };
  }

  /**
   * POST /api/videos/upload-url
   * Cloudflare R2 Presigned Upload URL Alır
   */
  static async getUploadUrl(c: Context<AppEnv>): Promise<Response> {
    try {
      const actor = c.get('user');
      // Subdomain header'ından veya kullanıcının oturum verisinden studioId alınır
      const studioId = (c.get('studioId') as string | undefined) || actor?.studioId;

      if (!studioId) {
        return errorResponse(c, 'Stüdyo bilgisi bulunamadı.', HttpStatusCode.BAD_REQUEST);
      }

      const body = await c.req.json<{
        fileName?: string;
        contentType?: string;
        folder?: StorageFolder;
      }>();

      const { fileName, contentType, folder } = body;

      if (!fileName || !contentType) {
        return errorResponse(c, 'Dosya adı ve içerik tipi (contentType) zorunludur.', HttpStatusCode.BAD_REQUEST);
      }

      const result = await VideoService.getUploadUrl(
        studioId,
        fileName,
        contentType,
        (folder as StorageFolder) || 'videos'
      );

      return successResponse(c, result, 'Upload URL oluşturuldu.', HttpStatusCode.OK);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload URL alınamadı.';
      return errorResponse(c, message, HttpStatusCode.BAD_REQUEST);
    }
  }

  /**
   * POST /api/videos
   */
  static async createVideo(c: Context<AppEnv>): Promise<Response> {
    try {
      const actor = c.get('user');
      const studioId = (c.get('studioId') as string | undefined) || actor?.studioId;
      const body = await c.req.json();
      const meta = VideoController.getMeta(c);

      if (!studioId || !actor?.id) {
        return errorResponse(c, 'Stüdyo veya oturum bilgisi eksik.', HttpStatusCode.UNAUTHORIZED);
      }

      if (!body.title || !body.videoUrl) {
        return errorResponse(c, 'Başlık ve Video URL zorunludur.', HttpStatusCode.BAD_REQUEST);
      }

      const video = await VideoService.createVideo(studioId, actor.id, body, meta);
      return successResponse(c, video, 'Video kütüphaneye eklendi.', HttpStatusCode.CREATED);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Video oluşturulamadı.';
      return errorResponse(c, message, HttpStatusCode.BAD_REQUEST);
    }
  }

  /**
   * PUT /api/videos/:id
   */
  static async updateVideo(c: Context<AppEnv>): Promise<Response> {
    try {
      const actor = c.get('user');
      const studioId = (c.get('studioId') as string | undefined) || actor?.studioId || null;
      const id = c.req.param('id');
      const body = await c.req.json();
      const meta = VideoController.getMeta(c);

      if (!actor?.id || !id) {
        return errorResponse(c, 'Oturum veya video ID bilgisi eksik.', HttpStatusCode.BAD_REQUEST);
      }

      const video = await VideoService.updateVideo(studioId, actor.id, id, body, meta);
      return successResponse(c, video, 'Video başarıyla güncellendi.', HttpStatusCode.OK);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Video güncellenemedi.';
      return errorResponse(c, message, HttpStatusCode.BAD_REQUEST);
    }
  }

  /**
   * GET /api/videos
   */
  static async listVideos(c: Context<AppEnv>): Promise<Response> {
    try {
      const actor = c.get('user');
      const studioId = (c.get('studioId') as string | undefined) || actor?.studioId || null;
      const discipline = c.req.query('discipline') as Discipline | undefined;

      const videos = await VideoService.listVideos(actor.role, studioId, discipline);
      return successResponse(c, videos, 'Videolar listelendi.', HttpStatusCode.OK);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Videolar listelenemedi.';
      return errorResponse(c, message, HttpStatusCode.BAD_REQUEST);
    }
  }

  /**
   * DELETE /api/videos/:id
   */
  static async deleteVideo(c: Context<AppEnv>): Promise<Response> {
    try {
      const actor = c.get('user');
      const studioId = (c.get('studioId') as string | undefined) || actor?.studioId || null;
      const id = c.req.param('id');
      const meta = VideoController.getMeta(c);

      if (!actor?.id || !id) {
        return errorResponse(c, 'Oturum veya video ID bilgisi eksik.', HttpStatusCode.BAD_REQUEST);
      }

      const result = await VideoService.deleteVideo(studioId, actor.id, id, meta);
      return successResponse(c, result, 'Video silindi.', HttpStatusCode.OK);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Video silinemedi.';
      return errorResponse(c, message, HttpStatusCode.BAD_REQUEST);
    }
  }

  static async getVideoById(c: Context<AppEnv>): Promise<Response> {
  try {
    const actor = c.get('user');
    const studioId = (c.get('studioId') as string | undefined) || actor?.studioId || null;
    const id = c.req.param('id');

    if (!id) {
      return errorResponse(c, 'Video ID bilgisi eksik.', HttpStatusCode.BAD_REQUEST);
    }

    const video = await VideoService.getVideoById(studioId, id);
    return successResponse(c, video, 'Video detayı getirildi.', HttpStatusCode.OK);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Video detayı alınamadı.';
    return errorResponse(c, message, HttpStatusCode.NOT_FOUND);
  }
}
}