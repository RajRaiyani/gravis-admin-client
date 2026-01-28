import axios from './httpRequest';
import type {
  CreateProductData,
  UpdateProductData,
  ProductFilterParams,
} from '@/types/product.type';

export const listProducts = (params?: ProductFilterParams) => {
  const url = `/products`;
  return axios({ method: 'GET', url, params });
};

export const getProduct = (id: string) => {
  const url = `/products/${id}`;
  return axios({ method: 'GET', url });
};

export const createProduct = (data: CreateProductData) => {
  const url = `/products`;
  return axios({ method: 'POST', url, data });
};

export const updateProduct = (id: string, data: UpdateProductData) => {
  const url = `/products/${id}`;
  return axios({ method: 'PUT', url, data });
};

export const deleteProduct = (id: string) => {
  const url = `/products/${id}`;
  return axios({ method: 'DELETE', url });
};

export const addProductImage = (productId: string, imageId: string) => {
  const url = `/products/${productId}/images`;
  return axios({ method: 'POST', url, data: { image_id: imageId } });
};

export const deleteProductImage = (imageId: string) => {
  const url = `/products/images/${imageId}`;
  return axios({ method: 'DELETE', url });
};

