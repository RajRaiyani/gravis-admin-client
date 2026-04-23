import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  Loader2,
  Search,
  ShoppingCart,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/multi-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import useDebounce from "@/hooks/useDebounce";
import { useOrdersInfinite } from "@/hooks/useOrders";
import {
  DEFAULT_ADMIN_PAYMENT_STATUSES,
  type OrderListItem,
  type OrderPaymentStatus,
} from "@/types/order.type";

export default function Orders() {
  type SortBy =
    | "created_at"
    | "serial_number"
    | "total_amount_in_paisa"
    | "total_item_count";
  type SortOrder = "asc" | "desc";

  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const limit = 20;
  const [status, setStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortBy>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [paymentStatuses, setPaymentStatuses] = useState<OrderPaymentStatus[]>(
    DEFAULT_ADMIN_PAYMENT_STATUSES
  );

  const paymentOptions = [
    { label: "Pending", value: "pending" },
    { label: "Paid", value: "paid" },
    { label: "Partially Paid", value: "partially_paid" },
    { label: "Failed", value: "failed" },
  ] as const;

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useOrdersInfinite({
      limit,
      search: debouncedSearchTerm || undefined,
      status: status !== "all" ? status : undefined,
      payment_statuses: paymentStatuses.length ? paymentStatuses : undefined,
      sort_by: sortBy,
      sort_order: sortOrder,
    });
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const orders: OrderListItem[] = useMemo(
    () => (data?.pages ?? []).flatMap((pageData) => pageData?.orders ?? []),
    [data?.pages]
  );
  const totalLoaded = orders.length;

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: "120px",
      threshold: 0,
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, [handleIntersect]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatRupee = (paisa: number) =>
    `Rs ${(Number(paisa || 0) / 100).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const getPaymentBadgeClassName = (paymentStatus: OrderListItem["payment_status"]) => {
    if (paymentStatus === "paid") {
      return "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100";
    }
    if (paymentStatus === "partially_paid") {
      return "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100";
    }
    if (paymentStatus === "pending") {
      return "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100";
    }
    return "bg-red-100 text-red-800 border-red-200 hover:bg-red-100";
  };

  const handleSort = (column: SortBy) => {
    if (sortBy === column) {
      setSortOrder((previous) => (previous === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(column);
    setSortOrder("asc");
  };

  const getSortIcon = (column: SortBy) => {
    if (sortBy !== column) {
      return <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />;
    }

    return sortOrder === "asc" ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Failed to load orders</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Orders</h1>
            <p className="text-sm text-muted-foreground">Manage customer orders</p>
          </div>
        </div>
        {totalLoaded > 0 && (
          <Badge variant="secondary" className="text-sm px-3 py-1">
            {totalLoaded} loaded
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 md:-translate-y-6 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order serial, customer, email, phone..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                }}
                className="pl-10"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Order status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Order Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="out_for_delivery">Out for delivery</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
                <SelectItem value="cancel">Cancel</SelectItem>
              </SelectContent>
            </Select>
            <MultiSelect
              options={paymentOptions.map((option) => ({
                label: option.label,
                value: option.value,
              }))}
              value={paymentStatuses}
              onChange={(nextValues) =>
                setPaymentStatuses(nextValues as OrderPaymentStatus[])
              }
              placeholder="Payment status"
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <p>Loading...</p>
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No orders found</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 -ml-2 font-medium"
                        onClick={() => handleSort("serial_number")}
                      >
                        Order
                        {getSortIcon("serial_number")}
                      </Button>
                    </TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 -ml-2 font-medium"
                        onClick={() => handleSort("total_item_count")}
                      >
                        Items
                        {getSortIcon("total_item_count")}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 -ml-2 font-medium"
                        onClick={() => handleSort("total_amount_in_paisa")}
                      >
                        Total
                        {getSortIcon("total_amount_in_paisa")}
                      </Button>
                    </TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 -ml-2 font-medium"
                        onClick={() => handleSort("created_at")}
                      >
                        Created
                        {getSortIcon("created_at")}
                      </Button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow
                      key={order.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      <TableCell className="font-medium">{order.serial}</TableCell>
                      <TableCell>
                        <div className="min-w-[200px]">
                          <p className="font-medium">{order.customer_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {order.customer_email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{order.total_item_count}</TableCell>
                      <TableCell>{formatRupee(order.total_amount_in_paisa)}</TableCell>
                      <TableCell>{formatRupee(order.paid_amount_in_paisa)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {order.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getPaymentBadgeClassName(order.payment_status)}
                        >
                          {order.payment_status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(order.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div
            ref={loadMoreRef}
            className="flex items-center justify-center py-6 text-sm text-muted-foreground"
          >
            {isFetchingNextPage ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading more orders...
              </span>
            ) : hasNextPage ? (
              "Scroll down to load more"
            ) : (
              "All matching orders loaded"
            )}
          </div>
        </>
      )}
    </div>
  );
}

