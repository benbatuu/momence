import { prisma } from '../utils/prisma';
import { Role } from '@prisma/client';

export interface FinancialStatsQuery {
  startDate?: string;
  endDate?: string;
}

export class FinancialService {
  /**
   * Stüdyonun Genel Ciro, Gelir Kırılımları ve Son İşlem Geçmişi
   */
  static async getRevenueStats(
    requesterRole: Role,
    studioId: string | null | undefined,
    query?: FinancialStatsQuery
  ) {
    const wherePayment: any = { status: 'SUCCESS' };

    if (requesterRole !== 'SUPER_ADMIN') {
      if (!studioId) throw new Error('Stüdyo kimliği bulunamadı.');
      wherePayment.studioId = studioId;
    } else if (studioId) {
      wherePayment.studioId = studioId;
    }

    // Tarih Filtresi
    if (query?.startDate || query?.endDate) {
      wherePayment.createdAt = {};
      if (query.startDate) wherePayment.createdAt.gte = new Date(query.startDate);
      if (query.endDate) wherePayment.createdAt.lte = new Date(query.endDate);
    }

    // 1. Tüm Başarılı Ödemeleri Çek
    const payments = await prisma.payment.findMany({
      where: wherePayment,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        clientPackage: { include: { package: { select: { name: true, type: true } } } },
        order: { include: { items: { include: { product: { select: { name: true } } } } } },
      },
    });

    let totalRevenue = 0;
    let packageRevenue = 0;
    let storeRevenue = 0;
    let videoRevenue = 0;

    const formattedTransactions = [];

    for (const p of payments) {
      totalRevenue += p.amount;

      // Gelir Kaynağını Ayrıştır
      let sourceCategory: 'PACKAGE' | 'STORE_PRODUCT' | 'ON_DEMAND' | 'OTHER' = 'OTHER';
      let title = 'Genel Ödeme';

      if (p.clientPackageId && p.clientPackage) {
        sourceCategory = 'PACKAGE';
        packageRevenue += p.amount;
        title = `Paket Alımı: ${p.clientPackage.package.name}`;
      } else if (p.orderId && p.order) {
        sourceCategory = 'STORE_PRODUCT';
        storeRevenue += p.amount;
        const itemNames = p.order.items.map((i) => i.product.name).join(', ');
        title = `Mağaza Satışı: ${itemNames || 'Ürün Satışı'}`;
      } else {
        // Doğrudan video veya diğer satış tipleri
        sourceCategory = 'ON_DEMAND';
        videoRevenue += p.amount;
        title = 'Dijital İçerik / Video Satışı';
      }

      formattedTransactions.push({
        id: p.id,
        amount: p.amount,
        paymentMethod: p.paymentMethod,
        sourceCategory,
        title,
        customerName: p.user.name,
        customerEmail: p.user.email,
        createdAt: p.createdAt,
      });
    }

    return {
      summary: {
        totalRevenue,
        breakdown: {
          packages: packageRevenue,
          storeProducts: storeRevenue,
          videos: videoRevenue,
        },
        transactionCount: payments.length,
      },
      recentTransactions: formattedTransactions.slice(0, 20), // Son 20 işlem
    };
  }

  static async getPaymentById(
    requesterRole: Role,
    studioId: string | null | undefined,
    paymentId: string
  ) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            identityNumber: true,
          },
        },
        clientPackage: {
          include: {
            package: true,
          },
        },
        order: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
        studio: {
          select: { id: true, name: true, subdomain: true },
        },
      },
    });

    if (!payment) {
      throw new Error('Ödeme kaydı bulunamadı.');
    }

    if (requesterRole !== 'SUPER_ADMIN' && studioId && payment.studioId !== studioId) {
      throw new Error('Bu ödeme kaydına erişim yetkiniz bulunmuyor.');
    }

    return payment;
  }
}