import axios from "./httpRequest";
import type {
  CreateProductData,
  UpdateProductData,
  ProductFilterParams,
} from "@/types/product.type";

/**
 * Serialize query params so arrays are sent as repeated keys:
 * filter_option_ids=id1&filter_option_ids=id2 (backend expects this format)
 */
function serializeParams(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value == null || value === "") return;
    if (Array.isArray(value)) {
      value.forEach((v) => search.append(key, String(v)));
    } else {
      search.set(key, String(value));
    }
  });
  return search.toString();
}

export function listProducts(params?: ProductFilterParams) {
  const { option_ids, ...rest } = params ?? {};
  const requestParams: Record<string, unknown> = { ...rest };
  const ids = (option_ids ?? []).filter(Boolean);
  if (ids.length > 0) {
    requestParams.filter_option_ids = ids;
  }
  return axios.get("/products", {
    params: requestParams,
    paramsSerializer: serializeParams,
  });
}

export function getProduct(id: string) {
  return axios({ method: "GET", url: `/products/${id}` });
}

export function createProduct(data: CreateProductData) {
  return axios({ method: "POST", url: "/products", data });
}

export function updateProduct(id: string, data: UpdateProductData) {
  return axios({ method: "PUT", url: `/products/${id}`, data });
}

export function deleteProduct(id: string) {
  return axios({ method: "DELETE", url: `/products/${id}` });
}

export function addProductImage(productId: string, imageId: string) {
  return axios({
    method: "POST",
    url: `/products/${productId}/images`,
    data: { image_id: imageId },
  });
}

export function deleteProductImage(imageId: string) {
  return axios({ method: "DELETE", url: `/products/images/${imageId}` });
}
