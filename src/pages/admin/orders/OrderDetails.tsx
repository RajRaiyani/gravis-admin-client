import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useMarkOrderAsPaid,
  useOrder,
  useUpdateOrderStatus,
} from "@/hooks/useOrders";
import type { OrderStatus } from "@/types/order.type";

const ORDER_STATUS_OPTIONS: OrderStatus[] = [
  "pending",
  "processing",
  "out_for_delivery",
  "delivered",
  "complete",
  "cancel",
];

const ORDER_STATUS_FLOW: Array<{ value: OrderStatus; label: string }> = [
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "out_for_delivery", label: "Out for delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "complete", label: "Complete" },
];

export default function OrderDetails() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useOrder(id || "");
  const { mutate: updateOrderStatus, isPending: isUpdating } =
    useUpdateOrderStatus();
  const { mutate: markOrderAsPaid, isPending: isMarkingPaid } =
    useMarkOrderAsPaid();
  const [showMarkPaidConfirm, setShowMarkPaidConfirm] = useState(false);
  const order = data?.order;
  const activeStatusIndex = ORDER_STATUS_FLOW.findIndex(
    (statusStep) => statusStep.value === order?.status
  );
  const isCancelled = order?.status === "cancel";

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatRupee = (paisa: number) =>
    `Rs ${(Number(paisa || 0) / 100).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const getFieldValue = (source: Record<string, unknown> | undefined, key: string) => {
    const value = source?.[key];
    if (typeof value !== "string") return "-";
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : "-";
  };

  const formatAddress = (address: Record<string, unknown> | undefined) => {
    if (!address) return "-";
    const parts = [
      getFieldValue(address, "address"),
      getFieldValue(address, "city"),
      getFieldValue(address, "state_name"),
      getFieldValue(address, "postal_code"),
    ].filter((value) => value !== "-");
    return parts.length ? parts.join(", ") : "-";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Loading...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <p className="text-destructive">Order not found</p>
          <Link to="/orders">
            <Button variant="outline">Back to Orders</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/orders">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Order {order.serial}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-muted-foreground">Customer</p>
              <p className="font-medium">{order.customer_name}</p>
              <p className="text-muted-foreground">{order.customer_email}</p>
              {order.customer_phone_number && (
                <p className="text-muted-foreground">{order.customer_phone_number}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground">Total</p>
                <p className="font-semibold">{formatRupee(order.total_amount_in_paisa)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Paid</p>
                <p className="font-semibold">{formatRupee(order.paid_amount_in_paisa)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <p className="text-muted-foreground">Payment</p>
              <Badge className="capitalize" variant="secondary">
                {order.payment_status.replace("_", " ")}
              </Badge>
            </div>
            {order.payment_status === "partially_paid" && (
              <div className="rounded-md border p-3 space-y-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Mark as fully paid</p>
                  <p className="text-xs text-muted-foreground">
                    This action is irreversible and sets is_paid to true.
                  </p>
                </div>
                {order.is_paid ? (
                  <Badge variant="secondary">Already marked as paid</Badge>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isMarkingPaid}
                    onClick={() => {
                      setShowMarkPaidConfirm(true);
                    }}
                  >
                    Mark as paid
                  </Button>
                )}
              </div>
            )}

            <div>
              <p className="text-muted-foreground mb-2">Order Status</p>
              <Select
                value={order.status}
                onValueChange={(value) =>
                  updateOrderStatus({
                    id: order.id,
                    status: value as OrderStatus,
                  })
                }
                disabled={isUpdating}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select order status" />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status} className="capitalize">
                      {status.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <p className="text-muted-foreground mb-2">Order Timeline</p>
              {isCancelled ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  Order cancelled
                </div>
              ) : (
                <div className="rounded-md border p-3">
                  <div className="grid grid-cols-5 items-start gap-0">
                    {ORDER_STATUS_FLOW.map((step, index) => {
                      const isCompleted = activeStatusIndex >= index;
                      const isCurrent = activeStatusIndex === index;
                      return (
                        <div key={step.value} className="relative flex flex-col items-center">
                          {index < ORDER_STATUS_FLOW.length - 1 && (
                            <div
                              className={`absolute top-[8px] left-1/2 right-[-50%] h-[2px] ${
                                activeStatusIndex > index
                                  ? "bg-primary"
                                  : "bg-muted-foreground/20"
                              }`}
                            />
                          )}
                          <div className="relative z-10 flex flex-col items-center">
                            <div className="relative h-4 w-4">
                              {isCurrent && (
                                <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
                              )}
                              <div
                                className={`relative h-4 w-4 rounded-full border-2 ring-2 ring-background ${
                                  isCompleted
                                    ? "bg-primary border-primary"
                                    : "bg-background border-muted-foreground/40"
                                }`}
                              />
                            </div>
                            <span
                              className={`mt-2 text-[11px] leading-none text-center whitespace-nowrap ${
                                isCurrent
                                  ? "text-foreground font-medium"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-5 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">Order ID</p>
              <p className="font-mono break-all text-xs sm:text-sm">{order.id}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Created At</p>
              <p className="font-medium">{formatDate(order.created_at)}</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="rounded-md border bg-muted/20 p-3 space-y-1">
                <p className="text-muted-foreground text-xs uppercase tracking-wide">
                  Billing Address
                </p>
                <p className="leading-relaxed">{formatAddress(order.billing_address)}</p>
              </div>
              <div className="rounded-md border bg-muted/20 p-3 space-y-1">
                <p className="text-muted-foreground text-xs uppercase tracking-wide">
                  Shipping Address
                </p>
                <p className="leading-relaxed">{formatAddress(order.shipping_address)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-md border p-3">
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs uppercase tracking-wide">
                  Organization
                </p>
                <p className="font-medium">
                  {getFieldValue(order.billing_details, "organization_name")}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs uppercase tracking-wide">GST</p>
                <p className="font-medium">
                  {getFieldValue(order.billing_details, "gst_number")}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs uppercase tracking-wide">PAN</p>
                <p className="font-medium">
                  {getFieldValue(order.billing_details, "pan_number")}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order Items ({order.items.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {item.primary_image?.url ? (
                        <img
                          src={item.primary_image.url}
                          alt={item.product_name}
                          className="w-12 h-12 rounded object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded" />
                      )}
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{formatRupee(item.price_in_paisa)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatRupee(item.price_in_paisa * item.quantity)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      </div>

      {showMarkPaidConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-background border shadow-xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
              <div className="space-y-1">
                <h2 className="text-base font-semibold">Mark as fully paid?</h2>
                <p className="text-sm text-muted-foreground">
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isMarkingPaid}
                onClick={() => {
                  setShowMarkPaidConfirm(false);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={isMarkingPaid}
                onClick={() => {
                  markOrderAsPaid(
                    { id: order.id },
                    {
                      onSuccess: () => {
                        setShowMarkPaidConfirm(false);
                      },
                    }
                  );
                }}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

