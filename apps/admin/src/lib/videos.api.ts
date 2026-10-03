import { api } from './api';
import type { DisciplineType } from '@/types/studio.types';

export interface OnDemandVideo {
  id: string;
  studioId: string;
  title: string;
  description?: string | null;
  videoUrl: string;
  thumbnailUrl?: string | null;
  durationSec: number;
  discipline: DisciplineType;
  isRequiredPackage: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  studio?: {
    id: string;
    name: string;
    subdomain: string;
  };
}

export interface CreateVideoPayload {
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  durationSec?: number;
  discipline?: DisciplineType;
  isRequiredPackage?: boolean;
}

export interface UpdateVideoPayload extends Partial<CreateVideoPayload> {
  isActive?: boolean;
}

export interface GetUploadUrlPayload {
  fileName: string;
  contentType: string;
  folder?: 'videos' | 'classes' | 'thumbnails' | 'avatars';
  subdomain?: string;
}

export interface GetUploadUrlResponse {
  uploadUrl: string;
  key: string;
  publicUrl: string;
}

export const videosApi = {
  // Cloudflare R2 Presigned Upload URL Al (/videos/upload-url)
  getUploadUrl: async (payload: GetUploadUrlPayload): Promise<GetUploadUrlResponse> => {
    const headers: Record<string, string> = {};
    if (payload.subdomain) {
      headers['x-studio-subdomain'] = payload.subdomain;
    }

    const res = await api.post('/videos/upload-url', payload, { headers });
    return res.data?.data || res.data;
  },

  // On-Demand Videoları Listele (/videos)
  getVideos: async (params?: { discipline?: string }): Promise<OnDemandVideo[]> => {
    const queryParams: Record<string, string> = {};
    if (params?.discipline && params.discipline !== 'ALL') {
      queryParams.discipline = params.discipline;
    }

    const res = await api.get('/videos', { params: queryParams });
    const data = res.data?.data?.videos || res.data?.videos || res.data?.data || res.data;

    return Array.isArray(data) ? data : [];
  },

  // Tekil Video Detayı Getir (/videos/:id)
  getVideoById: async (id: string): Promise<OnDemandVideo> => {
    const res = await api.get(`/videos/${id}`);
    return res.data?.data || res.data;
  },

  // Kütüphaneye Yeni Video Kaydet (/videos)
  createVideo: async (payload: CreateVideoPayload): Promise<OnDemandVideo> => {
    const res = await api.post('/videos', payload);
    return res.data?.data || res.data;
  },

  // Video Bilgilerini Güncelle (/videos/:id)
  updateVideo: async (id: string, payload: UpdateVideoPayload): Promise<OnDemandVideo> => {
    const res = await api.put(`/videos/${id}`, payload);
    return res.data?.data || res.data;
  },

  // Paket Zorunluluğu / Erişim Durumunu Güncelle (/videos/:id)
  toggleMembersOnly: async (id: string, isRequiredPackage: boolean): Promise<OnDemandVideo> => {
    const res = await api.put(`/videos/${id}`, { isRequiredPackage });
    return res.data?.data || res.data;
  },

  // Videoyu ve Bulut Dosyasını Sil (/videos/:id)
  deleteVideo: async (id: string): Promise<void> => {
    await api.delete(`/videos/${id}`);
  },
};