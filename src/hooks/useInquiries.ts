import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  listInquiries,
  getInquiry,
  updateInquiryStatus,
  deleteInquiry,
} from "@/services/api/inquiry";
import type { Inquiry, InquiriesResponse } from "@/types/inquiry.type";

export type { Inquiry, InquiriesResponse };

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
  type?: "general" | "contact" | "product" | "guest_enquiry";
  status?: string;
  search?: string;
}) {
  return useQuery<InquiriesResponse>({
    queryKey: ["inquiries", params],
    queryFn: async (): Promise<InquiriesResponse> => {
      const response = await listInquiries(params);
      return response as InquiriesResponse;
    },
  });
}

// Get single inquiry by ID
export function useInquiry(id: string) {
  return useQuery<{ data: Inquiry }>({
    queryKey: ["inquiry", id],
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
      queryClient.setQueryData(["inquiry", variables.id], data);
      queryClient.invalidateQueries({ queryKey: ["inquiries"] });
      toast.success("Inquiry status updated successfully");
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
      queryClient.removeQueries({ queryKey: ["inquiry", id] });
      queryClient.invalidateQueries({ queryKey: ["inquiries"] });
      toast.success("Inquiry deleted successfully");
    },
  });
}

