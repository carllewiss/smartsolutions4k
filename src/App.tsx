import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NewInvoice from "./pages/NewInvoice";
import Invoices from "./pages/Invoices";
import Customers from "./pages/Customers";
import CustomerQuery from "./pages/CustomerQuery";
import Inventory from "./pages/Inventory";
import StockQuery from "./pages/StockQuery";
import Purchases from "./pages/Purchases";
import Finance from "./pages/Finance";
import UserManagement from "./pages/UserManagement";
import Settings from "./pages/Settings";
import EtimsSyncQueue from "./pages/EtimsSyncQueue";
import NotFound from "./pages/NotFound";

// Public shop
import ShopHome from "./pages/shop/ShopHome";
import ShopCatalog from "./pages/shop/ShopCatalog";
import ShopProductDetail from "./pages/shop/ShopProductDetail";
import ShopCart from "./pages/shop/ShopCart";
import ShopCheckout from "./pages/shop/ShopCheckout";
import ShopOrderSuccess from "./pages/shop/ShopOrderSuccess";
import ShopServices from "./pages/shop/ShopServices";
import ShopBlog from "./pages/shop/ShopBlog";
import ShopBlogPost from "./pages/shop/ShopBlogPost";
import ShopAbout from "./pages/shop/ShopAbout";
import ShopContact from "./pages/shop/ShopContact";
import ShopSignIn from "./pages/shop/ShopSignIn";
import ShopSignUp from "./pages/shop/ShopSignUp";
import ShopAccount from "./pages/shop/ShopAccount";
import ShopOrders from "./pages/shop/ShopOrders";

// Admin extras
import AdminShopOrders from "./pages/admin/AdminShopOrders";
import AdminInquiries from "./pages/admin/AdminInquiries";
import AdminBlog from "./pages/admin/AdminBlog";
import AdminBlogEditor from "./pages/admin/AdminBlogEditor";

const queryClient = new QueryClient();

const SHOP_PATHS = ["/shop", "/services", "/blog", "/about", "/contact"];

function isShopPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return SHOP_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/erp" replace />;

  return <>{children}</>;
}

function ErpShell() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/invoices/new" element={<NewInvoice />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/customers/:customerId" element={<CustomerQuery />} />
          <Route path="/inventory" element={<ProtectedRoute adminOnly><Inventory /></ProtectedRoute>} />
          <Route path="/inventory/:productId" element={<StockQuery />} />
          <Route path="/purchases" element={<ProtectedRoute adminOnly><Purchases /></ProtectedRoute>} />
          <Route path="/finance" element={<ProtectedRoute adminOnly><Finance /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute adminOnly><UserManagement /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute adminOnly><Settings /></ProtectedRoute>} />
          <Route path="/etims" element={<ProtectedRoute adminOnly><EtimsSyncQueue /></ProtectedRoute>} />
          <Route path="/shop-orders" element={<ProtectedRoute adminOnly><AdminShopOrders /></ProtectedRoute>} />
          <Route path="/inquiries" element={<ProtectedRoute adminOnly><AdminInquiries /></ProtectedRoute>} />
          <Route path="/blog" element={<ProtectedRoute adminOnly><AdminBlog /></ProtectedRoute>} />
          <Route path="/blog/new" element={<ProtectedRoute adminOnly><AdminBlogEditor /></ProtectedRoute>} />
          <Route path="/blog/:id" element={<ProtectedRoute adminOnly><AdminBlogEditor /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppLayout>
    </ProtectedRoute>
  );
}

function AppRoutes() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public shop (root + named) */}
      <Route path="/" element={<ShopHome />} />
      <Route path="/shop" element={<ShopCatalog />} />
      <Route path="/shop/product/:id" element={<ShopProductDetail />} />
      <Route path="/shop/cart" element={<ShopCart />} />
      <Route path="/shop/checkout" element={<ShopCheckout />} />
      <Route path="/shop/order-success/:id" element={<ShopOrderSuccess />} />
      <Route path="/services" element={<ShopServices />} />
      <Route path="/blog" element={<ShopBlog />} />
      <Route path="/blog/:slug" element={<ShopBlogPost />} />
      <Route path="/about" element={<ShopAbout />} />
      <Route path="/contact" element={<ShopContact />} />
      <Route path="/shop/signin" element={<ShopSignIn />} />
      <Route path="/shop/signup" element={<ShopSignUp />} />
      <Route path="/shop/account" element={<ShopAccount />} />
      <Route path="/shop/account/orders" element={<ShopOrders />} />

      {/* Staff login */}
      <Route path="/login" element={<Login />} />

      {/* ERP (protected) — all internal admin tools live under /erp */}
      <Route path="/erp/*" element={<ErpShell />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
