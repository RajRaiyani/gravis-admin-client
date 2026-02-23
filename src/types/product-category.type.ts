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
  banner_image_id?: string;
  banner_image?: ProductCategoryImage;
  created_at?: string;
  updated_at?: string;
}

export interface CreateProductCategoryData {
  name: string;
  description?: string;
  image_id: string;
  banner_image_id?: string;
}

export interface UpdateProductCategoryData {
  name: string;
  description?: string;
  image_id: string;
  banner_image_id?: string;
}

/** One filter option (e.g. "Samsung", "32 inch") — id is sent as option_ids to products API */
export interface CategoryFilterOption {
  id: string;
  category_filter_id: string;
  value: string;
  sort_order?: number;
}

/** Category filter (e.g. "Brand") with its options from GET /product-categories/:id/filters */
export interface CategoryFilterWithOptions {
  id: string;
  category_id: string;
  name: string;
  slug?: string;
  sort_order?: number;
  options: CategoryFilterOption[];
}

