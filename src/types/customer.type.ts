export interface Customer {
    id: string;
    first_name: string;
    last_name: string;
    full_name: string;
    email: string;
    phone_number: string;
    is_email_verified: boolean;
    is_phone_number_verified: boolean;
    created_at: string;
    updated_at?: string;
}

export interface CartItem {
    id: string;
    product_id: string;
    quantity: number;
    product_name: string;
    sale_price_in_paisa: number;
    sale_price_in_rupee: number;
    description?: string;
    primary_image?: {
      id: string;
      key: string;
      url: string;
    };
  }
  
  export interface Cart {
    id: string;
    items: CartItem[];
    items_count: number;
    total_in_paisa: number;
    total_in_rupee: number;
    created_at: string;
    updated_at?: string;
  }
  
  export interface CustomerWithCart {
    customer: Customer;
    cart?: Cart;
  }
  
  export interface CustomersResponse {
    customers: Customer[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
    };
  }