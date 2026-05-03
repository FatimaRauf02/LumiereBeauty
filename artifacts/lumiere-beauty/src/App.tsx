import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { CartProvider } from "@/hooks/use-cart";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";
import WelcomeCouponBanner from "@/components/WelcomeCouponBanner";
import CompareBar from "@/components/CompareBar";
import FlashSaleBanner from "@/components/FlashSaleBanner";
import Home from "@/pages/Home";
import Products from "@/pages/Products";
import ProductDetail from "@/pages/ProductDetail";
import Quiz from "@/pages/Quiz";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import Auth from "@/pages/Auth";
import Account from "@/pages/Account";
import Wishlist from "@/pages/Wishlist";
import Admin from "@/pages/Admin";
import OrderTracking from "@/pages/OrderTracking";
import Compare from "@/pages/Compare";
import BundleBuilder from "@/pages/BundleBuilder";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <FlashSaleBanner />
      <Navbar />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/products" component={Products} />
          <Route path="/products/:slug" component={ProductDetail} />
          <Route path="/quiz" component={Quiz} />
          <Route path="/cart" component={Cart} />
          <Route path="/checkout" component={Checkout} />
          <Route path="/auth" component={Auth} />
          <Route path="/account" component={Account} />
          <Route path="/wishlist" component={Wishlist} />
          <Route path="/admin" component={Admin} />
          <Route path="/orders/:id" component={OrderTracking} />
          <Route path="/compare" component={Compare} />
          <Route path="/bundle" component={BundleBuilder} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
      <ChatWidget />
      <WelcomeCouponBanner />
      <CompareBar />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <CartProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <AppLayout />
            </WouterRouter>
            <Toaster />
          </CartProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
