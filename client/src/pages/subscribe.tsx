import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Check, Loader2, Crown, Zap, Tag, CheckCircle, XCircle, Users, Phone, GraduationCap, Clock, AlertCircle, Package } from "lucide-react";
import { useLocation } from "wouter";
import { useSEO } from "@/hooks/use-seo";
import { BusinessTeamsDialog } from "@/components/business-teams-dialog";
import { queryClient } from "@/lib/queryClient";

interface SubscriptionPlan {
  sku: string;
  name: string;
  price: number;
  listedPrice?: number | null;
  currency: string;
  billingType: 'one_time' | 'monthly' | '6_months' | '12_months' | '36_months';
  validityDays: number;
  description: string;
  features: string[];
}

interface PromoCodeValidation {
  valid: boolean;
  code?: string;
  discountType?: string;
  discountValue?: string;
  message?: string;
}

interface SessionMinutesPackage {
  id: string;
  name: string;
  minutes: number;
  price: number;
  description: string;
}

declare global {
  interface Window {
    Cashfree: any;
  }
}

export default function Subscribe() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cashfreeLoaded, setCashfreeLoaded] = useState(false);
  
  useSEO({
    title: "Subscribe - Rev Winner | Choose Your Plan & Upgrade",
    description: "Subscribe to Rev Winner and unlock unlimited AI-powered sales coaching. Flexible plans with promo code support. Secure payment via Cashfree. Upgrade your sales game today.",
    keywords: "Rev Winner pricing, AI sales assistant subscription, sales intelligence software pricing, conversation intelligence plans, SaaS for sales professionals, B2B sales software subscription, sales enablement platform pricing, enterprise sales intelligence, revenue intelligence platform subscription, AI sales coach pricing, sales automation subscription, business teams package, AI meeting assistant plans",
    ogImage: "https://revwinner.com/og-image.png",
    ogUrl: "https://revwinner.com/subscribe"
  });
  
  // Promo code state
  const [promoCode, setPromoCode] = useState("");
  const [promoCodeValidation, setPromoCodeValidation] = useState<PromoCodeValidation | null>(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  
  // Business Teams dialog state
  const [showBusinessTeamsDialog, setShowBusinessTeamsDialog] = useState(false);
  
  // Add-ons state
  const [isPurchasingTrainMe, setIsPurchasingTrainMe] = useState(false);
  const [isPurchasingMinutes, setIsPurchasingMinutes] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);

  const { data: packagesResponse, isLoading: plansLoading } = useQuery<{ platformAccess: SubscriptionPlan[]; addons: any[] }>({
    queryKey: ['/api/billing/packages'],
  });
  
  // Fetch Session Minutes packages
  const { data: packagesData, isLoading: isLoadingPackages } = useQuery<{ packages: SessionMinutesPackage[] }>({
    queryKey: ["/api/session-minutes/packages"],
  });

  // Fetch Session Minutes status for required addon validation
  const { data: sessionMinutesStatus } = useQuery<{ 
    hasActiveMinutes: boolean; 
    totalMinutesRemaining: number; 
    totalMinutes: number;
    usedMinutes: number;
    superUserAccess?: boolean 
  }>({
    queryKey: ["/api/session-minutes/status"],
  });

  // Check Cashfree SDK availability
  useEffect(() => {
    if (window.Cashfree) {
      setCashfreeLoaded(true);
      return;
    }

    let attempts = 0;
    const maxAttempts = 20;
    
    const checkCashfree = setInterval(() => {
      attempts++;
      if (window.Cashfree) {
        setCashfreeLoaded(true);
        clearInterval(checkCashfree);
      } else if (attempts >= maxAttempts) {
        clearInterval(checkCashfree);
      }
    }, 500);

    return () => clearInterval(checkCashfree);
  }, []);

  async function validatePromoCode() {
    if (!promoCode.trim()) {
      toast({
        title: "Promo Code Required",
        description: "Please enter a promo code to validate.",
        variant: "destructive",
      });
      return;
    }

    setIsValidatingPromo(true);
    try {
      const response = await fetch(`/api/promo-codes/validate/${encodeURIComponent(promoCode.trim())}`);
      const data = await response.json();

      if (response.ok && data.valid) {
        setPromoCodeValidation(data);
        toast({
          title: "Promo Code Applied!",
          description: data.message,
        });
      } else {
        setPromoCodeValidation({ valid: false, message: data.message });
        toast({
          title: "Invalid Promo Code",
          description: data.message || "This promo code is not valid.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Validation Error",
        description: "Failed to validate promo code. Please try again.",
        variant: "destructive",
      });
      setPromoCodeValidation({ valid: false });
    } finally {
      setIsValidatingPromo(false);
    }
  }

  function getCurrencySymbol(currency: string): string {
    return currency === 'INR' ? '₹' : '$';
  }

  function calculateDiscountedPrice(originalPrice: string): { finalPrice: string; discount: string } {
    if (!promoCodeValidation?.valid) {
      return { finalPrice: originalPrice, discount: "0" };
    }

    const price = parseFloat(originalPrice);
    let discountAmount = 0;

    if (promoCodeValidation.discountType === 'percentage') {
      const discountPercent = parseFloat(promoCodeValidation.discountValue || '0');
      discountAmount = (price * discountPercent) / 100;
    } else if (promoCodeValidation.discountType === 'fixed') {
      discountAmount = parseFloat(promoCodeValidation.discountValue || '0');
    }

    const finalPrice = Math.max(0, price - discountAmount);
    return { 
      finalPrice: finalPrice.toFixed(2), 
      discount: discountAmount.toFixed(2) 
    };
  }
  
  // Purchase Train Me Add-on
  async function purchaseTrainMe() {
    try {
      setIsPurchasingTrainMe(true);
      
      if (typeof window.Cashfree === 'undefined') {
        toast({
          title: "Payment Gateway Unavailable",
          description: "Please refresh the page and try again.",
          variant: "destructive",
        });
        setIsPurchasingTrainMe(false);
        return;
      }
      
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        toast({
          title: "Authentication Required",
          description: "Please log in to purchase Train Me.",
          variant: "destructive",
        });
        setLocation("/login");
        setIsPurchasingTrainMe(false);
        return;
      }

      const orderResponse = await fetch("/api/train-me/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
      });

      if (!orderResponse.ok) {
        const error = await orderResponse.json();
        throw new Error(error.message || "Failed to create order");
      }

      const orderData = await orderResponse.json();
      const { orderId, paymentSessionId, amount, currency, cashfreeMode } = orderData;
      
      // Use Cashfree mode from server (backend knows the correct environment)
      const mode = cashfreeMode || 'sandbox'; // Fallback to sandbox if not provided
      const cashfree = window.Cashfree({ mode: mode });

      cashfree.checkout({
        paymentSessionId: paymentSessionId,
        redirectTarget: "_modal",
      }).then(async (result: any) => {
        if (result.error) {
          toast({
            title: "Payment Failed",
            description: result.error.message || "Payment could not be completed.",
            variant: "destructive",
          });
          setIsPurchasingTrainMe(false);
          return;
        }

        if (result.paymentDetails) {
          try {
            const verifyResponse = await fetch("/api/train-me/verify-payment", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
              },
              body: JSON.stringify({
                orderId: orderId,
                cashfreeOrderId: result.paymentDetails.orderId,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyResponse.ok) {
              queryClient.invalidateQueries({ queryKey: ["/api/train-me/status"] });
              toast({
                title: "Train Me Activated!",
                description: "You now have 30 days of access to Train Me features.",
              });
            } else {
              toast({
                title: "Verification Failed",
                description: verifyData.message || "Payment verification failed.",
                variant: "destructive",
              });
            }
          } catch (error: any) {
            toast({
              title: "Verification Error",
              description: error.message || "Failed to verify payment.",
              variant: "destructive",
            });
          }
        } else {
          toast({ title: "Payment Cancelled", description: "You cancelled the payment process." });
        }
        setIsPurchasingTrainMe(false);
      }).catch((error: any) => {
        toast({
          title: "Payment Error",
          description: error.message || "An error occurred during payment.",
          variant: "destructive",
        });
        setIsPurchasingTrainMe(false);
      });
    } catch (error: any) {
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
      setIsPurchasingTrainMe(false);
    }
  }
  
  // Purchase Session Minutes Package
  async function purchaseSessionMinutes(packageId: string) {
    try {
      setIsPurchasingMinutes(true);
      setSelectedPackageId(packageId);

      if (typeof window.Cashfree === 'undefined') {
        toast({
          title: "Payment Gateway Unavailable",
          description: "Please refresh the page and try again.",
          variant: "destructive",
        });
        setIsPurchasingMinutes(false);
        setSelectedPackageId(null);
        return;
      }

      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        toast({
          title: "Authentication Required",
          description: "Please log in to purchase session minutes.",
          variant: "destructive",
        });
        setLocation("/login");
        setIsPurchasingMinutes(false);
        setSelectedPackageId(null);
        return;
      }

      const orderResponse = await fetch("/api/session-minutes/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ packageId }),
      });

      if (!orderResponse.ok) {
        // Check if response is JSON before parsing
        const contentType = orderResponse.headers.get("content-type");
        let errorMessage = "Failed to create order";
        
        if (contentType && contentType.includes("application/json")) {
          try {
            const error = await orderResponse.json();
            errorMessage = error.message || errorMessage;
          } catch (e) {
            errorMessage = `Server error (${orderResponse.status})`;
          }
        } else {
          // Response is HTML (likely a 404 or error page)
          errorMessage = `Server error (${orderResponse.status}). Please try again or contact support.`;
        }
        
        throw new Error(errorMessage);
      }

      const orderData = await orderResponse.json();
      const { orderId, paymentSessionId, packageName, amount, currency, cashfreeMode } = orderData;
      
      // Use Cashfree mode from server (backend knows the correct environment)
      const mode = cashfreeMode || 'sandbox'; // Fallback to sandbox if not provided
      const cashfree = window.Cashfree({ mode: mode });

      cashfree.checkout({
        paymentSessionId: paymentSessionId,
        redirectTarget: "_modal",
      }).then(async (result: any) => {
        if (result.error) {
          toast({
            title: "Payment Failed",
            description: result.error.message || "Payment could not be completed.",
            variant: "destructive",
          });
          setIsPurchasingMinutes(false);
          setSelectedPackageId(null);
          return;
        }

        if (result.paymentDetails) {
          try {
            const verifyResponse = await fetch("/api/session-minutes/verify-payment", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
              },
              body: JSON.stringify({
                orderId: orderId,
                cashfreeOrderId: result.paymentDetails.orderId,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyResponse.ok) {
              queryClient.invalidateQueries({ queryKey: ["/api/session-minutes/status"] });
              toast({
                title: "Session Minutes Purchased!",
                description: `Successfully purchased ${packageName}. Your minutes are now available.`,
              });
            } else {
              toast({
                title: "Verification Failed",
                description: verifyData.message || "Payment verification failed.",
                variant: "destructive",
              });
            }
          } catch (error: any) {
            toast({
              title: "Verification Error",
              description: error.message || "Failed to verify payment.",
              variant: "destructive",
            });
          }
        } else {
          toast({ title: "Payment Cancelled", description: "You cancelled the payment process." });
        }
        setIsPurchasingMinutes(false);
        setSelectedPackageId(null);
      }).catch((error: any) => {
        toast({
          title: "Payment Error",
          description: error.message || "An error occurred during payment.",
          variant: "destructive",
        });
        setIsPurchasingMinutes(false);
        setSelectedPackageId(null);
      });
    } catch (error: any) {
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
      setIsPurchasingMinutes(false);
      setSelectedPackageId(null);
    }
  }

  async function handleSubscribe(planId: string, planName: string, price: string, currency: string) {
    const accessToken = localStorage.getItem("accessToken");
    
    if (!accessToken) {
      toast({
        title: "Authentication Required",
        description: "Please log in to subscribe.",
        variant: "destructive",
      });
      setLocation("/login");
      return;
    }

    if (!cashfreeLoaded) {
      toast({
        title: "Payment Gateway Loading",
        description: "Please wait while we load the payment gateway...",
      });
      return;
    }

    setIsLoading(true);
    setSelectedPlan(planId);

    try {
      // Create order with optional promo code
      const response = await fetch("/api/cashfree/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ 
          planId,
          promoCode: promoCodeValidation?.valid ? promoCode.trim() : undefined
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        
        // Handle invalid promo code during checkout
        if (error.invalidPromoCode) {
          setPromoCodeValidation(null);
          setPromoCode("");
          toast({
            title: "Promo Code No Longer Valid",
            description: error.message || "The promo code has expired or reached its limit. Please try again without it or use a different code.",
            variant: "destructive",
            duration: 8000,
          });
          setIsLoading(false);
          setSelectedPlan(null);
          return;
        }
        
        throw new Error(error.message || "Failed to create order");
      }

      const orderData = await response.json();
      const { orderId, paymentSessionId, amount, finalPrice, cashfreeMode } = orderData;
      
      // Use Cashfree mode from server (backend knows the correct environment)
      const mode = cashfreeMode || 'sandbox'; // Fallback to sandbox if not provided
      const cashfree = window.Cashfree({ mode: mode });

      cashfree.checkout({
        paymentSessionId: paymentSessionId,
        redirectTarget: "_modal",
      }).then(async (result: any) => {
        if (result.error) {
          toast({
            title: "Payment Failed",
            description: result.error.message || "Payment could not be completed.",
            variant: "destructive",
          });
          setIsLoading(false);
          setSelectedPlan(null);
          return;
        }

        if (result.paymentDetails) {
          try {
            // Verify payment on backend
            const verifyResponse = await fetch("/api/cashfree/verify-payment", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
              },
              body: JSON.stringify({
                orderId: orderId,
                cashfreeOrderId: result.paymentDetails.orderId,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyResponse.ok) {
              toast({
                title: "Subscription Successful!",
                description: "Your payment has been processed successfully.",
              });
              setLocation("/subscription/success");
            } else {
              toast({
                title: "Verification Failed",
                description: verifyData.message || "Payment verification failed.",
                variant: "destructive",
              });
            }
          } catch (error: any) {
            toast({
              title: "Verification Error",
              description: error.message || "Failed to verify payment.",
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Payment Cancelled",
            description: "You cancelled the payment process.",
          });
        }
        setIsLoading(false);
        setSelectedPlan(null);
      }).catch((error: any) => {
        toast({
          title: "Payment Error",
          description: error.message || "An error occurred during payment.",
          variant: "destructive",
        });
        setIsLoading(false);
        setSelectedPlan(null);
      });
    } catch (error: any) {
      toast({
        title: "Subscription Failed",
        description: error.message || "Unable to start subscription. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
      setSelectedPlan(null);
    }
  }

  if (plansLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-fuchsia-600 via-purple-700 to-blue-900 dark:from-fuchsia-900 dark:via-purple-900 dark:to-slate-950 flex items-center justify-center">
        <div className="text-white text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p>Loading plans...</p>
        </div>
      </div>
    );
  }

  const plans = packagesResponse?.platformAccess || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-600 via-purple-700 to-blue-900 dark:from-fuchsia-900 dark:via-purple-900 dark:to-slate-950 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Upgrade to Rev Winner Pro
          </h1>
          <p className="text-lg text-purple-100">
            Get unlimited access for 3 years - No more session limits!
          </p>
          <p className="text-sm text-purple-200 mt-2">
            Skip your trial anytime and upgrade directly
          </p>
        </div>

        {/* Promo Code Section */}
        <Card className="max-w-3xl mx-auto mb-8 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-2 border-purple-300 dark:border-purple-700" data-testid="card-promo-code">
          <CardHeader>
            <CardTitle className="text-lg flex items-center text-slate-900 dark:text-white">
              <Tag className="h-5 w-5 mr-2 text-purple-600" />
              Have a Promo Code?
            </CardTitle>
            <CardDescription>
              Enter your promo code to get special discounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  type="text"
                  placeholder="Enter promo code (e.g., RevStart-99)"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      validatePromoCode();
                    }
                  }}
                  disabled={isValidatingPromo || promoCodeValidation?.valid}
                  className="pr-10"
                  data-testid="input-promo-code"
                />
                {promoCodeValidation?.valid && (
                  <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                )}
                {promoCodeValidation && !promoCodeValidation.valid && (
                  <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-red-500" />
                )}
              </div>
              {!promoCodeValidation?.valid ? (
                <Button
                  onClick={validatePromoCode}
                  disabled={isValidatingPromo || !promoCode.trim()}
                  className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700"
                  data-testid="button-validate-promo"
                >
                  {isValidatingPromo ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    "Apply"
                  )}
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    setPromoCode("");
                    setPromoCodeValidation(null);
                  }}
                  variant="outline"
                  className="border-purple-300 dark:border-purple-700"
                  data-testid="button-remove-promo"
                >
                  Remove
                </Button>
              )}
            </div>
            
            {promoCodeValidation?.valid && (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
                <p className="text-sm text-green-800 dark:text-green-200 font-medium flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {promoCodeValidation.message}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {plans.length === 0 ? (
          <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur" data-testid="card-no-plans">
            <CardContent className="py-12 text-center">
              <p className="text-slate-600 dark:text-slate-400">
                No subscription plans available at the moment.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {plans.map((plan, index) => (
              <Card
                key={plan.sku}
                className={`bg-white/95 dark:bg-slate-900/95 backdrop-blur border-2 transition-all hover:scale-105 ${
                  index === 0 ? 'border-purple-400' : 'border-purple-300 dark:border-purple-700'
                }`}
                data-testid={`card-plan-${index}`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-2xl bg-gradient-to-r from-fuchsia-600 to-purple-600 bg-clip-text text-transparent">
                      {plan.name}
                    </CardTitle>
                    {index === 0 && (
                      <Badge className="bg-gradient-to-r from-fuchsia-600 to-purple-600">
                        <Crown className="h-3 w-3 mr-1" />
                        Popular
                      </Badge>
                    )}
                  </div>
                  
                  <CardDescription>
                    {plan.listedPrice && (
                      <div className="mb-1">
                        <span className="text-lg text-slate-500 dark:text-slate-500 line-through">
                          {getCurrencySymbol(plan.currency)}{plan.listedPrice}
                        </span>
                        <Badge variant="destructive" className="ml-2 bg-red-500">
                          Save {getCurrencySymbol(plan.currency)}{(plan.listedPrice - plan.price).toFixed(0)}
                        </Badge>
                      </div>
                    )}
                    <div>
                      {promoCodeValidation?.valid ? (
                        <>
                          <div className="mb-1">
                            <span className="text-lg text-slate-500 dark:text-slate-500 line-through">
                              {getCurrencySymbol(plan.currency)}{plan.price}
                            </span>
                          </div>
                          <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                            {getCurrencySymbol(plan.currency)}{calculateDiscountedPrice(plan.price.toString()).finalPrice}
                          </span>
                          <span className="text-slate-600 dark:text-slate-400">
                            /{plan.billingType.replace('_', ' ')}
                          </span>
                          <div className="mt-1">
                            <Badge className="bg-green-600">
                              Promo: -{getCurrencySymbol(plan.currency)}{calculateDiscountedPrice(plan.price.toString()).discount}
                            </Badge>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="text-3xl font-bold text-slate-900 dark:text-white">
                            {getCurrencySymbol(plan.currency)}{plan.price}
                          </span>
                          <span className="text-slate-600 dark:text-slate-400">
                            /{plan.billingType.replace('_', ' ')}
                          </span>
                        </>
                      )}
                    </div>
                    {plan.listedPrice && !promoCodeValidation?.valid && (
                      <p className="text-sm text-fuchsia-600 dark:text-fuchsia-400 font-semibold mt-1">
                        Limited Time Introductory Offer!
                      </p>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {Array.isArray(plan.features) && plan.features.map((feature: string, idx: number) => (
                      <li key={idx} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="flex-col gap-2">
                  <Button
                    data-testid={`button-subscribe-${index}`}
                    onClick={() => handleSubscribe(plan.sku, plan.name, plan.price.toString(), plan.currency)}
                    disabled={isLoading || !cashfreeLoaded}
                    className="w-full bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading && selectedPlan === plan.sku ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : !cashfreeLoaded ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Subscribe Now
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
        
        {/* Add-ons Section */}
        <div className="max-w-6xl mx-auto mt-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              Enhance Your Experience
            </h2>
            <p className="text-lg text-purple-100">
              Add powerful features to your Rev Winner subscription
            </p>
          </div>
          
          {/* Train Me Add-on */}
          <div className="mb-12">
            <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur border-2 border-purple-400 dark:border-purple-500" data-testid="card-addon-trainme">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg shadow-md">
                    <GraduationCap className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
                      Train Me Add-on
                    </CardTitle>
                    <CardDescription>
                      Train AI on your specific domain and product knowledge
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">$15</div>
                    <p className="text-sm text-muted-foreground">30 days</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-semibold text-foreground mb-3">What's Included:</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Create up to 5 domain expertise profiles</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Upload up to 100 documents per domain</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Support for PDF, DOC, DOCX, XLS, XLSX, CSV, PPT, PPTX, TXT</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Train AI with specific product knowledge and pricing</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Get domain-specific answers during sales calls</span>
                      </li>
                    </ul>
                  </div>
                  <div className="flex items-center justify-center">
                    <Button
                      onClick={purchaseTrainMe}
                      disabled={isPurchasingTrainMe}
                      size="lg"
                      className="w-full md:w-auto bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                      data-testid="button-purchase-trainme-addon"
                    >
                      {isPurchasingTrainMe ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <GraduationCap className="mr-2 h-5 w-5" />
                          Purchase Train Me - $15
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Session Minutes Packages */}
          <div id="session-minutes-packages">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">Session Minutes Packages</h3>
              <p className="text-purple-100">
                Purchase session minutes to power your sales calls (valid for 30 days or until exhausted)
              </p>
            </div>
            
            {isLoadingPackages ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
              </div>
            ) : packagesData?.packages ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {packagesData.packages.map((pkg) => (
                  <Card
                    key={pkg.id}
                    className="bg-white/95 dark:bg-slate-900/95 backdrop-blur border-2 border-purple-300 dark:border-purple-700 hover:border-purple-400 dark:hover:border-purple-500 transition-all"
                    data-testid={`card-addon-package-${pkg.id}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-100">
                          <Clock className="h-3 w-3 mr-1" />
                          {pkg.minutes} min
                        </Badge>
                        <span className="text-xl font-bold text-purple-600 dark:text-purple-400">
                          ${pkg.price}
                        </span>
                      </div>
                      <CardTitle className="text-base">{pkg.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <ul className="space-y-1.5 mb-4">
                        <li className="flex items-center gap-2 text-xs">
                          <Check className="h-3 w-3 text-green-500" />
                          <span>{pkg.minutes} session minutes</span>
                        </li>
                        <li className="flex items-center gap-2 text-xs">
                          <Check className="h-3 w-3 text-green-500" />
                          <span>30-day validity</span>
                        </li>
                        <li className="flex items-center gap-2 text-xs">
                          <Check className="h-3 w-3 text-green-500" />
                          <span>${(pkg.price / pkg.minutes).toFixed(3)}/min</span>
                        </li>
                      </ul>
                      <Button
                        onClick={() => purchaseSessionMinutes(pkg.id)}
                        disabled={isPurchasingMinutes && selectedPackageId === pkg.id}
                        size="sm"
                        className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                        data-testid={`button-purchase-package-${pkg.id}`}
                      >
                        {isPurchasingMinutes && selectedPackageId === pkg.id ? (
                          <>
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            Purchasing...
                          </>
                        ) : (
                          "Purchase"
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-white/70">No packages available at the moment</p>
              </div>
            )}
          </div>
        </div>

        {/* Business Teams Package */}
        <div className="max-w-4xl mx-auto mt-12">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              Need Multiple Licenses?
            </h2>
            <p className="text-purple-100">
              Get custom pricing for teams of 5+ users
            </p>
          </div>
          
          <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur border-2 border-purple-400 dark:border-purple-500" data-testid="card-business-teams">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
                  Business Teams
                </CardTitle>
                <Badge className="bg-gradient-to-r from-purple-600 to-blue-600">
                  <Users className="h-3 w-3 mr-1" />
                  Enterprise
                </Badge>
              </div>
              <CardDescription>
                <div className="text-3xl font-bold text-slate-900 dark:text-white">
                  Custom Pricing
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                  Tailored solutions for growing teams
                </p>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700 dark:text-slate-300">Volume discounts for 5+ seats</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700 dark:text-slate-300">Priority customer support</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700 dark:text-slate-300">Dedicated account manager</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700 dark:text-slate-300">Centralized billing and administration</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700 dark:text-slate-300">Custom onboarding and training</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700 dark:text-slate-300">Flexible payment terms</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                data-testid="button-contact-sales"
                onClick={() => setShowBusinessTeamsDialog(true)}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold"
              >
                <Phone className="mr-2 h-4 w-4" />
                Contact Sales
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="text-center mt-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="text-white hover:text-purple-200"
            data-testid="button-back-to-home"
          >
            ← Back to Home
          </Button>
        </div>
      </div>
      
      {/* Business Teams Dialog */}
      <BusinessTeamsDialog 
        open={showBusinessTeamsDialog} 
        onOpenChange={setShowBusinessTeamsDialog} 
      />
    </div>
  );
}
