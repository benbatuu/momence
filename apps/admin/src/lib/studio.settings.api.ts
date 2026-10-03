import { api } from '@/lib/api';
import type { StudioConfig } from '@/types/studio.types';

export const studioSettingsApi = {
  /**
   * Stüdyo Genel Ayarlarını Getir
   */
  getSettings: async (): Promise<StudioConfig & { address: string }> => {
    const res = await api.get('/studio-settings');
    return res.data?.data || res.data;
  },

  /**
   * Stüdyo Genel Ayarlarını Güncelle
   */
  updateSettings: async (
    payload: StudioConfig & { address: string }
  ): Promise<StudioConfig & { address: string }> => {
    const res = await api.put('/studio-settings', payload);
    return res.data?.data || res.data;
  },
};