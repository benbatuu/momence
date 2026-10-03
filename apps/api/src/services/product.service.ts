import { prisma } from '../utils/prisma';
import { LoggerService } from '../utils/logger';
import { Sanitizer } from '../utils/sanitizer';
import { OrderStatus, PaymentMethod, PaymentStatus, Role } from '@prisma/client';

export interface CreateProductInput {
  name: string;
  description?: string;
  price: number;
  stock: number;
  imageUrl?: string;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  imageUrl?: string;
  isActive?: boolean;
}

export interface OrderItemInput {
  productId: string;
  quantity: number;
}

export interface CreateOrderInput {
  userId: string;
  items: OrderItemInput[];
  paymentMethod?: PaymentMethod;
}

export interface Meta {
  ip?: string;
  userAgent?: string;
}

export class ProductService {
  // ==========================================
  // 1. ÜRÜN YÖNETİMİ (Products)
  // ==========================================

  /**
   * Stüdyo Ürünlerini Listele
   */
  static async listProducts(
    requesterRole: Role,
    studioId: string | null | undefined,
    includeInactive = false
  ) {
    const where: any = {};

    if (requesterRole !== 'SUPER_ADMIN') {
      if (!studioId) throw new Error('Stüdyo kimliği bulunamadı.');
      where.studioId = studioId;
    } else if (studioId) {
      where.studioId = studioId;
    }

    if (!includeInactive) {
      where.isActive = true;
    }

    return await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { studio: { select: { id: true, name: true, subdomain: true } } },
    });
  }

  /**
   * Yeni Ürün Ekle (SUPER_ADMIN, ADMIN)
   */
  static async createProduct(
    studioId: string,
    actorId: string,
    data: CreateProductInput,
    meta?: Meta
  ) {
    if (!studioId) throw new Error('Stüdyo kimliği bulunamadı.');

    const product = await prisma.product.create({
      data: {
        studioId,
        name: Sanitizer.sanitizeString(data.name),
        description: data.description ? Sanitizer.sanitizeString(data.description) : null,
        price: data.price,
        stock: Math.max(0, data.stock),
        imageUrl: data.imageUrl ?? null,
        isActive: true,
      },
    });

    await LoggerService.audit({
      studioId,
      actorId,
      category: 'STORE',
      action: 'PRODUCT_CREATED',
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
      details: { productId: product.id, name: product.name, price: product.price, stock: product.stock },
    });

    return product;
  }

  /**
   * Ürün Güncelle (SUPER_ADMIN, ADMIN)
   */
  static async updateProduct(
    studioId: string | null | undefined,
    actorId: string,
    productId: string,
    data: UpdateProductInput,
    meta?: Meta
  ) {
    const product = await prisma.product.findUnique({ where: { id: productId } });

    if (!product) throw new Error('Ürün bulunamadı.');

    if (studioId && product.studioId !== studioId) {
      throw new Error('Bu ürünü düzenleme yetkiniz yok.');
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        name: data.name ? Sanitizer.sanitizeString(data.name) : undefined,
        description: data.description !== undefined ? Sanitizer.sanitizeString(data.description) : undefined,
        price: data.price ?? undefined,
        stock: data.stock !== undefined ? Math.max(0, data.stock) : undefined,
        imageUrl: data.imageUrl !== undefined ? data.imageUrl : undefined,
        isActive: data.isActive !== undefined ? data.isActive : undefined,
      },
    });

    await LoggerService.audit({
      studioId: product.studioId,
      actorId,
      category: 'STORE',
      action: 'PRODUCT_UPDATED',
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
      details: { productId, changes: data },
    });

    return updated;
  }

  // ==========================================
  // 2. POS SİPARİŞ & SATIŞ (Orders)
  // ==========================================

  /**
   * POS Satış/Sipariş Oluştur (Stok Düşer ve Ödeme Kaydı Açar)
   */
  static async createOrder(
    studioId: string,
    actorId: string,
    data: CreateOrderInput,
    meta?: Meta
  ) {
    if (!studioId) throw new Error('Stüdyo kimliği bulunamadı.');
    if (!data.items || data.items.length === 0) throw new Error('Sipariş için en az bir ürün seçilmelidir.');

    // Müşteri Kontrolü
    const user = await prisma.user.findFirst({ where: { id: data.userId, studioId } });
    if (!user) throw new Error('Müşteri bulunamadı.');

    // Atomik Sipariş Oluşturma, Stok Kontrolü/Düşme ve Ödeme Kaydı
    const order = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const orderItemsData = [];

      for (const item of data.items) {
        const product = await tx.product.findFirst({
          where: { id: item.productId, studioId, isActive: true },
        });

        if (!product) {
          throw new Error(`Ürün bulunamadı veya pasif durumda (ID: ${item.productId}).`);
        }

        if (product.stock < item.quantity) {
          throw new Error(`"${product.name}" ürünü için yetersiz stok. Mevcut Stok: ${product.stock}`);
        }

        const itemTotal = product.price * item.quantity;
        totalAmount += itemTotal;

        orderItemsData.push({
          productId: product.id,
          quantity: item.quantity,
          unitPrice: product.price,
        });

        // Stok Düş
        await tx.product.update({
          where: { id: product.id },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // Sipariş Kaydı
      const createdOrder = await tx.order.create({
        data: {
          studioId,
          userId: data.userId,
          totalAmount,
          status: OrderStatus.COMPLETED,
          items: {
            createMany: {
              data: orderItemsData,
            },
          },
        },
        include: {
          items: { include: { product: true } },
          user: { select: { id: true, name: true, email: true } },
        },
      });

      // Ödeme Kaydı
      await tx.payment.create({
        data: {
          studioId,
          userId: data.userId,
          orderId: createdOrder.id,
          amount: totalAmount,
          paymentMethod: data.paymentMethod ?? PaymentMethod.CASH,
          status: PaymentStatus.SUCCESS,
        },
      });

      return createdOrder;
    });

    await LoggerService.audit({
      studioId,
      actorId,
      category: 'STORE',
      action: 'ORDER_CREATED',
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
      details: { orderId: order.id, userId: data.userId, totalAmount: order.totalAmount },
    });

    return order;
  }

  /**
   * Stüdyonun Sipariş/Satış Geçmişini Listele
   */
  static async listOrders(
    requesterRole: Role,
    studioId: string | null | undefined,
    userId?: string
  ) {
    const where: any = {};

    if (requesterRole !== 'SUPER_ADMIN') {
      if (!studioId) throw new Error('Stüdyo kimliği bulunamadı.');
      where.studioId = studioId;
    } else if (studioId) {
      where.studioId = studioId;
    }

    if (userId) where.userId = userId;

    return await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        items: { include: { product: { select: { name: true } } } },
        payments: { select: { paymentMethod: true, status: true } },
      },
    });
  }

  static async deleteProduct(studioId: string, actorId: string, productId: string, meta?: Meta) {
    const product = await prisma.product.findUnique({ where: { id: productId } });

    if (!product) throw new Error('Ürün bulunamadı.');

    if (studioId && product.studioId !== studioId) {
      throw new Error('Bu ürünü silme yetkiniz yok.');
    }

    await prisma.product.delete({ where: { id: productId } });

    await LoggerService.audit({
      studioId: product.studioId,
      actorId,
      category: 'STORE',
      action: 'PRODUCT_DELETED',
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
      details: { productId, name: product.name },
    });

    return { message: 'Ürün başarıyla silindi.' };
  }
}