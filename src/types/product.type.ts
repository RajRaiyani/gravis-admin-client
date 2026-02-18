export interface ProductImage {
  id: string;
  key: string;
  url: string;
}

export interface ProductImageData {
  image_id: string;
  is_primary: boolean;
  image?: ProductImage;
}

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
}

export interface TechnicalDetail {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  description?: string;
  tags: string[];
  points: string[];
  technical_details?: TechnicalDetail[];
  metadata: Record<string, any>;
  sale_price: number;
  sale_price_in_rupee?: number;
  product_label?: string | null;
  warranty_label?: string | null;
  is_featured: boolean;
  created_at?: string;
  updated_at?: string;
  category?: ProductCategory;
  images?: ProductImageData[];
}

export interface CreateProductData {
  category_id: string;
  name: string;
  description?: string;
  tags: string[];
  points: string[];
  metadata: Record<string, any>;
  sale_price: number;
  image_id: string;
  product_label?: string;
  warranty_label?: string;
  is_featured?: boolean;
}

export interface UpdateProductData {
  category_id: string;
  name: string;
  description?: string;
  tags: string[];
  points: string[];
  metadata: Record<string, any>;
  sale_price: number;
  image_id: string;
  product_label?: string;
  warranty_label?: string;
  is_featured?: boolean;
}

export interface ProductFilterParams {
  category_id?: string;
  search?: string;
  offset?: number;
  limit?: number;
}

