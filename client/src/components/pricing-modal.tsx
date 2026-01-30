import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2, Sparkles, Crown, Zap } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

declare global {
  interface Window {
    Cashfree: any;
  }
}

interface PricingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason?: "trial_expired" | "upgrade" | "renew";
  currentPlan?: string;
}

interface Plan {
  id: string;
  name: string;
  price: string;
  listedPrice: string | null;
  currency: string;
  billingInterval: string;
  features: string[];
  isActive: boolean;
}

export default function PricingModal({ open, onOpenChange, reason = "upgrade", currentPlan }: PricingModalProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [cashfreeLoaded, setCashfreeLoaded] = useState(false);

  // Load Cashfree script
  useEffect(() => {
    // Check if already loaded
    if (window.Cashfree) {
      setCashfreeLoaded(true);
      return;
    }

    // Poll for Cashfree to be available
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

  const { data: plansData, isLoading: plansLoading } = useQuery<{ plans: Plan[] }>({
    queryKey: ["/api/cashfree/plans"],
    enabled: open,
  });

  const createOrderMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await apiRequest("POST", "/api/cashfree/create-order", { planId });
      return response.json();
    },
    onSuccess: async (data) => {
      if (!data.paymentSessionId) {
        throw new Error("Order creation failed");
      }

      // Use Cashfree mode from server (backend knows the correct environment)
      const mode = data.cashfreeMode || 'sandbox'; // Fallback to sandbox if not provided
      const cashfree = window.Cashfree({ mode: mode });

      // Initialize Cashfree checkout
      cashfree.checkout({
        paymentSessionId: data.paymentSessionId,
        redirectTarget: "_modal",
      }).then(async (result: any) => {
        if (result.error) {
          console.error('[Cashfree] Payment error:', result.error);
          toast({
            title: "Payment Failed",
            description: result.error.message || "Payment could not be completed",
            variant: "destructive",
          });
          return;
        }

        if (result.paymentDetails) {
          try {
            const verifyResponse = await apiRequest("POST", "/api/cashfree/verify-payment", {
              orderId: data.orderId,
              cashfreeOrderId: result.paymentDetails.orderId,
            });

            const verifyData = await verifyResponse.json();

            if (verifyResponse.ok) {
              await queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/current"] });
              await queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/check-limits"] });
              
              onOpenChange(false);
              
              toast({
                title: "Payment Successful!",
                description: "Your subscription has been activated. Welcome to unlimited access!",
              });
              
              setLocation("/");
            } else {
              throw new Error(verifyData.message || "Payment verification failed");
            }
          } catch (error: any) {
            console.error('[Cashfree] Payment verification failed:', error);
            toast({
              title: "Payment Verification Failed",
              description: error.message || "Please contact support",
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Payment Cancelled",
            description: "You cancelled the payment process.",
          });
        }
      }).catch((error: any) => {
        console.error('[Cashfree] Checkout error:', error);
        toast({
          title: "Payment Error",
          description: error.message || "An error occurred during payment",
          variant: "destructive",
        });
      });
    },
    onError: (error: any) => {
      toast({
        title: "Order Creation Failed",
        description: error.message || "Unable to create payment order",
        variant: "destructive",
      });
    },
  });

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
    createOrderMutation.mutate(planId);
  };

  const plans = plansData?.plans || [];

  const getModalTitle = () => {
    if (reason === "trial_expired") return "Free Trial Expired";
    if (reason === "renew") return "Renew Subscription";
    return "Upgrade to Pro";
  };

  const getModalDescription = () => {
    if (reason === "trial_expired") 
      return "You've used all 3 free sessions. Upgrade to continue with unlimited access!";
    if (reason === "renew") 
      return "Renew your subscription to continue enjoying unlimited access.";
    return "Choose a plan that works for you and unlock unlimited sessions.";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] sm:max-w-[90vw] lg:max-w-5xl max-h-[95vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-bold text-center">
              {getModalTitle()}
            </DialogTitle>
            <DialogDescription className="text-center text-sm sm:text-base">
              {getModalDescription()}
            </DialogDescription>
          </DialogHeader>

          {plansLoading ? (
            <div className="flex justify-center py-8 sm:py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mt-4 sm:mt-6">
              {/* Free Trial Card */}
              <Card className={`relative ${currentPlan === 'free_trial' ? 'border-purple-500 border-2' : 'border-slate-200 dark:border-slate-700'}`} data-testid="card-plan-free">
                {currentPlan === 'free_trial' && (
                  <div className="absolute -top-2 sm:-top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white px-2 sm:px-3 py-1 rounded-full text-xs font-semibold">
                    Current Plan
                  </div>
                )}
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
                    <CardTitle className="text-lg sm:text-xl">Free Trial</CardTitle>
                  </div>
                  <CardDescription className="text-sm">Get started for free</CardDescription>
                  <div className="mt-3 sm:mt-4">
                    <div className="text-3xl sm:text-4xl font-bold">$0</div>
                    <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">No payment required</div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm">3 free sessions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm">Max 1 hour per session</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm">Bring your own AI key</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm">All core features</span>
                    </li>
                  </ul>
                  {currentPlan === 'free_trial' && (
                    <Button disabled className="w-full text-sm sm:text-base" variant="outline" data-testid="button-plan-free">
                      Current Plan
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Paid Plans */}
              {plans.map((plan, index) => {
                const isYearly = plan.billingInterval === '1-year';
                const isCurrent = currentPlan === (isYearly ? 'yearly' : 'three_year');
                const discount = plan.listedPrice 
                  ? Math.round((1 - parseFloat(plan.price) / parseFloat(plan.listedPrice)) * 100)
                  : 0;

                return (
                  <Card 
                    key={plan.id} 
                    className={`relative ${index === 1 ? 'border-purple-500 border-2 shadow-xl' : 'border-slate-200 dark:border-slate-700'} ${isCurrent ? 'opacity-75' : ''}`}
                    data-testid={`card-plan-${isYearly ? 'yearly' : 'three-year'}`}
                  >
                    {index === 1 && (
                      <div className="absolute -top-2 sm:-top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-blue-900 text-white px-3 sm:px-4 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                        <Crown className="h-3 w-3" />
                        <span className="hidden sm:inline">BEST VALUE</span>
                        <span className="sm:hidden">BEST</span>
                      </div>
                    )}
                    {isCurrent && (
                      <div className="absolute -top-2 sm:-top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white px-2 sm:px-3 py-1 rounded-full text-xs font-semibold">
                        Current Plan
                      </div>
                    )}
                    <CardHeader className="p-4 sm:p-6">
                      <div className="flex items-center gap-2 mb-2">
                        {isYearly ? <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" /> : <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />}
                        <CardTitle className="text-lg sm:text-xl">{plan.name}</CardTitle>
                      </div>
                      <CardDescription className="text-sm">
                        {isYearly ? "Professional annual plan" : "Maximum savings for 3 years"}
                      </CardDescription>
                      <div className="mt-3 sm:mt-4">
                        <div className="flex items-baseline gap-2">
                          <div className="text-3xl sm:text-4xl font-bold">${plan.price}</div>
                          {plan.listedPrice && (
                            <div className="text-base sm:text-lg text-slate-500 line-through">${plan.listedPrice}</div>
                          )}
                        </div>
                        <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {plan.billingInterval} • {discount > 0 && `Save ${discount}%`}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0">
                      <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-xs sm:text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        onClick={() => handleSelectPlan(plan.id)}
                        disabled={createOrderMutation.isPending || isCurrent}
                        className={`w-full text-sm sm:text-base ${index === 1 ? 'bg-gradient-to-r from-purple-600 to-blue-900 hover:from-purple-700 hover:to-blue-950' : ''}`}
                        data-testid={`button-plan-${isYearly ? 'yearly' : 'three-year'}`}
                      >
                        {createOrderMutation.isPending && selectedPlanId === plan.id ? (
                          <>
                            <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                            <span className="hidden sm:inline">Processing...</span>
                            <span className="sm:hidden">...</span>
                          </>
                        ) : isCurrent ? (
                          "Current Plan"
                        ) : (
                          <>
                            <span className="hidden sm:inline">Upgrade to {isYearly ? "1-Year" : "3-Year"}</span>
                            <span className="sm:hidden">Upgrade</span>
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <div className="text-center text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-4 sm:mt-6 px-2">
            All plans require you to bring your own AI API keys (OpenAI, Anthropic, Google, etc.)
          </div>
        </DialogContent>
      </Dialog>
  );
}
