import type { Context } from 'hono';
import { ProductService } from '../services/product.service';
import { successResponse, errorResponse } from '../utils/response';
import HttpStatusCode from '../types/httpstatuscode';

export class ProductController {
  private static getMeta(c: Context) {
    return {
      ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '127.0.0.1',
      userAgent: c.req.header('user-agent'),
    };
  }

  /**
   * GET /api/products
   */
  static async listProducts(c: Context) {
    try {
      const actor = c.get('user');
      const studioId = c.get('studioId') || null;
      const includeInactive = c.req.query('includeInactive') === 'true';

      const products = await ProductService.listProducts(actor.role, studioId, includeInactive);
      return successResponse(c, products, 'Ürünler listelendi.', HttpStatusCode.OK);
    } catch (err: any) {
      return errorResponse(c, err.message, HttpStatusCode.BAD_REQUEST);
    }
  }

  /**
   * POST /api/products
   */
  static async createProduct(c: Context) {
    try {
      const studioId = c.get('studioId') || null;
      const actor = c.get('user');
      const body = await c.req.json();
      const meta = ProductController.getMeta(c);

      if (!studioId) {
        return errorResponse(c, 'Stüdyo bilgisi bulunamadı.', HttpStatusCode.BAD_REQUEST);
      }

      if (!actor?.id) {
        return errorResponse(c, 'Oturum bilgisi eksik.', HttpStatusCode.UNAUTHORIZED);
      }

      if (!body.name || body.price === undefined || body.stock === undefined) {
        return errorResponse(c, 'Ürün Adı, Fiyatı ve Stok zorunludur.', HttpStatusCode.BAD_REQUEST);
      }

      const product = await ProductService.createProduct(studioId, actor.id, body, meta);
      return successResponse(c, product, 'Ürün oluşturuldu.', HttpStatusCode.CREATED);
    } catch (err: any) {
      return errorResponse(c, err.message, HttpStatusCode.BAD_REQUEST);
    }
  }

  /**
   * PUT /api/products/:id
   */
  static async updateProduct(c: Context) {
    try {
      const studioId = c.get('studioId') || null;
      const actor = c.get('user');
      const productId = c.req.param('id');
      const body = await c.req.json();
      const meta = ProductController.getMeta(c);

      if (!actor?.id || !productId) {
        return errorResponse(c, 'Gerekli parametreler eksik.', HttpStatusCode.BAD_REQUEST);
      }

      const updated = await ProductService.updateProduct(studioId, actor.id, productId, body, meta);
      return successResponse(c, updated, 'Ürün güncellendi.', HttpStatusCode.OK);
    } catch (err: any) {
      return errorResponse(c, err.message, HttpStatusCode.BAD_REQUEST);
    }
  }

  /**
   * POST /api/products/orders
   * POS Sipariş / Satış Yap
   */
  static async createOrder(c: Context) {
    try {
      const studioId = c.get('studioId') || null;
      const actor = c.get('user');
      const body = await c.req.json();
      const meta = ProductController.getMeta(c);

      if (!studioId) {
        return errorResponse(c, 'Stüdyo bilgisi bulunamadı.', HttpStatusCode.BAD_REQUEST);
      }

      if (!actor?.id) {
        return errorResponse(c, 'Oturum bilgisi eksik.', HttpStatusCode.UNAUTHORIZED);
      }

      if (!body.userId || !body.items || body.items.length === 0) {
        return errorResponse(c, 'Müşteri ve en az bir ürün seçimi zorunludur.', HttpStatusCode.BAD_REQUEST);
      }

      const order = await ProductService.createOrder(studioId, actor.id, body, meta);
      return successResponse(c, order, 'Satış işlemi tamamlandı.', HttpStatusCode.CREATED);
    } catch (err: any) {
      return errorResponse(c, err.message, HttpStatusCode.BAD_REQUEST);
    }
  }

  /**
   * GET /api/products/orders
   */
  static async listOrders(c: Context) {
    try {
      const actor = c.get('user');
      const studioId = c.get('studioId') || null;
      const userId = c.req.query('userId');

      const orders = await ProductService.listOrders(actor.role, studioId, userId);
      return successResponse(c, orders, 'Siparişler listelendi.', HttpStatusCode.OK);
    } catch (err: any) {
      return errorResponse(c, err.message, HttpStatusCode.BAD_REQUEST);
    }
  }

  /**
   * DELETE /api/products/:id
   */
  static async deleteProduct(c: Context) {
    try {
      const studioId = c.get('studioId') || null;
      const actor = c.get('user');
      const productId = c.req.param('id');
      const meta = ProductController.getMeta(c);

      if (!actor?.id || !productId) {
        return errorResponse(c, 'Gerekli parametreler eksik.', HttpStatusCode.BAD_REQUEST);
      }

      await ProductService.deleteProduct(studioId, actor.id, productId, meta);
      return successResponse(c, null, 'Ürün silindi.', HttpStatusCode.OK);
    } catch (err: any) {
      return errorResponse(c, err.message, HttpStatusCode.BAD_REQUEST);
    }
  }
}