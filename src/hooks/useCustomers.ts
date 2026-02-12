import { useQuery } from '@tanstack/react-query';
import { listCustomers, getCustomer } from '@/services/api/customer';
import type { CustomersResponse, CustomerWithCart } from '@/types/customer.type';

export const keys = {
  all: ['customers'] as const,
  lists: () => [...keys.all, 'list'] as const,
  list: (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) => [...keys.lists(), params] as const,
  details: () => [...keys.all, 'detail'] as const,
  detail: (id: string) => [...keys.details(), id] as const,
};

// Fetch all customers
export function useCustomers(params?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  return useQuery<CustomersResponse>({
    queryKey: keys.list(params),
    queryFn: async (): Promise<CustomersResponse> => {
      const response = await listCustomers(params);
      return response as unknown as CustomersResponse;
    },
  });
}

// Get single customer by ID
export function useCustomer(id: string) {
  return useQuery<CustomerWithCart>({
    queryKey: keys.detail(id),
    queryFn: async (): Promise<CustomerWithCart> => {
      const response = await getCustomer(id);
      return response as unknown as CustomerWithCart;
    },
    enabled: !!id,
  });
}