import { useState, useEffect } from "react";
import { Trash2, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  useInquiries,
  useDeleteInquiry,
  useUpdateInquiryStatus,
  type Inquiry,
  INQUIRIES_PAGE_SIZE,
} from "@/hooks/useInquiries";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { getInquiryContactDisplay } from "@/types/inquiry.type";
import { toast } from "react-hot-toast";
import useDebounce from "@/hooks/useDebounce";

type InquiryTypeFilter =
  | "general"
  | "contact"
  | "product"
  | "guest_enquiry"
  | "all";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
};

export default function Inquiries() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<InquiryTypeFilter>("all");
  const [offset, setOffset] = useState(0);
  const [accumulated, setAccumulated] = useState<Inquiry[]>([]);

  const { data, isLoading, error } = useInquiries({
    offset,
    limit: INQUIRIES_PAGE_SIZE,
    type: typeFilter !== "all" ? typeFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    search: debouncedSearchTerm || undefined,
  });

  const resetFilters = () => {
    setOffset(0);
    setAccumulated([]);
  };

  // Reset list when filters change (debounced search updates asynchronously)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset offset/accumulated when filters change
    resetFilters();
  }, [typeFilter, statusFilter, debouncedSearchTerm]);

  // Sync query result into accumulated list (replace first page, append next pages)
  useEffect(() => {
    if (!data?.data) return;
    if (offset === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync async query pages to local list
      setAccumulated(data.data);
    } else {
      setAccumulated((prev) => [...prev, ...data.data]);
    }
  }, [data?.data, offset]);

  const hasMore = data?.meta?.hasMore ?? false;
  const isLoadingMore = offset > 0 && isLoading;

  const { triggerRef, isLoadingMore: isScrollLoading, hasMoreItems } =
    useInfiniteScroll({
      onLoadMore: () => setOffset((o) => o + INQUIRIES_PAGE_SIZE),
      hasMore,
      isLoading: isLoadingMore,
    });

  const { mutate: deleteInquiry, isPending: isDeleting } = useDeleteInquiry();
  const { mutate: updateStatus, isPending: isUpdating } =
    useUpdateInquiryStatus();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this inquiry?")) {
      setDeletingId(id);
      deleteInquiry(id, {
        onSuccess: () => {
          toast.success("Inquiry deleted successfully");
          setDeletingId(null);
        },
        onError: (error: any) => {
          toast.error(
            error.response?.data?.error || "Failed to delete inquiry",
          );
          setDeletingId(null);
        },
      });
    }
  };

  const handleStatusChange = (id: string, newStatus: string) => {
    updateStatus(
      { id, status: newStatus },
      {
        onSuccess: () => {
          toast.success("Status updated successfully");
        },
        onError: (error: any) => {
          toast.error(error.response?.data?.error || "Failed to update status");
        },
      },
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (error) {
    return (
      <div className="flex items-center h-64">
        <p className="text-destructive">Failed to load inquiries</p>
      </div>
    );
  }

  const inquiries: Inquiry[] = accumulated;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Inquiries</h1>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, phone, or message..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  resetFilters();
                }}
                className="pl-10"
              />
            </div>
            <div className="relative w-full sm:w-[180px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  resetFilters();
                }}
                className="w-full pl-10 pr-4 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div className="relative w-full sm:w-[180px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value as InquiryTypeFilter);
                  resetFilters();
                }}
                className="w-full pl-10 pr-4 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Types</option>
                <option value="general">General</option>
                <option value="contact">Contact</option>
                <option value="product">Product</option>
                <option value="guest_enquiry">Guest Enquiry</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inquiries List */}
      {isLoading && (
        <div className="flex items-center h-64">
          <p>Loading...</p>
        </div>
      )}
      {inquiries.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-muted-foreground">No inquiries found</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {inquiries.map((inquiry: Inquiry) => {
              const contact = getInquiryContactDisplay(inquiry);
              return (
                <Card
                  key={inquiry.id}
                  className="hover:shadow-md transition-shadow border-border/70"
                >
                  <CardHeader className="pb-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <select
                            value={inquiry.status}
                            onChange={(e) =>
                              handleStatusChange(inquiry.id, e.target.value)
                            }
                            disabled={isUpdating}
                            className={`h-7 min-w-[120px] px-2.5 rounded-full text-xs font-medium border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                              statusColors[inquiry.status] ||
                              statusColors.pending
                            }`}
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </select>
                          <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground capitalize">
                            {inquiry.type.replace("_", " ")}
                          </span>
                          {inquiry.product && (
                            <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                              {inquiry.product.name}
                            </span>
                          )}
                        </div>
                        <CardTitle className="text-lg mb-1 truncate">
                          {contact.name}
                        </CardTitle>
                        <div className="mt-1 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                          <p className="truncate">
                            <span className="font-medium text-foreground">
                              Email:
                            </span>{" "}
                            {contact.email}
                          </p>
                          <p className="truncate">
                            <span className="font-medium text-foreground">
                              Phone:
                            </span>{" "}
                            {contact.phone}
                          </p>
                          {inquiry.meta_data?.quantity != null && (
                            <p>
                              <span className="font-medium text-foreground">
                                Quantity:
                              </span>{" "}
                              {inquiry.meta_data.quantity}
                            </p>
                          )}
                          {inquiry.product && (
                            <p>
                              <span className="font-medium text-foreground">
                                Price:
                              </span>{" "}
                              ₹
                              {Number(
                                inquiry.product.sale_price_in_rupee,
                              ).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-start justify-between gap-2 sm:flex-col sm:items-end sm:justify-start shrink-0">
                        <p className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(inquiry.created_at)}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(inquiry.id)}
                          disabled={isDeleting && deletingId === inquiry.id}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <div className="rounded-md bg-muted/40 px-3 py-2">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Message
                      </p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">
                        {inquiry.message}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Infinite scroll trigger and loading */}
          {hasMoreItems && <div ref={triggerRef} className="h-4" />}
          {isScrollLoading && (
            <div className="py-4 text-sm text-muted-foreground">
              Loading more...
            </div>
          )}
        </>
      )}
    </div>
  );
}
