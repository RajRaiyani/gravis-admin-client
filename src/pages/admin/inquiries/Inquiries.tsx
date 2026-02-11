import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Trash2, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  useInquiries,
  useDeleteInquiry,
  useUpdateInquiryStatus,
  type Inquiry,
} from "@/hooks/useInquiries";
import { toast } from "react-hot-toast";
import useDebounce from "@/hooks/useDebounce";

type InquiryTypeFilter = "general" | "contact" | "product" | "all";

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
  const limit = 20;

  const { data, isLoading, error } = useInquiries({
    offset,
    limit,
    type: typeFilter !== "all" ? typeFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    search: debouncedSearchTerm || undefined,
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
            error.response?.data?.error || "Failed to delete inquiry"
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
      }
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
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Failed to load inquiries</p>
      </div>
    );
  }

  const inquiries: Inquiry[] = data?.data || [];
  const meta = data?.meta;
  const total = meta?.total || inquiries.length;
  const hasMore = meta?.hasMore || false;

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
                  setOffset(0);
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
                  setOffset(0);
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
                  setOffset(0);
                }}
                className="w-full pl-10 pr-4 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Types</option>
                <option value="general">General</option>
                <option value="contact">Contact</option>
                <option value="product">Product</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inquiries List */}
      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <p>Loading...</p>
        </div>
      )}
      {inquiries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No inquiries found</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {inquiries.map((inquiry: Inquiry) => (
              <Card
                key={inquiry.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-lg">
                          {inquiry.name}
                        </CardTitle>
                        <span
                          className={`px-2 py-1 -mx-4 rounded-full text-xs font-medium ${
                            statusColors[inquiry.status] || statusColors.pending
                          }`}
                        >
                          {inquiry.status.replace("_", " ").toUpperCase()}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>
                          <strong>Email:</strong> {inquiry.email}
                        </p>
                        <p>
                          <strong>Phone:</strong> {inquiry.phone_number}
                        </p>
                        <p>
                          <strong>Date:</strong>{" "}
                          {formatDate(inquiry.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {/* <Link to={`/inquiries/${inquiry.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link> */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(inquiry.id)}
                        disabled={isDeleting && deletingId === inquiry.id}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-1">Message:</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">
                        {inquiry.message}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Status:</span>
                      <select
                        value={inquiry.status}
                        onChange={(e) =>
                          handleStatusChange(inquiry.id, e.target.value)
                        }
                        disabled={isUpdating}
                        className="w-[150px] h-8 px-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {(hasMore || offset > 0) && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {offset + 1} to {Math.min(offset + limit, total)} of{" "}
                {total} inquiries
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={offset === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setOffset(offset + limit)}
                  disabled={!hasMore}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
