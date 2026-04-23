import Http from "./httpRequest";
import type { OrderPaymentStatus, OrderStatus } from "@/types/order.type";

export function listOrders(params?: {
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
  const requestParams = {
    ...params,
    payment_statuses: params?.payment_statuses?.join(","),
  };

  return Http({
    url: "/orders",
    method: "GET",
    params: requestParams,
  });
}

export function getOrder(id: string) {
  return Http({
    url: `/orders/${id}`,
    method: "GET",
  });
}

export function updateOrderStatus(id: string, status: OrderStatus) {
  return Http({
    url: `/orders/${id}/status`,
    method: "PUT",
    data: { status },
  });
}

export function markOrderAsPaid(id: string) {
  return Http({
    url: `/orders/${id}/mark-paid`,
    method: "PUT",
    data: { is_paid: true },
  });
}

