import { prisma } from '../utils/prisma';
import { Sanitizer } from '../utils/sanitizer';
import { Role } from '@prisma/client';

export interface UpdateStudioSettingsInput {
  name?: string;
  slug?: string;
  currency?: string;
  timeZone?: string;
  address?: string;
  disciplines?: string[];
  enabledServices?: string[];
}

export class StudioSettingsService {
  /**
   * Stüdyo Ayarlarını Getir
   */
  static async getStudioSettings(
    requesterRole: Role,
    studioId: string | null | undefined,
    subdomain?: string | null
  ) {
    let whereCondition: { id: string } | { subdomain: string } | null = null;

    if (studioId) {
      whereCondition = { id: studioId };
    } else if (subdomain) {
      whereCondition = { subdomain };
    }

    if (!whereCondition) {
      throw new Error('Stüdyo kimliği veya subdomain bilgisi bulunamadı.');
    }

    const studio = await prisma.studio.findUnique({
      where: whereCondition,
    });

    if (!studio) {
      throw new Error('Stüdyo bilgisi bulunamadı.');
    }

    return {
      id: studio.id,
      name: studio.name,
      slug: studio.subdomain,
      currency: studio.currency || 'TRY',
      timeZone: 'Europe/Istanbul',
      address: studio.address || '',
      disciplines: ['PILATES', 'YOGA', 'WELLNESS_SPA'],
      enabledServices: ['CLASS', 'APPOINTMENT', 'WORKSHOP'],
    };
  }

  /**
   * Stüdyo Ayarlarını Güncelle
   */
  static async updateStudioSettings(
    studioId: string,
    data: UpdateStudioSettingsInput
  ) {
    if (!studioId) throw new Error('Stüdyo kimliği bulunamadı.');

    const existingStudio = await prisma.studio.findUnique({ where: { id: studioId } });
    if (!existingStudio) throw new Error('Güncellenecek stüdyo bulunamadı.');

    // Slug / Subdomain benzersizlik kontrolü
    if (data.slug && data.slug !== existingStudio.subdomain) {
      const sanitizedSlug = Sanitizer.sanitizeString(data.slug).toLowerCase();
      const duplicate = await prisma.studio.findUnique({
        where: { subdomain: sanitizedSlug },
      });
      if (duplicate) {
        throw new Error('Bu stüdyo URL / slug adı zaten kullanılıyor.');
      }
      data.slug = sanitizedSlug;
    }

    // Prisma update çağrısında YALNIZCA şemada olan alanları güncelliyoruz
    const updatedStudio = await prisma.studio.update({
      where: { id: studioId },
      data: {
        ...(data.name !== undefined && { name: Sanitizer.sanitizeString(data.name) }),
        ...(data.slug !== undefined && { subdomain: data.slug }),
        ...(data.currency !== undefined && { currency: data.currency }),
        ...(data.address !== undefined && { address: data.address ? Sanitizer.sanitizeString(data.address) : null }),
      },
    });

    return {
      id: updatedStudio.id,
      name: updatedStudio.name,
      slug: updatedStudio.subdomain,
      currency: updatedStudio.currency,
      timeZone: data.timeZone || 'Europe/Istanbul',
      address: updatedStudio.address || '',
      disciplines: data.disciplines || ['PILATES', 'YOGA'],
      enabledServices: data.enabledServices || ['CLASS', 'APPOINTMENT'],
    };
  }
}