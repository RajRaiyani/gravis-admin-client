import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useInquiry,
  useDeleteInquiry,
  useUpdateInquiryStatus,
} from "@/hooks/useInquiries";
import { getInquiryContactDisplay } from "@/types/inquiry.type";
import { toast } from "react-hot-toast";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
};

export default function InquiryDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useInquiry(id || "");
  const { mutate: deleteInquiry, isPending: isDeleting } = useDeleteInquiry();
  const { mutate: updateStatus, isPending: isUpdating } =
    useUpdateInquiryStatus();

  const inquiry = data?.data;

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this inquiry?")) {
      deleteInquiry(id || "", {
        onSuccess: () => {
          toast.success("Inquiry deleted successfully");
          navigate("/inquiries");
        },
        onError: (err: { response?: { data?: { error?: string } } }) => {
          toast.error(
            err.response?.data?.error || "Failed to delete inquiry"
          );
        },
      });
    }
  };

  const handleStatusChange = (newStatus: string) => {
    if (!id) return;
    updateStatus(
      { id, status: newStatus },
      {
        onSuccess: () => {
          toast.success("Status updated successfully");
        },
        onError: (err: { response?: { data?: { error?: string } } }) => {
          toast.error(err.response?.data?.error || "Failed to update status");
        },
      }
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Loading...</p>
      </div>
    );
  }

  if (error || !inquiry) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Inquiry not found</p>
        <Link to="/inquiries">
          <Button variant="outline" className="ml-4">
            Back to Inquiries
          </Button>
        </Link>
      </div>
    );
  }

  const contact = getInquiryContactDisplay(inquiry);
  const hasMetaData =
    inquiry.meta_data &&
    Object.keys(inquiry.meta_data).length > 0 &&
    Object.values(inquiry.meta_data).some(
      (v) => v !== undefined && v !== null && v !== ""
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/inquiries">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Inquiry Details</h1>
        </div>
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">
                Name
              </p>
              <p className="text-base">{contact.name}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">
                Email
              </p>
              <p className="text-base break-all">{contact.email}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">
                Phone
              </p>
              <p className="text-base">{contact.phone}</p>
            </div>
            {inquiry.guest_contact && (
              <p className="text-xs text-muted-foreground pt-2 border-t">
                Source: guest_contact
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status & Dates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
                Status
              </p>
              <select
                value={inquiry.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={isUpdating}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">
                Type
              </p>
              <p className="text-base capitalize">
                {inquiry.type.replace("_", " ")}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">
                Created At
              </p>
              <p className="text-base">{formatDate(inquiry.created_at)}</p>
            </div>
            {inquiry.updated_at && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  Updated At
                </p>
                <p className="text-base">{formatDate(inquiry.updated_at)}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Message</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-base whitespace-pre-wrap">{inquiry.message}</p>
        </CardContent>
      </Card>

      {inquiry.product && (
        <Card>
          <CardHeader>
            <CardTitle>Product</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">
                Name
              </p>
              <p className="text-base">{inquiry.product.name}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">
                Price (₹)
              </p>
              <p className="text-base">
                ₹
                {Number(inquiry.product.sale_price_in_rupee).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">
                Product ID
              </p>
              <p className="text-sm font-mono break-all">{inquiry.product.id}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {hasMetaData && inquiry.meta_data && (
        <Card>
          <CardHeader>
            <CardTitle>Meta Data</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(inquiry.meta_data).map(
                ([key, value]) =>
                  value !== undefined &&
                  value !== null &&
                  value !== "" && (
                    <div key={key}>
                      <dt className="text-xs font-medium text-muted-foreground uppercase">
                        {key.replace(/_/g, " ")}
                      </dt>
                      <dd className="text-sm mt-0.5">
                        {typeof value === "object"
                          ? JSON.stringify(value)
                          : String(value)}
                      </dd>
                    </div>
                  )
              )}
            </dl>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase">
              Inquiry ID
            </p>
            <p className="text-sm font-mono break-all">{inquiry.id}</p>
          </div>
          {inquiry.product_id && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">
                Product ID
              </p>
              <p className="text-sm font-mono break-all">
                {inquiry.product_id}
              </p>
            </div>
          )}
          {inquiry.customer != null && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">
                Customer
              </p>
              <pre className="text-xs font-mono bg-muted p-3 rounded-md overflow-auto max-h-40">
                {JSON.stringify(inquiry.customer, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
