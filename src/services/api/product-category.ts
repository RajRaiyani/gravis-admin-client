import axios from './httpRequest';
import type {
  CreateProductCategoryData,
  UpdateProductCategoryData,
} from '@/types/product-category.type';

export const listProductCategories = () => {
  const url = `/product-categories`;
  return axios({ method: 'GET', url });
};

export const getProductCategory = (id: string) => {
  const url = `/product-categories/${id}`;
  return axios({ method: 'GET', url });
};

export const createProductCategory = (data: CreateProductCategoryData) => {
  const url = `/product-categories`;
  return axios({ method: 'POST', url, data });
};

export const updateProductCategory = (id: string, data: UpdateProductCategoryData) => {
  const url = `/product-categories/${id}`;
  return axios({ method: 'PUT', url, data });
};

export const deleteProductCategory = (id: string) => {
  const url = `/product-categories/${id}`;
  return axios({ method: 'DELETE', url });
};