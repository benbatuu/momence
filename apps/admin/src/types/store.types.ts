export type ProductCategory = 'EQUIPMENT' | 'APPAREL' | 'SUPPLEMENTS' | 'ACCESSORIES' | 'OTHER';

export interface StoreProduct {
  id: string;
  studioId: string;
  name: string;
  sku?: string | null;
  category: ProductCategory;
  price: number;
  currency: string;
  stockQuantity: number;
  imageUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductInput {
  name: string;
  sku?: string;
  category: ProductCategory;
  price: number;
  stockQuantity: number;
  imageUrl?: string;
}