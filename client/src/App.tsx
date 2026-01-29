import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { CartProvider } from "@/contexts/cart-context";
import { PerformanceModeProvider } from "@/contexts/performance-mode";
import { CookieBanner } from "@/components/cookie-banner";
import { useTrackVisit } from "@/hooks/use-track-visit";
import Home from "@/pages/home";
import Contact from "@/pages/contact";
import Blog from "@/pages/blog";
import BlogPost from "@/pages/blog-post";
import SalesAssistant from "@/pages/sales-assistant";
import Login from "@/pages/login";
import Register from "@/pages/register";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import Subscribe from "@/pages/subscribe";
import Packages from "@/pages/packages";
import Cart from "@/pages/cart";
import Checkout from "@/pages/checkout";
import Invoice from "@/pages/invoice";
import SubscriptionSuccess from "@/pages/subscription-success";
import SubscriptionCancel from "@/pages/subscription-cancel";
import PaymentSuccess from "@/pages/payment-success";
import Settings from "@/pages/settings";
import Profile from "@/pages/profile";
import ManageSubscription from "@/pages/manage-subscription";
import TermsAndConditions from "@/pages/terms";
import PrivacyPolicy from "@/pages/privacy-policy";
import CancellationRefundPolicy from "@/pages/cancellation-refund-policy";
import ShippingPolicy from "@/pages/shipping-policy";
import TrainMe from "@/pages/train-me";
import Help from "@/pages/help";
import AdminLogin from "@/pages/admin-login";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminUserDetail from "@/pages/admin-user-detail";
import AdminAccountDetail from "@/pages/admin-account-detail";
import AdminTraffic from "@/pages/admin-traffic";
import LicenseManager from "@/pages/license-manager";
import EnterprisePurchase from "@/pages/enterprise-purchase";
import SetupLicenseManager from "@/pages/setup-license-manager";
import SalesGame from "@/pages/sales-game";
import SalesChallengeHub from "@/pages/sales-challenge-hub";
import DoorsGame from "@/pages/doors-game";
import Marketing from "@/pages/marketing";
import MarketingSetup from "@/pages/marketing-setup";
import MarketingLogin from "@/pages/marketing-login";
import TechDocs from "@/pages/tech-docs";
import NotFound from "@/pages/not-found";

function Router() {
  // Track page visits for analytics
  useTrackVisit();
  
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/contact" component={Contact} />
      <Route path="/blog/:slug" component={BlogPost} />
      <Route path="/blog" component={Blog} />
      <Route path="/terms" component={TermsAndConditions} />
      <Route path="/terms-and-conditions" component={TermsAndConditions} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/cancellation-and-refund-policy" component={CancellationRefundPolicy} />
      <Route path="/shipping-policy" component={ShippingPolicy} />
      <Route path="/help" component={Help} />
      <Route path="/ai-sales-assistant" component={SalesAssistant} />
      <Route path="/app" component={SalesAssistant} />
      <Route path="/sales-assistant" component={SalesAssistant} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/subscribe" component={Subscribe} />
      <Route path="/packages" component={Packages} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/invoice" component={Invoice} />
      <Route path="/subscription/success" component={SubscriptionSuccess} />
      <Route path="/subscription/cancel" component={SubscriptionCancel} />
      <Route path="/payment/success" component={PaymentSuccess} />
      <Route path="/settings" component={Settings} />
      <Route path="/profile" component={Profile} />
      <Route path="/manage-subscription" component={ManageSubscription} />
      <Route path="/train-me" component={TrainMe} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/users/:id" component={AdminUserDetail} />
      <Route path="/admin/accounts/:id" component={AdminAccountDetail} />
      <Route path="/admin/traffic" component={AdminTraffic} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/license-manager" component={LicenseManager} />
      <Route path="/enterprise-purchase" component={EnterprisePurchase} />
      <Route path="/setup-license-manager" component={SetupLicenseManager} />
      <Route path="/sales-challenge" component={SalesChallengeHub} />
      <Route path="/sales-challenge/knowledge" component={SalesGame} />
      <Route path="/sales-challenge/doors" component={DoorsGame} />
      <Route path="/marketing" component={Marketing} />
      <Route path="/marketing/setup" component={MarketingSetup} />
      <Route path="/marketing/login" component={MarketingLogin} />
      <Route path="/tech-docs" component={TechDocs} />
      <Route path="/documentation" component={TechDocs} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="sales-bud-theme">
        <PerformanceModeProvider>
          <CartProvider>
            <TooltipProvider>
              <Toaster />
              <CookieBanner />
              <Router />
            </TooltipProvider>
          </CartProvider>
        </PerformanceModeProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
