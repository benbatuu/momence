import { api } from './api';

export interface Product {
  id: string;
  studioId: string;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  imageUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  studio?: {
    id: string;
    name: string;
    subdomain: string;
  };
}

export interface CreateProductInput {
  name: string;
  description?: string;
  price: number;
  stock: number;
  imageUrl?: string;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  isActive?: boolean;
}

export const productsApi = {
  // Stüdyo Ürünlerini Listele (/store/products)
  getProducts: async (params?: { includeInactive?: boolean }): Promise<Product[]> => {
    const res = await api.get('/products', { params });
    const data = res.data?.data?.products || res.data?.products || res.data?.data || res.data;
    return Array.isArray(data) ? data : [];
  },

  // Tekil Ürün Detayı (/store/products/:id)
  getProductById: async (id: string): Promise<Product> => {
    const res = await api.get(`/products/${id}`);
    return res.data?.data || res.data;
  },

  // Yeni Ürün Ekle (/store/products)
  createProduct: async (payload: CreateProductInput): Promise<Product> => {
    const res = await api.post('/products', payload);
    return res.data?.data || res.data;
  },

  // Ürün Güncelle (/store/products/:id)
  updateProduct: async (id: string, payload: UpdateProductInput): Promise<Product> => {
    const res = await api.put(`/products/${id}`, payload);
    return res.data?.data || res.data;
  },

  // Ürün Sil / Pasife Al (/store/products/:id)
  deleteProduct: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
  },
};