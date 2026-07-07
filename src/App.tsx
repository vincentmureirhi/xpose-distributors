import { lazy, Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/context/CartContext";
import { VendorSessionProvider } from "@/context/VendorSessionContext";
import { SalesRepSessionProvider, useSalesRepSession } from "@/context/SalesRepSessionContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import Home from "./pages/Home";

const CartDrawer = lazy(() => import("@/components/cart/CartDrawer"));
const MueniChatbot = lazy(() => import("@/components/MueniChatbot"));
const Products = lazy(() => import("./pages/Products"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const CollectionPage = lazy(() => import("./pages/CollectionPage"));
const Categories = lazy(() => import("./pages/Categories"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const TrackOrder = lazy(() => import("./pages/TrackOrder"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Terms = lazy(() => import("./pages/Terms"));
const VendorApply = lazy(() => import("./pages/VendorApply"));
const VendorLogin = lazy(() => import("./pages/VendorLogin"));
const VendorDashboard = lazy(() => import("./pages/VendorDashboard"));
const VendorStores = lazy(() => import("./pages/VendorStores"));
const VendorStore = lazy(() => import("./pages/VendorStore"));
const NotFound = lazy(() => import("./pages/NotFound"));
const FlashSalePage = lazy(() => import("./pages/FlashSalePage"));
const RouteDeliveryApply = lazy(() => import("./pages/RouteDeliveryApply"));
const SalesRepLogin = lazy(() => import("./pages/SalesRepLogin"));
const SalesRepChangePassword = lazy(() => import("./pages/SalesRepChangePassword"));
const SalesRepLocationAccess = lazy(() => import("./pages/SalesRepLocationAccess"));

const queryClient = new QueryClient();

function PageFallback() {
  return (
    <div className="container grid min-h-[45vh] place-items-center" role="status" aria-label="Loading page">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-accent" />
    </div>
  );
}

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname, location.search]);

  return null;
}

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
        <ScrollToTop />
        <SalesRepSessionProvider>
          <VendorSessionProvider>
            <SalesRepPasswordRedirector />
            <CartProvider>
              <div className="flex min-h-screen flex-col">
                <Header />
                <main className="flex-1">
                  <Suspense fallback={<PageFallback />}>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/products" element={<Products />} />
                      <Route path="/products/:id" element={<ProductDetails />} />
                      <Route path="/collections/:slug" element={<CollectionPage />} />
                      <Route path="/deals" element={<CollectionPage slug="deals" />} />
                      <Route path="/wholesale" element={<CollectionPage slug="wholesale" />} />
                      <Route path="/under-500" element={<CollectionPage slug="under-500" />} />
                      <Route path="/new-arrivals" element={<CollectionPage slug="new-arrivals" />} />
                      <Route path="/salon-supplies" element={<CollectionPage slug="salon-supplies" />} />
                      <Route path="/baby-care" element={<CollectionPage slug="baby-care" />} />
                      <Route path="/back-to-school" element={<CollectionPage slug="back-to-school" />} />
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
                      <Route path="/vendors" element={<VendorStores />} />
                      <Route path="/vendors/:slug" element={<VendorStore />} />
                      <Route path="/vendor/login" element={<VendorLogin />} />
                      <Route path="/vendor/dashboard" element={<VendorDashboard />} />
                      <Route path="/terms" element={<Terms />} />
                      <Route path="/sell-on-xpose" element={<VendorApply />} />
                      <Route path="/login" element={<Navigate to="/sales-rep/login" replace />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </main>
                <Footer />
                <Suspense fallback={null}><CartDrawer /></Suspense>
                <WhatsAppButton />
                <Suspense fallback={null}><MueniChatbot /></Suspense>
              </div>
            </CartProvider>
          </VendorSessionProvider>
        </SalesRepSessionProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
