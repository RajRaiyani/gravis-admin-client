export type OrderPaymentStatus =
  | "pending"
  | "paid"
  | "partially_paid"
  | "failed";

export type OrderStatus =
  | "pending"
  | "processing"
  | "out_for_delivery"
  | "delivered"
  | "complete"
  | "cancel";

export interface OrderListItem {
  id: string;
  serial: string;
  serial_number: number;
  payment_status: OrderPaymentStatus;
  status: string;
  total_amount_in_paisa: number;
  paid_amount_in_paisa: number;
  is_paid: boolean;
  created_at: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone_number: string | null;
  total_item_count: number;
}

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price_in_paisa: number;
  description?: string;
  primary_image?: {
    id: string;
    key: string;
    url: string;
  } | null;
}

export interface OrderDetails extends OrderListItem {
  razorpay_payment_id?: string | null;
  razorpay_order_id?: string | null;
  billing_details?: Record<string, unknown>;
  billing_address?: Record<string, unknown>;
  shipping_address?: Record<string, unknown>;
  items: OrderItem[];
}

export interface OrdersResponse {
  orders: OrderListItem[];
}

export const DEFAULT_ADMIN_PAYMENT_STATUSES: OrderPaymentStatus[] = [
  "paid",
  "partially_paid",
];

