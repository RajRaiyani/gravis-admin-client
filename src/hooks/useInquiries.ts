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

const INQUIRIES_PAGE_SIZE = 20;

/** Normalize list API response: supports raw array or { data, meta } */
function normalizeListResponse(
  raw: unknown,
  offset: number,
  limit: number
): InquiriesResponse {
  if (Array.isArray(raw)) {
    return {
      data: raw as Inquiry[],
      meta: {
        total: raw.length,
        offset,
        limit,
        hasMore: raw.length >= limit,
      },
    };
  }
  if (
    raw &&
    typeof raw === "object" &&
    "data" in raw &&
    Array.isArray((raw as InquiriesResponse).data)
  ) {
    return raw as InquiriesResponse;
  }
  return { data: [], meta: { total: 0, offset, limit, hasMore: false } };
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

export type InquiryListParams = {
  offset?: number;
  limit?: number;
  type?: "general" | "contact" | "product" | "guest_enquiry";
  status?: string;
  search?: string;
};

// Fetch inquiries (single page by offset) — use with useInfiniteScroll for infinite list
export function useInquiries(params?: InquiryListParams) {
  return useQuery<InquiriesResponse>({
    queryKey: ["inquiries", params],
    queryFn: async (): Promise<InquiriesResponse> => {
      const response = await listInquiries(params);
      const offset = params?.offset ?? 0;
      const limit = params?.limit ?? INQUIRIES_PAGE_SIZE;
      return normalizeListResponse(response, offset, limit);
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

export { INQUIRIES_PAGE_SIZE };

