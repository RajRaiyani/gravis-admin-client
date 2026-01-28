import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  listProductCategories,
  getProductCategory,
  createProductCategory,
  updateProductCategory,
  deleteProductCategory,
} from "@/services/api/product-category";
import type { UpdateProductCategoryData } from "@/types/product-category.type";

export const keys = {
  all: ["product-categories"] as const,
  lists: () => [...keys.all, "list"] as const,
  list: () => [...keys.lists()] as const,
  details: () => [...keys.all, "detail"] as const,
  detail: (id: string) => [...keys.details(), id] as const,
};

export function useGetProductCategories() {
  return useQuery({
    queryKey: keys.list(),
    queryFn: () => listProductCategories(),
  });
}

export function useGetProductCategory(id: string) {
  return useQuery({
    queryKey: keys.detail(id),
    queryFn: () => getProductCategory(id),
    enabled: !!id,
  });
}

export function useCreateProductCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProductCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.lists() });
      toast.success("Product category created successfully");
    },
    onError: (error: unknown) => {
      const errorMessage =
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Failed to create product category";
      toast.error(errorMessage);
    },
  });
}

export function useUpdateProductCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductCategoryData }) =>
      updateProductCategory(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: keys.lists() });
      queryClient.invalidateQueries({ queryKey: keys.detail(variables.id) });
      toast.success("Product category updated successfully");
    },
    onError: (error: unknown) => {
      const errorMessage =
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Failed to update product category";
      toast.error(errorMessage);
    },
  });
}

export function useDeleteProductCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProductCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.lists() });
      toast.success("Product category deleted successfully");
    },
    onError: (error: unknown) => {
      const errorMessage =
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Failed to delete product category";
      toast.error(errorMessage);
    },
  });
}

