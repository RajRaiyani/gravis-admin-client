import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Package,
  Tags,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardStats } from "@/hooks/useDashboard";

const inquiryStatusConfig = [
  { key: "pending" as const, label: "Pending", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  { key: "in_progress" as const, label: "In Progress", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  { key: "resolved" as const, label: "Resolved", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  { key: "closed" as const, label: "Closed", color: "bg-muted text-muted-foreground" },
];

const statCards = [
  {
    title: "Customers",
    valueKey: "customers" as const,
    icon: Users,
    href: "/customers",
    description: "Total registered customers",
  },
  {
    title: "Products",
    valueKey: "products" as const,
    icon: Package,
    href: "/products",
    description: "Products in catalog",
  },
  {
    title: "Product Categories",
    valueKey: "product_categories" as const,
    icon: Tags,
    href: "/product-categories",
    description: "Product categories",
  },
  {
    title: "Inquiries",
    valueKey: "inquiries" as const,
    icon: MessageSquare,
    href: "/inquiries",
    description: "Total inquiries",
  },
];

export default function Dashboard() {
  const { data, isLoading, error } = useDashboardStats();

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Failed to load dashboard data</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Loading...</p>
      </div>
    );
  }

  const stats = data ?? {
    customers: 0,
    products: 0,
    product_categories: 0,
    inquiries: 0,
    inquiries_by_status: { pending: 0, in_progress: 0, resolved: 0, closed: 0 },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <LayoutDashboard className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Overview of your store and inquiries
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ title, valueKey, icon: Icon, href, description }) => (
          <Link key={valueKey} to={href}>
            <Card className="hover:shadow-md transition-shadow h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {title}
                </CardTitle>
                <Icon className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats[valueKey]}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {description}
                </p>
                <p className="text-xs text-primary font-medium mt-2 flex items-center gap-1">
                  View <ArrowRight className="h-3 w-3" />
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Inquiries by status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Inquiries by status
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Breakdown of inquiry statuses.{" "}
            <Link to="/inquiries" className="text-primary font-medium hover:underline">
              Manage inquiries
            </Link>
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {inquiryStatusConfig.map(({ key, label, color }) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <span className="text-sm font-medium text-muted-foreground">
                  {label}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-sm font-medium ${color}`}
                >
                  {stats.inquiries_by_status[key]}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
