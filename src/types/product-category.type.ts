export interface ProductCategoryImage {
  id: string;
  key: string;
  url: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  image_id?: string;
  image?: ProductCategoryImage;
  created_at?: string;
  updated_at?: string;
}

export interface CreateProductCategoryData {
  name: string;
  description?: string;
  image_id: string;
}

export interface UpdateProductCategoryData {
  name: string;
  description?: string;
  image_id: string;
}

