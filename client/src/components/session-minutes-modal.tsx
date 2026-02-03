import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { openRazorpayCheckout, createPaymentHandler } from "@/utils/razorpay-config";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Clock, Zap, CheckCircle, Loader2, Tag, X } from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface SessionMinutesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Package {
  id: string;
  minutes: number;
  price: number;
  name: string;
}

export function SessionMinutesModal({ open, onOpenChange }: SessionMinutesModalProps) {
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discountType: string;
    discountValue: number;
  } | null>(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Fetch available packages
  const { data: packagesData } = useQuery<{ packages: Package[] }>({
    queryKey: ["/api/session-minutes/packages"],
  });

  // Fetch current session minutes status
  const { data: statusData } = useQuery<{
    hasActiveMinutes: boolean;
    totalMinutesRemaining: number;
    totalMinutes: number;
    usedMinutes: number;
    nextExpiryDate: string | null;
  }>({
    queryKey: ["/api/session-minutes/status"],
  });

  const packages = packagesData?.packages || [];

  async function validatePromoCode() {
    if (!promoCode.trim()) {
      toast({
        title: "Invalid Promo Code",
        description: "Please enter a promo code.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsValidatingPromo(true);
      const accessToken = localStorage.getItem("accessToken");
      
      const response = await fetch(`/api/promo-codes/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ code: promoCode }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setAppliedPromo({
          code: data.promoCode.code,
          discountType: data.promoCode.discountType,
          discountValue: data.promoCode.discountValue,
        });
        toast({
          title: "Promo Code Applied!",
          description: `${data.promoCode.discountType === 'percentage' 
            ? `${data.promoCode.discountValue}%` 
            : `$${data.promoCode.discountValue}`} discount applied.`,
        });
      } else {
        toast({
          title: "Invalid Promo Code",
          description: data.message || "The promo code you entered is not valid.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to validate promo code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsValidatingPromo(false);
    }
  }

  function removePromoCode() {
    setAppliedPromo(null);
    setPromoCode("");
  }

  function calculateDiscountedPrice(originalPrice: number): number {
    if (!appliedPromo) return originalPrice;

    if (appliedPromo.discountType === 'percentage') {
      const discount = originalPrice * (appliedPromo.discountValue / 100);
      return Math.max(0, originalPrice - discount);
    } else {
      return Math.max(0, originalPrice - appliedPromo.discountValue);
    }
  }

  async function purchaseSessionMinutes(packageId: string) {
    try {
      setIsPurchasing(true);
      setSelectedPackageId(packageId);

      // Check authentication
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        toast({
          title: "Authentication Required",
          description: "Please log in to purchase session minutes.",
          variant: "destructive",
        });
        setIsPurchasing(false);
        setSelectedPackageId(null);
        return;
      }

      // Create order with specific package and promo code
      const orderResponse = await fetch("/api/session-minutes/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ 
          packageId,
          promoCode: appliedPromo?.code || undefined,
        }),
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

      const { razorpayOrderId, razorpayKeyId, orderId, packageName, amount, currency } = await orderResponse.json();

      // Create enhanced payment handler
      const paymentHandler = createPaymentHandler(
        "/api/session-minutes/verify-payment",
        orderId,
        accessToken,
        () => {
          queryClient.invalidateQueries({ queryKey: ["/api/session-minutes/status"] });
          toast({
            title: "Session Minutes Purchased!",
            description: `Successfully purchased ${packageName}. Your minutes are now available.`,
          });
          onOpenChange(false);
        },
        (error) => {
          toast({
            title: "Payment Failed",
            description: error,
            variant: "destructive",
          });
        }
      );

      // Open Razorpay checkout with enhanced configuration
      openRazorpayCheckout({
        key: razorpayKeyId,
        amount: Math.round(parseFloat(amount) * 100),
        currency: currency || 'USD',
        name: 'Rev Winner',
        description: `Session Minutes - ${packageName}`,
        order_id: razorpayOrderId,
        handler: paymentHandler,
        modal: {
          ondismiss: () => {
            toast({
              title: "Payment Cancelled",
              description: "You cancelled the payment process.",
            });
            setIsPurchasing(false);
            setSelectedPackageId(null);
          }
        },
        prefill: {
          name: 'Customer',
          email: 'customer@revwinner.com'
        },
        notes: {
          package_name: packageName,
          order_type: 'session_minutes'
        }
      });

    } catch (error: any) {
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
      setIsPurchasing(false);
      setSelectedPackageId(null);
    }
  }

  const costPerMinute = (price: number, minutes: number) => {
    return (price / minutes).toFixed(3);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Purchase Session Minutes
          </DialogTitle>
          <DialogDescription className="text-base">
            {statusData && statusData.totalMinutesRemaining > 0 ? (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="h-4 w-4" />
                You have {statusData.totalMinutesRemaining} minutes remaining
              </div>
            ) : (
              "Choose a package to get started with session minutes"
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  About Session Minutes
                </h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Session minutes are required to start live transcription sessions</li>
                  <li>• Valid for 30 days from purchase OR until exhausted (whichever comes first)</li>
                  <li>• Consumed in FIFO order (oldest packages used first)</li>
                  <li>• Choose a larger package for better value per minute</li>
                </ul>
              </div>
            </div>
          </div>

          {!appliedPromo ? (
            <div className="bg-gradient-to-r from-purple-50 to-fuchsia-50 dark:from-purple-950 dark:to-fuchsia-950 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Tag className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                    Have a Promo Code?
                  </h4>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Enter promo code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && validatePromoCode()}
                      className="flex-1 bg-white dark:bg-gray-900"
                      disabled={isValidatingPromo}
                      data-testid="input-promo-code"
                    />
                    <Button
                      onClick={validatePromoCode}
                      disabled={!promoCode.trim() || isValidatingPromo}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                      data-testid="button-apply-promo"
                    >
                      {isValidatingPromo ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Validating...
                        </>
                      ) : (
                        "Apply"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                      Promo Code Applied!
                    </h4>
                    <div className="text-sm text-green-700 dark:text-green-300">
                      <span className="font-mono font-semibold">{appliedPromo.code}</span>
                      {' - '}
                      <span>
                        {appliedPromo.discountType === 'percentage'
                          ? `${appliedPromo.discountValue}% discount`
                          : `$${appliedPromo.discountValue} off`}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removePromoCode}
                  className="text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100"
                  data-testid="button-remove-promo"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {packages.map((pkg) => (
              <Card
                key={pkg.id}
                className="hover:border-purple-500 dark:hover:border-purple-400 transition-all cursor-pointer relative overflow-hidden group"
                data-testid={`card-session-minutes-${pkg.id}`}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <Badge className="bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white">
                      {pkg.minutes} min
                    </Badge>
                    {pkg.minutes >= 5000 && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                        <Zap className="h-3 w-3 mr-1" />
                        Best Value
                      </Badge>
                    )}
                  </div>

                  <div>
                    {appliedPromo ? (
                      <div>
                        <div className="text-sm text-muted-foreground line-through">
                          ${pkg.price}
                        </div>
                        <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                          ${calculateDiscountedPrice(pkg.price).toFixed(2)}
                        </div>
                      </div>
                    ) : (
                      <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        ${pkg.price}
                      </div>
                    )}
                    <div className="text-sm text-muted-foreground">{pkg.name}</div>
                  </div>

                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{pkg.minutes} session minutes</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>Valid for 30 days</span>
                    </div>
                    <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                      ${costPerMinute(pkg.price, pkg.minutes)}/minute
                    </div>
                  </div>

                  <Button
                    onClick={() => purchaseSessionMinutes(pkg.id)}
                    disabled={isPurchasing}
                    className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white"
                    data-testid={`button-purchase-session-minutes-${pkg.id}`}
                  >
                    {isPurchasing && selectedPackageId === pkg.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Purchasing...
                      </>
                    ) : appliedPromo ? (
                      `Purchase - $${calculateDiscountedPrice(pkg.price).toFixed(2)}`
                    ) : (
                      `Purchase - $${pkg.price}`
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
