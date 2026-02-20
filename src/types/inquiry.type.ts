export type InquiryStatus =
  | "pending"
  | "in_progress"
  | "resolved"
  | "closed";

export type InquiryType =
  | "general"
  | "contact"
  | "product"
  | "guest_enquiry";

export interface InquiryMetaData {
  name?: string;
  email?: string;
  phone_number?: string;
  quantity?: number;
  [key: string]: unknown;
}

export interface GuestContact {
  name: string;
  email: string;
  phone_number: string;
}

export interface InquiryProduct {
  id: string;
  name: string;
  sale_price_in_rupee: number;
}

export interface Inquiry {
  id: string;
  type: InquiryType;
  message: string;
  product_id?: string;
  status: InquiryStatus;
  meta_data?: InquiryMetaData;
  created_at: string;
  updated_at: string | null;
  customer: Record<string, unknown> | null;
  guest_contact?: GuestContact | null;
  product?: InquiryProduct | null;
}

/** Display helpers: prefer guest_contact, fallback to meta_data for name/email/phone */
export function getInquiryContactDisplay(inquiry: Inquiry) {
  const name =
    inquiry.guest_contact?.name ??
    inquiry.meta_data?.name ??
    (inquiry.customer as { full_name?: string } | null)?.full_name ??
    "—";
  const email =
    inquiry.guest_contact?.email ??
    inquiry.meta_data?.email ??
    (inquiry.customer as { email?: string } | null)?.email ??
    "—";
  const phone =
    inquiry.guest_contact?.phone_number ??
    inquiry.meta_data?.phone_number ??
    (inquiry.customer as { phone_number?: string } | null)?.phone_number ??
    "—";
  return { name, email, phone };
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
