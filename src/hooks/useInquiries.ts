import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { listInquiries,getInquiry,updateInquiryStatus,deleteInquiry } from '@/services/api/inquiry';

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  message: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at?: string;
}

export interface InquiriesResponse {
  data: Inquiry[];
  meta?: {
    total: number;
    offset: number;
    limit: number;
    hasMore: boolean;
  };
}

interface ApiError {
  response?: {
    data?: {
      error?: string;
      details?: string | string[];
    };
    status?: number;
  };
  message?: string;
}

// Fetch all inquiries
export function useInquiries(params?: {
  offset?: number;
  limit?: number;
  status?: string;
  search?: string;
}) {
  return useQuery<InquiriesResponse>({
    queryKey: ['inquiries', params],
    queryFn: async (): Promise<InquiriesResponse> => {
      const response = await listInquiries(params);
      return response as InquiriesResponse;
    },
  });
}

// Get single inquiry by ID
export function useInquiry(id: string ) {
  return useQuery<{ data: Inquiry }>({
    queryKey: ['inquiry', id],
    queryFn: async (): Promise<{ data: Inquiry }> => {
      return await getInquiry(id);
    },
    enabled: !!id,
  });
}

// Update inquiry status
export function useUpdateInquiryStatus() {
  const queryClient = useQueryClient();

  return useMutation<{ data: Inquiry }, ApiError, { id: string; status: string }>({
    mutationFn: async ({ id, status }): Promise<{ data: Inquiry }> => {
      return await updateInquiryStatus(id, status);
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['inquiry', variables.id], data);
      queryClient.invalidateQueries({ queryKey: ['inquiries'] });
      toast.success('Inquiry status updated successfully');
    },
  });
}

// Delete inquiry
export function useDeleteInquiry() {
  const queryClient = useQueryClient();

  return useMutation<{ data: Inquiry }, ApiError, string>({
    mutationFn: async (id: string): Promise<{ data: Inquiry }> => {
      return await deleteInquiry(id);
    },
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: ['inquiry', id] });
      queryClient.invalidateQueries({ queryKey: ['inquiries'] });
      toast.success('Inquiry deleted successfully');
    },
  });
}

