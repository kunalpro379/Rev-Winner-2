import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { HamburgerNav } from "@/components/hamburger-nav";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/cart-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  ShoppingCart, 
  CreditCard,
  Lock,
  CheckCircle,
  Loader2,
  AlertCircle,
  Package,
  DollarSign
} from "lucide-react";

declare global {
  interface Window {
    Cashfree: any;
    Razorpay: any;
  }
}

export default function Checkout() {
  const [location, setLocation] = useLocation();
  const { cart, isLoading: cartLoading } = useCart();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cashfreeLoaded, setCashfreeLoaded] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<{ countryCode?: string; detected: boolean }>({ detected: false });

  // Check if SDKs are available and detect user location
  useEffect(() => {
    // Check for Cashfree
    const checkCashfree = setInterval(() => {
      if (window.Cashfree) {
        setCashfreeLoaded(true);
        clearInterval(checkCashfree);
      }
    }, 500);

    // Check for Razorpay
    const checkRazorpay = setInterval(() => {
      if (window.Razorpay) {
        setRazorpayLoaded(true);
        clearInterval(checkRazorpay);
      }
    }, 500);

    // Get user location for gateway selection with timeout
    // If blocked by ad blocker or fails, default to international (Cashfree)
    let locationDetected = false;
    const locationTimeout = setTimeout(() => {
      if (!locationDetected) {
        console.warn("Location detection timed out, defaulting to international gateway");
        setUserLocation({ countryCode: 'US', detected: true });
      }
    }, 3000); // 3 second timeout

    fetch("https://ipapi.co/json/", {
      signal: AbortSignal.timeout(2500), // 2.5 second timeout
      headers: {
        'Accept': 'application/json',
      },
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        locationDetected = true;
        clearTimeout(locationTimeout);
        setUserLocation({ countryCode: data.country_code || 'US', detected: true });
      })
      .catch(err => {
        clearTimeout(locationTimeout);
        // Silently fail - already handled by timeout or ad blocker
        if (!locationDetected) {
          locationDetected = true;
          setUserLocation({ countryCode: 'US', detected: true });
        }
      });

    return () => {
      clearInterval(checkCashfree);
      clearInterval(checkRazorpay);
      clearTimeout(locationTimeout);
    };
  }, []);

  const isDomestic = userLocation.countryCode === 'IN';
  const locationDetected = userLocation.detected;
  const gatewayLoaded = locationDetected && (isDomestic ? razorpayLoaded : cashfreeLoaded);
  const gatewayName = isDomestic ? "Razorpay" : "Cashfree";

  // Check if user is authenticated
  const { data: authData, isLoading: authLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    retry: false,
  });

  // Redirect to login if not authenticated (AFTER all hooks)
  if (!authLoading && !authData) {
    setLocation('/login?redirect=/checkout');
    return null;
  }

  // Redirect to cart if empty (AFTER all hooks)
  if (!cartLoading && (!cart || cart.items.length === 0)) {
    setLocation('/cart');
    return null;
  }

  const handlePayment = async () => {
    if (!gatewayLoaded) {
      toast({
        title: "Payment Gateway Loading",
        description: `Please wait while we load ${gatewayName}...`,
      });
      return;
    }

    if (!cart || cart.items.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Your cart is empty. Please add items to checkout.",
        variant: "destructive",
      });
      setLocation("/packages");
      return;
    }

    setIsProcessing(true);

    try {
      const selectedGateway = isDomestic ? "razorpay" : "cashfree";
      
      // Create cart checkout order
      // Note: apiRequest automatically handles 403 token expiration and retries with refreshed token
      const response = await apiRequest("POST", "/api/cart/checkout", {
        paymentGateway: selectedGateway,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Failed to create checkout order" }));
        console.error("Checkout error:", error, "Status:", response.status);
        
        // Provide user-friendly error messages
        if (response.status === 401 || response.status === 403) {
          throw new Error("Your session has expired. Please refresh the page and try again.");
        }
        
        throw new Error(error.message || `Failed to create checkout order (${response.status})`);
      }

      const checkoutData = await response.json();
      const { orderId, amount, currency } = checkoutData;

      if (isDomestic) {
        // Handle Razorpay Payment
        // Razorpay expects amount in paise (1 USD = 100 cents equivalent)
        const amountInSmallestUnit = Math.round(checkoutData.amount * 100);
        const options = {
          key: checkoutData.keyId,
          amount: amountInSmallestUnit,
          currency: checkoutData.currency,
          name: "Rev Winner",
          description: "Subscription Purchase",
          order_id: checkoutData.gatewayOrderId, // Use Razorpay order ID, not our internal ID
          handler: async (response: any) => {
            try {
              const verifyResponse = await apiRequest("POST", "/api/cart/verify", {
                orderId: orderId, // Our internal pending order ID for lookup
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });

              if (verifyResponse.ok) {
                // Invalidate subscription and cart queries to reflect updated state
                await queryClient.invalidateQueries({ queryKey: ["/api/profile/subscription"] });
                await queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/current"] });
                await queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/check-limits"] });
                await queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
                
                toast({ title: "Payment Successful!", description: "Your order has been processed." });
                setLocation(`/invoice?orderId=${orderId}`);
              } else {
                const error = await verifyResponse.json();
                throw new Error(error.message || "Verification failed");
              }
            } catch (err: any) {
              toast({ title: "Verification Error", description: err.message, variant: "destructive" });
              setIsProcessing(false);
            }
          },
          prefill: {
            name: `${(authData as any).firstName || ""} ${(authData as any).lastName || ""}`.trim(),
            email: (authData as any).email,
          },
          modal: {
            ondismiss: () => setIsProcessing(false),
          },
          theme: {
            color: "#7c3aed", // Purple theme to match app
          }
        };
        try {
          const rzp = new window.Razorpay(options);
          
          // Track if we've already shown an error to prevent duplicate messages
          let errorShown = false;
          
          // Handle payment errors (fires before payment.failed for API errors)
          rzp.on('payment.error', (response: any) => {
            console.error('Razorpay payment error:', response);
            
            if (errorShown) return; // Prevent duplicate error messages
            errorShown = true;
            
            let errorMessage = "An error occurred during payment.";
            const error = response.error;
            
            if (error?.code === 'GATEWAY_ERROR') {
              // Gateway errors often occur due to:
              // 1. Ad blockers blocking fingerprinting services (fpjs.io, online-metrix.net)
              // 2. Razorpay API issues (502 Bad Gateway)
              // 3. Network connectivity issues
              errorMessage = error.description || 
                "Payment gateway error detected. This often happens when ad blockers block Razorpay's security services. " +
                "Please disable your ad blocker for this site and try again, or use Cashfree as an alternative payment method.";
            } else if (error?.code === 'BAD_REQUEST_ERROR') {
              errorMessage = error.description || "Invalid payment request. Please try again.";
            } else if (error?.code === 'NETWORK_ERROR') {
              errorMessage = "Network error. Please check your internet connection and try again.";
            } else if (error?.description && error.description.trim()) {
              errorMessage = error.description;
            } else if (error?.reason && error.reason !== 'NA') {
              errorMessage = error.reason;
            }
            
            toast({ 
              title: "Payment Error", 
              description: errorMessage, 
              variant: "destructive",
              duration: 7000 // Show longer for important error messages
            });
            setIsProcessing(false);
          });
          
          // Add error handler for Razorpay payment failures (fires after payment attempts)
          rzp.on('payment.failed', (response: any) => {
            console.error('Razorpay payment failed:', response);
            
            if (errorShown) return; // Prevent duplicate error messages
            errorShown = true;
            
            const error = response.error;
            let errorMessage = 'Payment failed. Please try again.';
            
            if (error?.description && error.description.trim()) {
              errorMessage = error.description;
            } else if (error?.reason && error.reason !== 'NA') {
              errorMessage = error.reason;
            } else if (error?.code) {
              if (error.code === 'GATEWAY_ERROR') {
                errorMessage = "Payment gateway error. Please disable your ad blocker and try again, or use Cashfree as an alternative.";
              } else {
                errorMessage = `Payment failed (${error.code}). Please try again or use a different payment method.`;
              }
            }
            
            toast({ 
              title: "Payment Failed", 
              description: errorMessage, 
              variant: "destructive",
              duration: 7000
            });
            setIsProcessing(false);
          });
          
          rzp.open();
        } catch (error: any) {
          console.error('Razorpay checkout initialization error:', error);
          let errorMessage = "Failed to initialize payment.";
          
          // Provide more specific error messages
          if (error.message?.includes('currency') || error.message?.includes('USD')) {
            errorMessage = "USD currency is not supported by your Razorpay account. Please configure INR currency or use a different payment gateway.";
          } else if (error.message?.includes('key') || error.message?.includes('credential')) {
            errorMessage = "Razorpay configuration error. Please check your payment gateway settings.";
          } else if (error.message?.includes('order')) {
            errorMessage = "Invalid order. Please try creating a new checkout.";
          }
          
          toast({ 
            title: "Payment Error", 
            description: errorMessage, 
            variant: "destructive" 
          });
          setIsProcessing(false);
        }
      } else {
        // Handle Cashfree Payment
        const { paymentSessionId, cashfreeMode: serverMode } = checkoutData;
        if (!paymentSessionId) throw new Error("Payment gateway configuration error.");

        // IMPORTANT: Use the mode from server to ensure they match
        // Server determines mode based on environment and localhost detection
        // Fallback to client-side detection if server didn't provide mode
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const mode = serverMode || (isLocalhost ? "sandbox" : "production");
        
        console.log(`[Checkout] Using Cashfree ${mode} mode (${serverMode ? 'from server' : 'client-detected'})`);
        console.log(`[Checkout] Payment Session ID: ${paymentSessionId?.substring(0, 50)}...`);
        
        const cashfree = window.Cashfree({ mode: mode });

        cashfree.checkout({
          paymentSessionId: paymentSessionId,
          redirectTarget: "_modal",
        }).then(async (result: any) => {
          if (result.error) {
            toast({ title: "Payment Failed", description: result.error.message, variant: "destructive" });
            setIsProcessing(false);
            return;
          }
          
          if (result.paymentDetails) {
            const verifyResponse = await apiRequest("POST", "/api/cart/verify", {
              orderId: orderId, // Our internal pending order ID
              cfPaymentId: result.paymentDetails.cfPaymentId, // Cashfree payment ID for logging
            });

            if (verifyResponse.ok) {
              // Invalidate subscription and cart queries to reflect updated state
              await queryClient.invalidateQueries({ queryKey: ["/api/profile/subscription"] });
              await queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/current"] });
              await queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/check-limits"] });
              await queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
              
              toast({ title: "Payment Successful!", description: "Your order has been processed." });
              setLocation(`/invoice?orderId=${orderId}`);
            } else {
              const error = await verifyResponse.json();
              throw new Error(error.message || "Verification failed");
            }
          } else {
            toast({ title: "Payment Cancelled" });
            setIsProcessing(false);
          }
        }).catch((err: any) => {
          toast({ title: "Payment Error", description: err.message, variant: "destructive" });
          setIsProcessing(false);
        });
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      
      // Provide user-friendly error messages
      let errorTitle = "Checkout Error";
      let errorMessage = error.message || "An unexpected error occurred. Please try again.";
      
      // Handle specific error cases
      if (error.message?.includes("session has expired") || error.message?.includes("token")) {
        errorTitle = "Session Expired";
        errorMessage = "Your session has expired. Please refresh the page and try again.";
      } else if (error.message?.includes("authentication") || error.message?.includes("Authentication failed")) {
        errorTitle = "Payment Gateway Error";
        errorMessage = "Payment gateway configuration error. Please contact support or try a different payment method.";
      } else if (error.message?.includes("Cart is empty")) {
        errorTitle = "Empty Cart";
        errorMessage = "Your cart is empty. Please add items before checking out.";
      } else if (error.message?.includes("currency")) {
        errorTitle = "Currency Not Supported";
        errorMessage = "The selected currency is not supported. Please try a different payment gateway.";
      }
      
      toast({ 
        title: errorTitle, 
        description: errorMessage, 
        variant: "destructive",
        duration: 7000
      });
      setIsProcessing(false);
    }
  };

  if (cartLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-fuchsia-600 via-purple-700 to-blue-900 dark:from-fuchsia-900 dark:via-purple-900 dark:to-slate-950">
        <HamburgerNav currentPath={location} />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-12 w-12 animate-spin text-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-600 via-purple-700 to-blue-900 dark:from-fuchsia-900 dark:via-purple-900 dark:to-slate-950">
      <HamburgerNav currentPath={location} />
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <CreditCard className="h-10 w-10" />
            Secure Checkout
          </h1>
          <p className="text-lg text-purple-100">
            Review and complete your purchase
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Summary
              </CardTitle>
              <CardDescription className="text-purple-100">
                {cart?.items?.length || 0} item(s) in your order
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart?.items?.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-3 border-b border-white/10 last:border-0">
                  <div>
                    <p className="font-medium text-white">{item.packageName}</p>
                    <p className="text-sm text-purple-200">Qty: {item.quantity || 1}</p>
                    {item.promoCodeCode && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        Promo: {item.promoCodeCode}
                      </Badge>
                    )}
                  </div>
                  <p className="font-semibold text-white">
                    ${parseFloat(item.basePrice || '0').toFixed(2)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Payment Details */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-purple-100">
                  <span>Subtotal</span>
                  <span>${(cart?.subtotal || 0).toFixed(2)}</span>
                </div>
                {cart?.gstAmount && cart.gstAmount > 0 && (
                  <div className="flex justify-between text-purple-100">
                    <span>GST (18%)</span>
                    <span>${cart.gstAmount.toFixed(2)}</span>
                  </div>
                )}
                {cart?.discount && cart.discount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Discount</span>
                    <span>-${cart.discount.toFixed(2)}</span>
                  </div>
                )}
                <Separator className="bg-white/20" />
                <div className="flex justify-between text-xl font-bold text-white">
                  <span>Total</span>
                  <span>${Math.max(cart?.total || 0, 1).toFixed(2)} USD</span>
                </div>
                {(cart?.total || 0) > 0 && (cart?.total || 0) < 1 && (
                  <div className="text-xs text-amber-300 mt-1">
                    * Minimum transaction amount is $1.00 USD
                  </div>
                )}
              </div>

              <div className="pt-4 space-y-3">
                <div className="flex items-center gap-2 text-sm text-purple-100">
                  <Lock className="h-4 w-4" />
                  <span>Secured by {gatewayName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-purple-100">
                  <CheckCircle className="h-4 w-4" />
                  <span>SSL encrypted payment</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button 
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                size="lg"
                onClick={handlePayment}
                disabled={isProcessing || !locationDetected || !gatewayLoaded}
                data-testid="button-pay-now"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : !locationDetected ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Detecting location...
                  </>
                ) : !gatewayLoaded ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading {gatewayName}...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay ${Math.max(cart?.total || 0, 1).toFixed(2)} USD
                  </>
                )}
              </Button>
              {isProcessing ? (
                <Button 
                  variant="destructive" 
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold shadow-md"
                  onClick={() => {
                    setIsProcessing(false);
                    toast({
                      title: "Payment Cancelled",
                      description: "You can close the payment window and try again when ready.",
                    });
                  }}
                  data-testid="button-cancel-payment"
                >
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Cancel Payment
                </Button>
              ) : (
                <Button 
                  variant="secondary" 
                  className="w-full bg-white text-purple-700 hover:bg-gray-100 dark:bg-gray-100 dark:text-purple-700 dark:hover:bg-white font-semibold shadow-md"
                  onClick={() => setLocation('/cart')}
                  data-testid="button-back-to-cart"
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Back to Cart
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>

        {/* Security Notice */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-purple-100 text-sm">
            <AlertCircle className="h-4 w-4" />
            Your payment information is processed securely via {gatewayName}
          </div>
        </div>
      </div>
    </div>
  );
}
