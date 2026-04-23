export interface DashboardInquiriesByStatus {
  pending: number;
  in_progress: number;
  resolved: number;
  closed: number;
}

export interface DashboardOrdersByStatus {
  pending: number;
  processing: number;
  out_for_delivery: number;
  delivered: number;
  complete: number;
  cancel: number;
}

export interface DashboardStats {
  customers: number;
  products: number;
  product_categories: number;
  inquiries: number;
  orders: number;
  inquiries_by_status: DashboardInquiriesByStatus;
  orders_by_status: DashboardOrdersByStatus;
}
