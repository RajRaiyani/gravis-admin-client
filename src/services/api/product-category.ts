import axios from './httpRequest';
import type {
  CreateProductCategoryData,
  UpdateProductCategoryData,
} from '@/types/product-category.type';

export const listProductCategories = () =>
  axios({ method: 'GET', url: '/product-categories' });

export const getProductCategory = (id: string) =>
  axios({ method: 'GET', url: `/product-categories/${id}` });

export const createProductCategory = (data: CreateProductCategoryData) =>
  axios({ method: 'POST', url: '/product-categories', data });

export const updateProductCategory = (id: string, data: UpdateProductCategoryData) =>
  axios({ method: 'PUT', url: `/product-categories/${id}`, data });

export const deleteProductCategory = (id: string) =>
  axios({ method: 'DELETE', url: `/product-categories/${id}` });