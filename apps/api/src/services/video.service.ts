import { prisma } from '../utils/prisma';
import { LoggerService } from '../utils/logger';
import { Sanitizer } from '../utils/sanitizer';

import { Discipline, Role } from '@prisma/client';
import { StorageService, type StorageFolder } from './storage.service';

export interface CreateVideoInput {
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  durationSec?: number;
  discipline?: Discipline;
  isRequiredPackage?: boolean;
}

export interface UpdateVideoInput {
  title?: string;
  description?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  durationSec?: number;
  discipline?: Discipline;
  isRequiredPackage?: boolean;
  isActive?: boolean;
}

export interface Meta {
  ip?: string;
  userAgent?: string;
}

export class VideoService {
  /**
   * Presigned Upload URL Al
   */
  static async getUploadUrl(
    studioId: string,
    fileName: string,
    contentType: string,
    folder: StorageFolder = 'videos'
  ) {
    if (!studioId) throw new Error('Stüdyo kimliği bulunamadı.');
    return await StorageService.getPresignedUploadUrl(studioId, folder, fileName, contentType);
  }

  /**
   * Video Kaydını Veritabanına Ekle
   */
  static async createVideo(
    studioId: string,
    actorId: string,
    data: CreateVideoInput,
    meta?: Meta
  ) {
    if (!studioId) throw new Error('Stüdyo kimliği bulunamadı.');

    const video = await prisma.onDemandVideo.create({
      data: {
        studioId,
        title: Sanitizer.sanitizeString(data.title),
        description: data.description ? Sanitizer.sanitizeString(data.description) : null,
        videoUrl: data.videoUrl,
        thumbnailUrl: data.thumbnailUrl ?? null,
        durationSec: data.durationSec ?? 0,
        discipline: data.discipline ?? Discipline.PILATES,
        isRequiredPackage: data.isRequiredPackage ?? true,
        isActive: true,
      },
    });

    await LoggerService.audit({
      studioId,
      actorId,
      category: 'SYSTEM',
      action: 'VIDEO_CREATED',
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
      details: { videoId: video.id, title: video.title },
    });

    return video;
  }

  /**
   * Video Bilgilerini Güncelle (PUT / PATCH)
   */
  static async updateVideo(
    studioId: string | null | undefined,
    actorId: string,
    videoId: string,
    data: UpdateVideoInput,
    meta?: Meta
  ) {
    const existingVideo = await prisma.onDemandVideo.findUnique({ where: { id: videoId } });
    if (!existingVideo) throw new Error('Video bulunamadı.');

    if (studioId && existingVideo.studioId !== studioId) {
      throw new Error('Bu videoyu güncelleme yetkiniz yok.');
    }

    const updatedVideo = await prisma.onDemandVideo.update({
      where: { id: videoId },
      data: {
        ...(data.title !== undefined && { title: Sanitizer.sanitizeString(data.title) }),
        ...(data.description !== undefined && {
          description: data.description ? Sanitizer.sanitizeString(data.description) : null,
        }),
        ...(data.videoUrl !== undefined && { videoUrl: data.videoUrl }),
        ...(data.thumbnailUrl !== undefined && { thumbnailUrl: data.thumbnailUrl }),
        ...(data.durationSec !== undefined && { durationSec: data.durationSec }),
        ...(data.discipline !== undefined && { discipline: data.discipline }),
        ...(data.isRequiredPackage !== undefined && { isRequiredPackage: data.isRequiredPackage }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    await LoggerService.audit({
      studioId: existingVideo.studioId,
      actorId,
      category: 'SYSTEM',
      action: 'VIDEO_UPDATED',
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
      details: { videoId, updatedFields: Object.keys(data) },
    });

    return updatedVideo;
  }

  /**
   * On-Demand Videoları Listele
   */
  static async listVideos(
    requesterRole: Role,
    studioId: string | null | undefined,
    discipline?: Discipline
  ) {
    const where: any = { isActive: true };

    if (requesterRole !== 'SUPER_ADMIN') {
      if (!studioId) throw new Error('Stüdyo kimliği bulunamadı.');
      where.studioId = studioId;
    } else if (studioId) {
      where.studioId = studioId;
    }

    if (discipline) where.discipline = discipline;

    return await prisma.onDemandVideo.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { studio: { select: { id: true, name: true, subdomain: true } } },
    });
  }

  /**
   * Video Sil (R2 Dosyası ile Birlikte)
   */
  static async deleteVideo(
    studioId: string | null | undefined,
    actorId: string,
    videoId: string,
    meta?: Meta
  ) {
    const video = await prisma.onDemandVideo.findUnique({ where: { id: videoId } });
    if (!video) throw new Error('Video bulunamadı.');

    if (studioId && video.studioId !== studioId) {
      throw new Error('Bu videoyu silme yetkiniz yok.');
    }

    // R2 üzerindeki key yolunu çıkarıp sil
    if (video.videoUrl.includes(process.env.R2_PUBLIC_DOMAIN || '')) {
      const key = video.videoUrl.replace(`${process.env.R2_PUBLIC_DOMAIN}/`, '');
      await StorageService.deleteFile(key).catch(() => null);
    }

    await prisma.onDemandVideo.delete({ where: { id: videoId } });

    await LoggerService.audit({
      studioId: video.studioId,
      actorId,
      category: 'SYSTEM',
      action: 'VIDEO_DELETED',
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
      details: { videoId, title: video.title },
    });

    return { message: 'Video başarıyla silindi.' };
  }

  static async getVideoById(studioId: string | null | undefined, videoId: string) {
  const video = await prisma.onDemandVideo.findUnique({
    where: { id: videoId },
    include: { studio: { select: { id: true, name: true, subdomain: true } } },
  });

  if (!video) {
    throw new Error('Video bulunamadı.');
  }

  // Tenant izolasyonu kontrolü (Super Admin değilse sadece kendi stüdyosunu görebilir)
  if (studioId && video.studioId !== studioId) {
    throw new Error('Bu videoya erişim yetkiniz yok.');
  }

  return video;
}
}