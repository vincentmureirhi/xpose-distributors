import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/context/CartContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/cart/CartDrawer";
import WhatsAppButton from "@/components/WhatsAppButton";
import MueniChatbot from "@/components/MueniChatbot";
import { SalesRepSessionProvider, useSalesRepSession } from "@/context/SalesRepSessionContext";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Categories from "./pages/Categories";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import TrackOrder from "./pages/TrackOrder";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";
import FlashSalePage from "./pages/FlashSalePage";
import RouteDeliveryApply from "./pages/RouteDeliveryApply";
import SalesRepLogin from "./pages/SalesRepLogin";
import SalesRepChangePassword from "./pages/SalesRepChangePassword";
import SalesRepLocationAccess from "./pages/SalesRepLocationAccess";

const queryClient = new QueryClient();

function SalesRepPasswordRedirector() {
  const location = useLocation();
  const navigate = useNavigate();
  const { status, isSalesRepAuthenticated, mustChangePassword } = useSalesRepSession();

  useEffect(() => {
    if (status === "restoring" || !isSalesRepAuthenticated || !mustChangePassword) return;
    if (location.pathname === "/sales-rep/change-password") return;
    navigate("/sales-rep/change-password", { replace: true });
  }, [isSalesRepAuthenticated, location.pathname, mustChangePassword, navigate, status]);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <SalesRepSessionProvider>
          <SalesRepPasswordRedirector />
          <CartProvider>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/:id" element={<ProductDetails />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/sales-rep/login" element={<SalesRepLogin />} />
                  <Route path="/sales-rep/change-password" element={<SalesRepChangePassword />} />
                  <Route path="/sales-rep/location-access" element={<SalesRepLocationAccess />} />
                  <Route path="/track-order" element={<TrackOrder />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/:id" element={<BlogPost />} />
                  <Route path="/flash-sale" element={<FlashSalePage />} />
                  <Route path="/route-delivery" element={<RouteDeliveryApply />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/login" element={<Navigate to="/sales-rep/login" replace />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
              <CartDrawer />
              <WhatsAppButton />
              <MueniChatbot />
            </div>
          </CartProvider>
        </SalesRepSessionProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
