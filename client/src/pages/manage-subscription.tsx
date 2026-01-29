import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { HamburgerNav } from "@/components/hamburger-nav";
import { Clock, CreditCard, Loader2, Check, AlertCircle, Tag, X, CheckCircle, Download, Receipt } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Package {
  id: string;
  minutes: number;
  price: number;
  name: string;
}

interface SessionMinutesStatus {
  hasActiveMinutes: boolean;
  totalMinutesRemaining: number;
  nextExpiryDate: string | null;
  superUserAccess?: boolean;
  activePurchases?: Array<{
    id: string;
    minutesPurchased: number;
    minutesRemaining: number;
    expiryDate: string;
    purchaseDate: string;
  }>;
}

export default function ManageSubscription() {
  const [, setLocation] = useLocation();
  const { toast} = useToast();
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
  const [showReceipt, setShowReceipt] = useState(false);
  const [purchaseReceipt, setPurchaseReceipt] = useState<{
    orderId: string;
    packageName: string;
    minutesAdded: number;
    amount: string;
    currency: string;
    purchaseDate: string;
    purchaseId?: string;
  } | null>(null);

  useSEO({
    title: "Manage Subscription - Rev Winner | Session Minutes Add-ons",
    description: "Purchase session minutes packages for your Rev Winner account. Choose from flexible packages to extend your usage.",
  });

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
  const { data: packagesData, isLoading: isLoadingPackages } = useQuery<{ packages: Package[] }>({
    queryKey: ["/api/session-minutes/packages"],
  });

  // Fetch current minutes status
  const { data: minutesStatus, isLoading: isLoadingStatus } = useQuery<SessionMinutesStatus>({
    queryKey: ["/api/session-minutes/status"],
  });

  const packages = packagesData?.packages || [];

  const validatePromoCode = async () => {
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
        body: JSON.stringify({ 
          code: promoCode,
          category: 'session_minutes' // Specify category for validation
        }),
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
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
    setPromoCode("");
  };

  const calculateDiscountedPrice = (originalPrice: number): number => {
    if (!appliedPromo) return originalPrice;

    if (appliedPromo.discountType === 'percentage') {
      const discount = originalPrice * (appliedPromo.discountValue / 100);
      return Math.max(0, originalPrice - discount);
    } else {
      return Math.max(0, originalPrice - appliedPromo.discountValue);
    }
  };

  const purchasePackage = async (packageId: string) => {
    try {
      setIsPurchasing(true);
      setSelectedPackageId(packageId);

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

      // Step 1: Create order with promo code (using apiRequest for automatic token refresh)
      const orderResponse = await apiRequest(
        "POST",
        "/api/session-minutes/create-order",
        { 
          packageId,
          promoCode: appliedPromo?.code || undefined,
        }
      );

      const responseData = await orderResponse.json();
      const { 
        razorpayOrderId, 
        razorpayKeyId, 
        paymentSessionId,
        gatewayOrderId,
        orderId, 
        amount: orderAmount, 
        currency, 
        packageName: orderPackageName,
        cashfreeEnvironment // Backend will send this
      } = responseData;

      // Determine which gateway is being used
      const isRazorpay = !!razorpayKeyId;
      const isCashfree = !!paymentSessionId;

      if (isRazorpay) {
        // Import enhanced Razorpay utilities
        const { openRazorpayCheckout, createPaymentHandler } = await import("@/utils/razorpay-config");

        // Create enhanced payment handler with proper redirection
        const paymentHandler = createPaymentHandler(
          "/api/session-minutes/verify-payment",
          orderId,
          accessToken,
          () => {
            queryClient.invalidateQueries({ queryKey: ["/api/session-minutes/status"] });
            queryClient.invalidateQueries({ queryKey: ["/api/profile/invoices"] });
            const minutesAdded = packages?.find(p => p.id === packageId)?.minutes || 0;
            
            // Get package details for receipt
            const selectedPkg = packages?.find(p => p.id === packageId);
            const packageName = orderPackageName || selectedPkg?.name || "Session Minutes Package";
            const receiptAmount = orderAmount || (selectedPkg ? (appliedPromo ? 
              (appliedPromo.discountType === 'percentage' ? 
                selectedPkg.price * (1 - appliedPromo.discountValue / 100) : 
                selectedPkg.price - appliedPromo.discountValue
              ).toFixed(2) : 
              selectedPkg.price.toFixed(2)
            ) : "0.00");
            
            // Store receipt data and show receipt modal
            setPurchaseReceipt({
              orderId: orderId,
              packageName: packageName,
              minutesAdded: minutesAdded,
              amount: receiptAmount,
              currency: currency || 'USD',
              purchaseDate: new Date().toISOString(),
            });
            setShowReceipt(true);
            
            toast({
              title: "Purchase Successful!",
              description: `You've added ${minutesAdded} minutes to your account.`,
            });
          },
          (error) => {
            toast({
              title: "Payment Failed",
              description: error,
              variant: "destructive",
            });
          }
        );

        // Step 2a: Open enhanced Razorpay checkout with all payment methods
        openRazorpayCheckout({
          key: razorpayKeyId,
          amount: Math.round(parseFloat(orderAmount) * 100),
          currency: currency || 'USD',
          name: 'Rev Winner',
          description: `Session Minutes - ${orderPackageName}`,
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
            package_name: orderPackageName,
            order_type: 'session_minutes',
            package_id: packageId,
            promo_code: appliedPromo?.code || undefined
          }
        });

      } else if (isCashfree) {
        // Step 2b: Initialize Cashfree checkout
        // Load Cashfree SDK script dynamically
        const loadCashfreeScript = () => {
          return new Promise((resolve, reject) => {
            if (window.Cashfree) {
              resolve(window.Cashfree);
              return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
            script.onload = () => resolve(window.Cashfree);
            script.onerror = reject;
            document.head.appendChild(script);
          });
        };

        const Cashfree = await loadCashfreeScript();
        // Use mode from backend (cashfreeEnvironment) or fallback to sandbox
        const mode = cashfreeEnvironment || 'sandbox';
        const cashfree = Cashfree({ mode: mode });
        
        const checkoutOptions = {
          paymentSessionId: paymentSessionId,
          returnUrl: `${window.location.origin}/payment/success?orderId=${orderId}`,
        };

        cashfree.checkout(checkoutOptions).then((result: any) => {
          if (result.error) {
            toast({
              title: "Payment Failed",
              description: result.error.message || "Payment failed. Please try again.",
              variant: "destructive",
            });
            setIsPurchasing(false);
            setSelectedPackageId(null);
          }
          if (result.redirect) {
            console.log("Cashfree payment redirect");
          }
          if (result.paymentDetails) {
            // Payment successful - verify on backend
            apiRequest(
              "POST",
              "/api/session-minutes/verify-payment",
              {
                orderId: orderId,
                paymentGateway: 'cashfree',
              }
            ).then(async (verifyResponse) => {
              const verifyData = await verifyResponse.json();
              
              if (verifyResponse.ok) {
                queryClient.invalidateQueries({ queryKey: ["/api/session-minutes/status"] });
                queryClient.invalidateQueries({ queryKey: ["/api/profile/invoices"] });
                const minutesAdded = verifyData.minutesAdded || verifyData.purchase?.totalUnits || 0;
                
                const selectedPkg = packages?.find(p => p.id === packageId);
                const packageName = orderPackageName || selectedPkg?.name || "Session Minutes Package";
                const receiptAmount = orderAmount || (selectedPkg ? (appliedPromo ? 
                  (appliedPromo.discountType === 'percentage' ? 
                    selectedPkg.price * (1 - appliedPromo.discountValue / 100) : 
                    selectedPkg.price - appliedPromo.discountValue
                  ).toFixed(2) : 
                  selectedPkg.price.toFixed(2)
                ) : "0.00");
                
                setPurchaseReceipt({
                  orderId: orderId,
                  packageName: packageName,
                  minutesAdded: minutesAdded,
                  amount: receiptAmount,
                  currency: currency || 'INR',
                  purchaseDate: new Date().toISOString(),
                  purchaseId: verifyData.purchase?.id,
                });
                setShowReceipt(true);
                
                toast({
                  title: "Purchase Successful!",
                  description: `You've added ${minutesAdded} minutes to your account.`,
                });
              } else {
                toast({
                  title: "Verification Failed",
                  description: verifyData.message || "Payment verification failed.",
                  variant: "destructive",
                });
              }
              setIsPurchasing(false);
              setSelectedPackageId(null);
            }).catch((error: any) => {
              toast({
                title: "Verification Error",
                description: error.message || "Failed to verify payment.",
                variant: "destructive",
              });
              setIsPurchasing(false);
              setSelectedPackageId(null);
            });
          }
        }).catch((error: any) => {
          toast({
            title: "Payment Error",
            description: error.message || "Failed to process payment.",
            variant: "destructive",
          });
          setIsPurchasing(false);
          setSelectedPackageId(null);
        });
      } else {
        toast({
          title: "Configuration Error",
          description: "Payment gateway not properly configured.",
          variant: "destructive",
        });
        setIsPurchasing(false);
        setSelectedPackageId(null);
      }

    } catch (error: any) {
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
      setIsPurchasing(false);
      setSelectedPackageId(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    });
  };

  const getDaysRemaining = (expiryDate: string | null) => {
    if (!expiryDate) return 0;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900">
      <HamburgerNav />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Manage Subscription</h1>
          <p className="text-muted-foreground">Purchase session minutes packages to extend your usage</p>
        </div>

        {/* Current Balance Card */}
        <Card className="mb-8 shadow-lg border-border/40" data-testid="card-minutes-balance">
          <CardHeader className="border-b border-border/30 bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg shadow-md">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-xl font-bold">Session Minutes Balance</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {isLoadingStatus ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
              </div>
            ) : minutesStatus ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-lg border border-border/30">
                  <p className="text-sm text-muted-foreground mb-1">Total Minutes Remaining</p>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400" data-testid="text-minutes-remaining">
                    {minutesStatus.totalMinutesRemaining}
                  </p>
                </div>
                
                <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg border border-border/30">
                  <p className="text-sm text-muted-foreground mb-1">Next Expiry Date</p>
                  <p className="text-lg font-semibold text-foreground" data-testid="text-expiry-date">
                    {formatDate(minutesStatus.nextExpiryDate)}
                  </p>
                </div>
                
                <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-lg border border-border/30">
                  <p className="text-sm text-muted-foreground mb-1">Days Remaining</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400" data-testid="text-days-remaining">
                    {getDaysRemaining(minutesStatus.nextExpiryDate)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">Failed to load minutes balance</p>
            )}

            {!minutesStatus?.hasActiveMinutes && (
              <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-orange-900 dark:text-orange-100">No Active Minutes</p>
                  <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                    Purchase a session minutes package below to continue using the platform.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Packages */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Available Packages</h2>
          <p className="text-muted-foreground mb-6">
            All packages are valid for 30 days or until minutes are exhausted, whichever comes first.
          </p>

          {/* Promo Code Section */}
          {!appliedPromo ? (
            <Card className="mb-6 shadow-md border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50 to-fuchsia-50 dark:from-purple-950 dark:to-fuchsia-950">
              <CardContent className="p-6">
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
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-6 shadow-md border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950">
              <CardContent className="p-6">
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
              </CardContent>
            </Card>
          )}

          {isLoadingPackages ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {packages.map((pkg) => (
                <Card 
                  key={pkg.id} 
                  className="shadow-md hover:shadow-lg transition-all border-2 hover:border-purple-400 dark:hover:border-purple-600"
                  data-testid={`card-package-${pkg.id}`}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-100">
                        {pkg.minutes} min
                      </Badge>
                      {appliedPromo ? (
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground line-through">
                            ${pkg.price}
                          </div>
                          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            ${calculateDiscountedPrice(pkg.price).toFixed(2)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          ${pkg.price}
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-lg">{pkg.name}</CardTitle>
                    <CardDescription>
                      Valid for 30 days or until exhausted
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-4">
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>{pkg.minutes} session minutes</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>30-day validity</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>${(pkg.price / pkg.minutes).toFixed(3)}/min</span>
                      </li>
                    </ul>
                    <Button
                      onClick={() => purchasePackage(pkg.id)}
                      disabled={isPurchasing && selectedPackageId === pkg.id}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                      data-testid={`button-purchase-${pkg.id}`}
                    >
                      {isPurchasing && selectedPackageId === pkg.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-4 w-4" />
                          {appliedPromo 
                            ? `Purchase $${calculateDiscountedPrice(pkg.price).toFixed(2)}`
                            : `Purchase $${pkg.price}`}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Active Purchases */}
        {minutesStatus && minutesStatus.activePurchases && minutesStatus.activePurchases.length > 0 && (
          <Card className="shadow-lg border-border/40" data-testid="card-active-purchases">
            <CardHeader className="border-b border-border/30 bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20">
              <CardTitle className="text-xl font-bold">Active Purchases</CardTitle>
              <CardDescription>Your current session minutes packages</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {minutesStatus.activePurchases.map((purchase) => (
                  <div 
                    key={purchase.id} 
                    className="p-4 bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg border border-border/30"
                    data-testid={`purchase-${purchase.id}`}
                  >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Purchased</p>
                        <p className="font-semibold">{purchase.minutesPurchased} min</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Remaining</p>
                        <p className="font-semibold text-purple-600 dark:text-purple-400">{purchase.minutesRemaining} min</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Expires On</p>
                        <p className="font-semibold">{formatDate(purchase.expiryDate)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Purchased On</p>
                        <p className="font-semibold">{formatDate(purchase.purchaseDate)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Purchase Receipt Modal */}
        <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <DialogTitle className="text-2xl font-bold">Purchase Receipt</DialogTitle>
              </div>
              <DialogDescription>
                Your purchase has been successfully processed
              </DialogDescription>
            </DialogHeader>

            {purchaseReceipt && (
              <div className="space-y-6 py-4">
                {/* Receipt Header */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 p-4 rounded-lg border border-border/30">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Order ID</p>
                      <p className="font-mono text-sm font-semibold">{purchaseReceipt.orderId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="font-semibold">{new Date(purchaseReceipt.purchaseDate).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Purchase Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Purchase Details
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Package</p>
                      <p className="font-semibold">{purchaseReceipt.packageName}</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Minutes Added</p>
                      <p className="font-semibold text-purple-600 dark:text-purple-400">{purchaseReceipt.minutesAdded.toLocaleString()} min</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Payment Summary */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Summary
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-semibold">{purchaseReceipt.currency} {parseFloat(purchaseReceipt.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    {appliedPromo && (
                      <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          Discount ({appliedPromo.code})
                        </span>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          -{purchaseReceipt.currency} {
                            appliedPromo.discountType === 'percentage' 
                              ? (parseFloat(purchaseReceipt.amount) * appliedPromo.discountValue / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                              : appliedPromo.discountValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          }
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-lg border-2 border-purple-200 dark:border-purple-800">
                      <span className="text-lg font-bold">Total Paid</span>
                      <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {purchaseReceipt.currency} {parseFloat(purchaseReceipt.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {purchaseReceipt.purchaseId && (
                  <>
                    <Separator />
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-muted-foreground mb-1">Purchase ID</p>
                      <p className="font-mono text-xs">{purchaseReceipt.purchaseId}</p>
                    </div>
                  </>
                )}
              </div>
            )}

            <DialogFooter className="flex gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => {
                  setShowReceipt(false);
                  setPurchaseReceipt(null);
                }}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  if (purchaseReceipt) {
                    window.location.href = `/invoice?orderId=${purchaseReceipt.orderId}`;
                  }
                }}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Download className="mr-2 h-4 w-4" />
                View Full Invoice
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
