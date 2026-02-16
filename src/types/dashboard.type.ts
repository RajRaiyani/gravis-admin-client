export interface DashboardInquiriesByStatus {
  pending: number;
  in_progress: number;
  resolved: number;
  closed: number;
}

export interface DashboardStats {
  customers: number;
  products: number;
  product_categories: number;
  inquiries: number;
  inquiries_by_status: DashboardInquiriesByStatus;
}
