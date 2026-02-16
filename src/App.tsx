import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import Login from "@/pages/auth/Login";
import AdminLayout from "@/components/layouts/Adminlayout";
import Dashboard from "@/pages/admin/Dashboard";
import ProductCategories from "@/pages/admin/product-categories/ProductCategories";
import AddOrUpdateProductCategory from "@/pages/admin/product-categories/AddOrUpdateProductCategory";
import Products from "@/pages/admin/products/Products";
import AddOrUpdateProduct from "@/pages/admin/products/AddOrUpdateProduct";
import ProductDetails from "@/pages/admin/products/ProductDetails";
import Inquiries from "@/pages/admin/inquiries/Inquiries";
import InquiryDetails from "@/pages/admin/inquiries/InquiryDetails";
import Customers from "@/pages/admin/customers/Customers";
import CustomerDetails from "@/pages/admin/customers/CustomerDetails"; // Add this import
import { Toaster } from "react-hot-toast";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
    },
  },
});

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />

          {/* Product Categories Routes */}
          <Route path="product-categories" element={<ProductCategories />} />
          <Route
            path="product-categories/create"
            element={<AddOrUpdateProductCategory />}
          />
          <Route
            path="product-categories/:id/edit"
            element={<AddOrUpdateProductCategory />}
          />

          {/* Products Routes */}
          <Route path="products" element={<Products />} />
          <Route path="products/create" element={<AddOrUpdateProduct />} />
          <Route path="products/:id" element={<ProductDetails />} />
          <Route path="products/:id/edit" element={<AddOrUpdateProduct />} />

          {/* Inquiries Routes */}
          <Route path="inquiries" element={<Inquiries />} />
          <Route path="inquiries/:id" element={<InquiryDetails />} />

          {/* Customers Routes */}
          <Route path="customers" element={<Customers />} />
          <Route path="customers/:id" element={<CustomerDetails />} /> {/* Add this line */}

          {/* Other Routes */}
          <Route path="orders" element={<h1>Orders</h1>} />
          <Route path="categories" element={<h1>Categories</h1>} />
          <Route path="analytics" element={<h1>Analytics</h1>} />
          <Route path="settings" element={<h1>Settings</h1>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Toaster />
          <AppRoutes />
        </AuthProvider>
      </QueryClientProvider>
    </>
  );
}

export default App;