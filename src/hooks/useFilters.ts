import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  listFilters,
  createFilter,
  createFilterOption,
  updateFilter,
  updateFilterOption,
  deleteFilter,
  deleteFilterOption,
} from "@/services/api/filters";
import type {
  Filter,
  FilterOption,
  UpdateFilterData,
  UpdateFilterOptionData,
} from "@/types/filter.type";

export const keys = {
  all: ["filters"] as const,
  lists: () => [...keys.all, "list"] as const,
  list: (categoryId: string) => [...keys.lists(), categoryId] as const,
};

function normalizeOption(opt: Record<string, unknown>): FilterOption {
  return {
    id: String(opt.id ?? opt.Id ?? ""),
    filter_id: String(opt.filter_id ?? opt.filterId ?? ""),
    value: String(opt.value ?? ""),
  };
}

function normalizeFiltersResponse(data: unknown): Filter[] {
  let list: unknown[] = [];
  if (Array.isArray(data)) list = data;
  else if (data && typeof data === "object" && "data" in data)
    list = Array.isArray((data as { data: unknown }).data)
      ? ((data as { data: unknown[] }).data)
      : [];
  return list.map((f: unknown) => {
    const row = f as Record<string, unknown>;
    const rawOptions =
      row.options ?? row.filter_options ?? row.filterOptions ?? [];
    const allOptions = Array.isArray(rawOptions)
      ? rawOptions.map((o: unknown) =>
          normalizeOption(typeof o === "object" && o ? (o as Record<string, unknown>) : {})
        )
      : [];
    const options = allOptions.filter(
      (o) => String(o.value).trim() !== "" && o.id !== ""
    );
    return {
      id: String(row.id ?? ""),
      category_id: String(row.category_id ?? row.categoryId ?? ""),
      name: String(row.name ?? ""),
      options,
    } as Filter;
  });
}

export function useGetFilters(categoryId: string) {
  return useQuery({
    queryKey: keys.list(categoryId),
    queryFn: async () => {
      const raw = await listFilters(categoryId);
      return normalizeFiltersResponse(raw);
    },
    enabled: !!categoryId,
  });
}

export function useCreateFilter(categoryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createFilter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.list(categoryId) });
      toast.success("Filter created successfully");
    },
    onError: (error: unknown) => {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message: string }).message)
          : "Failed to create filter";
      toast.error(message);
    },
  });
}

export function useCreateFilterOption(categoryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createFilterOption,
    onSuccess: (apiResponse, variables) => {
      const raw = apiResponse as unknown as Record<string, unknown> | undefined;
      const created =
        raw && typeof raw.data !== "undefined"
          ? (raw.data as Record<string, unknown>)
          : raw;
      const optionId = created?.id != null ? String(created.id) : "";
      const newOption: FilterOption = {
        id: optionId,
        filter_id: variables.filter_id,
        value: variables.value,
      };
      if (optionId) {
        queryClient.setQueryData(keys.list(categoryId), (prev: unknown) => {
          const filters = Array.isArray(prev)
            ? (prev as Filter[])
            : normalizeFiltersResponse(prev ?? []);
          return filters.map((f) =>
            f.id === variables.filter_id
              ? {
                  ...f,
                  options: [...(f.options ?? []), newOption],
                }
              : f
          );
        });
      }
      queryClient.invalidateQueries({ queryKey: keys.list(categoryId) });
      toast.success("Filter option added");
    },
    onError: (error: unknown) => {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message: string }).message)
          : "Failed to add filter option";
      toast.error(message);
    },
  });
}

export function useUpdateFilter(categoryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      filterId,
      data,
    }: {
      filterId: string;
      data: UpdateFilterData;
    }) => updateFilter(filterId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.list(categoryId) });
      toast.success("Filter updated");
    },
    onError: (error: unknown) => {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message: string }).message)
          : "Failed to update filter";
      toast.error(message);
    },
  });
}

export function useUpdateFilterOption(categoryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      filterOptionId,
      data,
    }: {
      filterOptionId: string;
      data: UpdateFilterOptionData;
    }) => updateFilterOption(filterOptionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.list(categoryId) });
      toast.success("Filter option updated");
    },
    onError: (error: unknown) => {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message: string }).message)
          : "Failed to update filter option";
      toast.error(message);
    },
  });
}

export function useDeleteFilter(categoryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteFilter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.list(categoryId) });
      toast.success("Filter deleted");
    },
    onError: (error: unknown) => {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message: string }).message)
          : "Failed to delete filter";
      toast.error(message);
    },
  });
}

export function useDeleteFilterOption(categoryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteFilterOption,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.list(categoryId) });
      toast.success("Filter option deleted");
    },
    onError: (error: unknown) => {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message: string }).message)
          : "Failed to delete filter option";
      toast.error(message);
    },
  });
}
