import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useInquiry,
  useDeleteInquiry,
  useUpdateInquiryStatus,
} from "@/hooks/useInquiries";
import { toast } from "react-hot-toast";

// const statusColors = {
//   pending: "bg-yellow-100 text-yellow-800",
//   in_progress: "bg-blue-100 text-blue-800",
//   resolved: "bg-green-100 text-green-800",
//   closed: "bg-gray-100 text-gray-800",
// };

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
        onError: (error: any) => {
          toast.error(
            error.response?.data?.error || "Failed to delete inquiry"
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
        onError: (error: any) => {
          toast.error(error.response?.data?.error || "Failed to update status");
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

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="text-base">{inquiry.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-base">{inquiry.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Phone</p>
              <p className="text-base">{inquiry.phone_number}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status & Dates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
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
              <p className="text-sm font-medium text-muted-foreground">
                Created At
              </p>
              <p className="text-base">{formatDate(inquiry.created_at)}</p>
            </div>
            {inquiry.updated_at && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
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
    </div>
  );
}
