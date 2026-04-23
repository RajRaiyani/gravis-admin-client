import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  getOrder,
  listOrders,
  markOrderAsPaid,
  updateOrderStatus,
} from "@/services/api/order";
import type {
  OrderDetails,
  OrderPaymentStatus,
  OrdersResponse,
  OrderStatus,
} from "@/types/order.type";

export const keys = {
  all: ["orders"] as const,
  lists: () => [...keys.all, "list"] as const,
  list: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    payment_status?: OrderPaymentStatus;
    payment_statuses?: OrderPaymentStatus[];
    sort_by?:
      | "created_at"
      | "serial_number"
      | "total_amount_in_paisa"
      | "total_item_count";
    sort_order?: "asc" | "desc";
  }) => [...keys.lists(), params] as const,
  infiniteList: (params?: {
    limit?: number;
    search?: string;
    status?: string;
    payment_status?: OrderPaymentStatus;
    payment_statuses?: OrderPaymentStatus[];
    sort_by?:
      | "created_at"
      | "serial_number"
      | "total_amount_in_paisa"
      | "total_item_count";
    sort_order?: "asc" | "desc";
  }) => [...keys.lists(), "infinite", params] as const,
  details: () => [...keys.all, "detail"] as const,
  detail: (id: string) => [...keys.details(), id] as const,
};

export function useOrders(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  payment_status?: OrderPaymentStatus;
  payment_statuses?: OrderPaymentStatus[];
  sort_by?:
    | "created_at"
    | "serial_number"
    | "total_amount_in_paisa"
    | "total_item_count";
  sort_order?: "asc" | "desc";
}) {
  return useQuery<OrdersResponse>({
    queryKey: keys.list(params),
    queryFn: async (): Promise<OrdersResponse> => {
      const response = await listOrders(params);
      return response as unknown as OrdersResponse;
    },
  });
}

export function useOrdersInfinite(params?: {
  limit?: number;
  search?: string;
  status?: string;
  payment_status?: OrderPaymentStatus;
  payment_statuses?: OrderPaymentStatus[];
  sort_by?:
    | "created_at"
    | "serial_number"
    | "total_amount_in_paisa"
    | "total_item_count";
  sort_order?: "asc" | "desc";
}) {
  const limit = params?.limit ?? 20;

  return useInfiniteQuery({
    queryKey: keys.infiniteList(params),
    queryFn: async ({ pageParam }): Promise<OrdersResponse> => {
      const response = await listOrders({
        ...params,
        page: pageParam as number,
        limit,
      });
      return response as unknown as OrdersResponse;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if ((lastPage.orders ?? []).length < limit) return undefined;
      return allPages.length + 1;
    },
  });
}

export function useOrder(id: string) {
  return useQuery<{ order: OrderDetails }>({
    queryKey: keys.detail(id),
    queryFn: async (): Promise<{ order: OrderDetails }> => {
      const response = await getOrder(id);
      return response as unknown as { order: OrderDetails };
    },
    enabled: !!id,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation<
    { order: OrderDetails },
    Error,
    { id: string; status: OrderStatus }
  >({
    mutationFn: async ({ id, status }) => {
      const response = await updateOrderStatus(id, status);
      return response as unknown as { order: OrderDetails };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: keys.lists() });
      queryClient.invalidateQueries({ queryKey: keys.detail(variables.id) });
      toast.success("Order status updated successfully");
    },
    onError: () => {
      toast.error("Failed to update order status");
    },
  });
}

export function useMarkOrderAsPaid() {
  const queryClient = useQueryClient();

  return useMutation<{ order: OrderDetails }, Error, { id: string }>({
    mutationFn: async ({ id }) => {
      const response = await markOrderAsPaid(id);
      return response as unknown as { order: OrderDetails };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: keys.lists() });
      queryClient.invalidateQueries({ queryKey: keys.detail(variables.id) });
      toast.success("Order marked as paid successfully");
    },
    onError: () => {
      toast.error("Failed to mark order as paid");
    },
  });
}

