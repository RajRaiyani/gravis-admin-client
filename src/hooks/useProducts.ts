import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { AxiosError } from "axios";
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductImage,
  deleteProductImage,
} from "@/services/api/product";
import type {
  UpdateProductData,
  ProductFilterParams,
} from "@/types/product.type";

export const keys = {
  all: ["products"] as const,
  lists: () => [...keys.all, "list"] as const,
  list: (params?: ProductFilterParams) => [...keys.lists(), params] as const,
  details: () => [...keys.all, "detail"] as const,
  detail: (id: string) => [...keys.details(), id] as const,
};

export function useGetProducts(params?: ProductFilterParams) {
  return useQuery({
    queryKey: keys.list(params),
    queryFn: () => listProducts(params),
  });
}

export function useGetProduct(id: string) {
  return useQuery({
    queryKey: keys.detail(id),
    queryFn: () => getProduct(id),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.lists() });
      toast.success("Product created successfully");
    },
    onError: (error: AxiosError | { message: string }) => {
      const errorMessage = error?.message || "Failed to create product";
      toast.error(errorMessage);
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductData }) =>
      updateProduct(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: keys.lists() });
      queryClient.invalidateQueries({ queryKey: keys.detail(variables.id) });
      toast.success("Product updated successfully");
    },
    onError: (error: unknown) => {
      const errorMessage =
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Failed to update product";
      toast.error(errorMessage);
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.lists() });
      toast.success("Product deleted successfully");
    },
    onError: (error: unknown) => {
      const errorMessage =
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Failed to delete product";
      toast.error(errorMessage);
    },
  });
}

export function useAddProductImage(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (imageId: string) => addProductImage(productId, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.detail(productId) });
      toast.success("Image added successfully");
    },
    onError: (error: unknown) => {
      const errorMessage =
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Failed to add image";
      toast.error(errorMessage);
    },
  });
}

export function useDeleteProductImage(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (imageId: string) => deleteProductImage(imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.detail(productId) });
      toast.success("Image removed successfully");
    },
    onError: (error: unknown) => {
      const errorMessage =
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Failed to remove image";
      toast.error(errorMessage);
    },
  });
}

