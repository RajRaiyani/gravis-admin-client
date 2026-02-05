import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ShoppingCart, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCustomer } from "@/hooks/useCustomers";

export default function CustomerDetails() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useCustomer(id || "");

  const customer = data?.customer;
  const cart = data?.cart;
  const cartItems = cart?.items || [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price: number) => {
    return `₹${Number(price).toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Loading...</p>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <p className="text-destructive">Customer not found</p>
          <Link to="/customers">
            <Button variant="outline">Back to Customers</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/customers">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Customer Details</h1>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Full Name
              </p>
              <p className="text-base">{customer.full_name}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  First Name
                </p>
                <p className="text-base">{customer.first_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Last Name
                </p>
                <p className="text-base">{customer.last_name}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Email
              </p>
              <div className="flex items-center gap-2">
                <p className="text-base">{customer.email}</p>
                {customer.is_email_verified ? (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    Not Verified
                  </Badge>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Phone
              </p>
              <div className="flex items-center gap-2">
                <p className="text-base">{customer.phone_number}</p>
                {customer.is_phone_number_verified ? (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    Not Verified
                  </Badge>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Joined Date
              </p>
              <p className="text-base">{formatDate(customer.created_at)}</p>
            </div>
            {customer.updated_at && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Last Updated
                </p>
                <p className="text-base">{formatDate(customer.updated_at)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cart Summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Cart Summary
              </CardTitle>
              <span className="text-sm text-muted-foreground">
                {cart?.items_count || 0}{" "}
                {cart?.items_count === 1 ? "item" : "items"}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {!cart || cartItems.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Cart is empty</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  {cartItems.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-2 border rounded-md"
                    >
                      {item.primary_image?.url ? (
                        <img
                          src={item.primary_image.url}
                          alt={item.product_name}
                          className="w-16 h-16 object-cover rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">
                            No image
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {item.product_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">
                          {formatPrice(item.sale_price_in_rupee * item.quantity)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatPrice(item.sale_price_in_rupee)} each
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {cartItems.length > 3 && (
                  <p className="text-sm text-muted-foreground text-center">
                    and {cartItems.length - 3} more{" "}
                    {cartItems.length - 3 === 1 ? "item" : "items"}
                  </p>
                )}
                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>{formatPrice(cart.total_in_rupee)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total:</span>
                    <span className="text-xl font-bold">
                      {formatPrice(cart.total_in_rupee)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Last updated: {formatDate(cart.updated_at || cart.created_at)}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Full Cart Details Table */}
      {cart && cartItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cart Items</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-center">Quantity</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cartItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.primary_image?.url ? (
                        <img
                          src={item.primary_image.url}
                          alt={item.product_name}
                          className="w-16 h-16 object-cover rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">
                            No image
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.product_name}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.description || "No description"}
                      </p>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPrice(item.sale_price_in_rupee)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{item.quantity}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatPrice(item.sale_price_in_rupee * item.quantity)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={5} className="text-right font-bold">
                    Grand Total:
                  </TableCell>
                  <TableCell className="text-right font-bold text-lg">
                    {formatPrice(cart.total_in_rupee)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}