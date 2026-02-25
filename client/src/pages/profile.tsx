import { useState, useEffect, Fragment } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HamburgerNav } from "@/components/hamburger-nav";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { User, Mail, Phone, Building2, Calendar, CreditCard, Download, ShieldCheck, Clock, GraduationCap, Loader2, Video, ChevronDown, ChevronUp, Search } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ProfileData {
  id: string;
  email: string;
  mobile: string | null;
  firstName: string;
  lastName: string;
  organization: string | null;
  username: string;
  createdAt: string;
}

interface SessionHistoryItem {
  sessionId: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  summary?: string | null;
}

interface SubscriptionData {
  id?: string;
  planType: string;
  status: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  sessionsUsed?: string;
  sessionsLimit?: string;
  minutesUsed?: string;
  minutesLimit?: string;
  sessionHistory?: SessionHistoryItem[];
  plan: {
    name: string;
    price: string;
    currency: string;
    billingInterval: string;
  } | null;
  message?: string;
}

interface Invoice {
  id: string;
  amount: string;
  currency: string;
  status: string;
  paymentMethod: string | null;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  receiptUrl: string | null;
  createdAt: string;
  metadata: any;
}

interface TrainMeStatus {
  active: boolean;
  purchaseDate: string | null;
  daysRemaining: number;
  expiryDate: string | null;
}

interface CallRecording {
  id: string;
  fileName: string;
  fileSize: number | null;
  duration: number | null;
  recordingUrl: string | null;
  conversationId: string | null;
  status: string;
  createdAt: string;
  expiresAt: string;
}

export default function Profile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRecordingsOpen, setIsRecordingsOpen] = useState(false);
  const [recordingsSearchDate, setRecordingsSearchDate] = useState("");
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  
  useSEO({
    title: "My Profile - Rev Winner | Account & Subscription Details",
    description: "View your Rev Winner account information, subscription status, session usage, and payment history. Manage your AI sales assistant account settings.",
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

  // Fetch profile data
  const { data: profileData, isLoading: isLoadingProfile } = useQuery<ProfileData>({
    queryKey: ["/api/profile"],
  });

  // Fetch subscription data
  const { data: subscriptionData, isLoading: isLoadingSubscription } = useQuery<SubscriptionData>({
    queryKey: ["/api/profile/subscription"],
  });

  // Fetch invoice history
  const { data: invoicesData, isLoading: isLoadingInvoices } = useQuery<{ invoices: Invoice[] }>({
    queryKey: ["/api/profile/invoices"],
  });
  
  // Fetch Train Me subscription status
  const { data: trainMeStatus, isLoading: isLoadingTrainMe } = useQuery<TrainMeStatus>({
    queryKey: ["/api/train-me/status"],
  });
  
  // Fetch Session Minutes status
  const { data: sessionMinutesStatus, isLoading: isLoadingMinutes } = useQuery<{
    hasActiveMinutes: boolean;
    totalMinutesRemaining: number;
    totalMinutes: number;
    usedMinutes: number;
    nextExpiryDate: string | null;
  }>({
    queryKey: ["/api/session-minutes/status"],
  });
  
  // Fetch Call Recordings
  const { data: recordingsData, isLoading: isLoadingRecordings } = useQuery<{ recordings: CallRecording[] }>({
    queryKey: ["/api/call-recordings"],
  });
  
  // Purchase Train Me subscription using Razorpay
  const purchaseTrainMe = async () => {
    try {
      setIsPurchasing(true);
      
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        toast({
          title: "Authentication Required",
          description: "Please log in to purchase Train Me.",
          variant: "destructive",
        });
        setIsPurchasing(false);
        return;
      }

      // Step 1: Create order (backend will use Cashfree by default)
      const orderResponse = await fetch("/api/train-me/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          // Let backend use the configured default payment gateway
        }),
      });

      if (!orderResponse.ok) {
        const error = await orderResponse.json();
        throw new Error(error.message || "Failed to create order");
      }

      const orderData = await orderResponse.json();
      const { orderId, paymentSessionId, amount, currency, cashfreeEnvironment } = orderData;

      // Check if we got Cashfree response
      if (paymentSessionId) {
        // Cashfree payment flow
        console.log('[Train Me] Using Cashfree payment gateway');
        
        // Load Cashfree SDK if not already loaded
        if (!window.Cashfree) {
          const script = document.createElement('script');
          script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
          script.async = true;
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
          });
        }

        // Initialize Cashfree
        const cashfree = window.Cashfree({
          mode: cashfreeEnvironment === 'PRODUCTION' ? 'production' : 'sandbox'
        });

        // Create checkout options
        const checkoutOptions = {
          paymentSessionId: paymentSessionId,
          returnUrl: `${window.location.origin}/payment/success?orderId=${orderId}&type=trainme`,
          redirectTarget: '_self'
        };

        // Open Cashfree checkout
        cashfree.checkout(checkoutOptions).then(() => {
          console.log('[Train Me] Cashfree checkout initiated');
        }).catch((error: any) => {
          console.error('[Train Me] Cashfree checkout error:', error);
          toast({
            title: "Payment Failed",
            description: error.message || "Failed to open payment gateway",
            variant: "destructive",
          });
          setIsPurchasing(false);
        });
      } else if (orderData.razorpayOrderId) {
        // Razorpay payment flow (fallback)
        console.log('[Train Me] Using Razorpay payment gateway');
        
        const options = {
          key: orderData.razorpayKeyId,
          amount: Math.round(parseFloat(amount) * 100),
          currency: currency || 'INR',
          name: 'Rev Winner',
          description: 'Train Me Subscription',
          order_id: orderData.razorpayOrderId,
          handler: async function (response: any) {
            try {
              const verifyResponse = await fetch("/api/train-me/verify-payment", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                  orderId,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });

              const verifyData = await verifyResponse.json();

              if (verifyResponse.ok) {
                queryClient.invalidateQueries({ queryKey: ["/api/train-me/status"] });
                queryClient.invalidateQueries({ queryKey: ["/api/profile/invoices"] });
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
            setIsPurchasing(false);
          },
          modal: {
            ondismiss: function () {
              toast({
                title: "Payment Cancelled",
                description: "You cancelled the payment process.",
              });
              setIsPurchasing(false);
            }
          },
          theme: {
            color: '#6366f1'
          }
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } else {
        throw new Error("Invalid payment gateway response");
      }

    } catch (error: any) {
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
      setIsPurchasing(false);
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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatCurrency = (amount: string, currency: string) => {
    const numAmount = parseFloat(amount);
    const locale = currency === "INR" ? "en-IN" : "en-US";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency || "INR",
    }).format(numAmount);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: any; label: string }> = {
      active: { variant: "default", label: "Active" },
      trial: { variant: "secondary", label: "Trial" },
      expired: { variant: "destructive", label: "Expired" },
      canceled: { variant: "outline", label: "Canceled" },
      succeeded: { variant: "default", label: "Paid" },
      pending: { variant: "secondary", label: "Pending" },
      failed: { variant: "destructive", label: "Failed" },
    };
    const statusInfo = statusMap[status] || { variant: "outline", label: status };
    return <Badge variant={statusInfo.variant as any}>{statusInfo.label}</Badge>;
  };

  const handleDownloadInvoice = (invoice: Invoice) => {
    // Navigate to the invoice page instead of opening API endpoint
    const orderId = invoice.metadata?.cartOrderId || invoice.metadata?.pendingOrderId || invoice.id;
    setLocation(`/invoice?orderId=${orderId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950">
      <HamburgerNav currentPath="/profile" />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card className="shadow-lg border-border/40" data-testid="card-personal-info">
            <CardHeader className="border-b border-border/30 bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg shadow-md">
                  <User className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-xl font-bold">Personal Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {isLoadingProfile ? (
                <div className="space-y-4">
                  <div className="h-4 bg-muted animate-pulse rounded"></div>
                  <div className="h-4 bg-muted animate-pulse rounded"></div>
                  <div className="h-4 bg-muted animate-pulse rounded"></div>
                </div>
              ) : profileData ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-semibold text-foreground" data-testid="text-fullname">
                        {profileData.firstName} {profileData.lastName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-semibold text-foreground break-all" data-testid="text-email">
                        {profileData.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Phone Number</p>
                      <p className="font-semibold text-foreground" data-testid="text-phone">
                        {profileData.mobile || "Not provided"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Organization</p>
                      <p className="font-semibold text-foreground" data-testid="text-organization">
                        {profileData.organization || "Not specified"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Member Since</p>
                      <p className="font-semibold text-foreground" data-testid="text-member-since">
                        {formatDate(profileData.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Failed to load profile data</p>
              )}
            </CardContent>
          </Card>

          {/* Subscription Information */}
          <Card className="shadow-lg border-border/40" data-testid="card-subscription">
            <CardHeader className="border-b border-border/30 bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg shadow-md">
                  <ShieldCheck className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-xl font-bold">Subscription</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {isLoadingSubscription ? (
                <div className="space-y-4">
                  <div className="h-4 bg-muted animate-pulse rounded"></div>
                  <div className="h-4 bg-muted animate-pulse rounded"></div>
                </div>
              ) : subscriptionData ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Subscription Type</p>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-lg capitalize" data-testid="text-plan-type">
                        {subscriptionData.plan?.name || subscriptionData.planType.replace("_", " ")}
                      </p>
                      {getStatusBadge(subscriptionData.status)}
                    </div>
                  </div>

                  {subscriptionData.plan && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Price</p>
                      <p className="font-semibold text-foreground" data-testid="text-price">
                        {formatCurrency(subscriptionData.plan.price, subscriptionData.plan.currency)} / {subscriptionData.plan.billingInterval}
                      </p>
                    </div>
                  )}

                  {subscriptionData.currentPeriodStart && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Start Date</p>
                      <p className="font-semibold text-foreground" data-testid="text-start-date">
                        {formatDate(subscriptionData.currentPeriodStart)}
                      </p>
                    </div>
                  )}

                  {subscriptionData.currentPeriodEnd && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">End Date</p>
                      <p className="font-semibold text-foreground" data-testid="text-end-date">
                        {formatDate(subscriptionData.currentPeriodEnd)}
                      </p>
                    </div>
                  )}

                  {subscriptionData.message && (
                    <p className="text-sm text-muted-foreground italic">{subscriptionData.message}</p>
                  )}

                  <Button
                    onClick={() => setLocation("/packages")}
                    className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                    data-testid="button-browse-packages"
                  >
                    Browse Packages
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground">Failed to load subscription data</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Session Minutes Balance */}
        <Card className="shadow-lg border-border/40 mt-6" data-testid="card-session-minutes">
          <CardHeader className="border-b border-border/30 bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg shadow-md">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl font-bold">Session Minutes</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Manage your session minutes balance</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {isLoadingMinutes ? (
              <div className="space-y-4">
                <div className="h-4 bg-muted animate-pulse rounded"></div>
                <div className="h-4 bg-muted animate-pulse rounded"></div>
              </div>
            ) : sessionMinutesStatus ? (
              <div className="space-y-4">
                {/* Show detailed stats ONLY if user has purchased packages */}
                {sessionMinutesStatus.hasPurchasedPackages ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-lg border border-border/30">
                        <p className="text-sm text-muted-foreground mb-1">Minutes Remaining</p>
                        <p className="text-3xl font-bold text-purple-600 dark:text-purple-400" data-testid="text-minutes-remaining">
                          {sessionMinutesStatus.totalMinutesRemaining}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {subscriptionData?.minutesUsed || sessionMinutesStatus.usedMinutes || 0} used / {sessionMinutesStatus.totalMinutes !== Infinity ? sessionMinutesStatus.totalMinutes : 'Unlimited'} total
                        </p>
                      </div>
                      
                      <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg border border-border/30">
                        <p className="text-sm text-muted-foreground mb-1">Next Expiry</p>
                        <p className="text-sm font-semibold text-foreground" data-testid="text-minutes-expiry">
                          {sessionMinutesStatus.nextExpiryDate ? formatDate(sessionMinutesStatus.nextExpiryDate) : "N/A"}
                        </p>
                      </div>
                    </div>

                    {/* Usage Summary - Always show if we have total minutes data */}
                    {(sessionMinutesStatus.totalMinutes !== Infinity || (subscriptionData?.minutesUsed && parseInt(subscriptionData.minutesUsed) > 0)) && (
                      <div className="p-4 bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/30 dark:to-gray-950/30 rounded-lg border border-border/30">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm text-muted-foreground">Usage Summary</p>
                          <p className="text-xs text-muted-foreground">
                            {subscriptionData?.minutesUsed || sessionMinutesStatus.usedMinutes || 0} / {sessionMinutesStatus.totalMinutes !== Infinity ? sessionMinutesStatus.totalMinutes : 'Unlimited'} minutes used
                          </p>
                        </div>
                        {sessionMinutesStatus.totalMinutes !== Infinity && (
                          <>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ 
                                  width: `${Math.min(100, ((subscriptionData?.minutesUsed ? parseInt(subscriptionData.minutesUsed) : sessionMinutesStatus.usedMinutes) / sessionMinutesStatus.totalMinutes) * 100)}%` 
                                }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                              <span>{subscriptionData?.minutesUsed || sessionMinutesStatus.usedMinutes || 0} used</span>
                              <span>{sessionMinutesStatus.totalMinutesRemaining} remaining</span>
                            </div>
                          </>
                        )}
                        {sessionMinutesStatus.totalMinutes === Infinity && (
                          <div className="text-center py-2">
                            <p className="text-sm text-green-600 dark:text-green-400 font-semibold">
                              ✨ Unlimited Minutes - {subscriptionData?.minutesUsed || 0} minutes used
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  /* Clean UI when no packages purchased - regardless of trial usage */
                  <div className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 rounded-lg border border-orange-200 dark:border-orange-800 text-center">
                    <div className="mb-3">
                      <svg className="w-12 h-12 mx-auto text-orange-500 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-lg font-bold text-orange-900 dark:text-orange-100 mb-2">
                      No Session Minutes Purchased
                    </p>
                    <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
                      Purchase Session Minutes packages to continue using the platform.
                    </p>
                    {sessionMinutesStatus.usedMinutes > 0 && (
                      <p className="text-xs text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/50 rounded px-3 py-2 inline-block">
                        You've used {sessionMinutesStatus.usedMinutes} minutes from your free trial
                      </p>
                    )}
                  </div>
                )}
                
                {!sessionMinutesStatus.hasActiveMinutes && sessionMinutesStatus.hasPurchasedPackages && (
                  <div className="p-4 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg">
                    <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                      {sessionMinutesStatus.totalMinutes === 0 && subscriptionData?.planType === 'free_trial' 
                        ? 'Free Trial Expired - Purchase Required' 
                        : sessionMinutesStatus.totalMinutes === 0 
                        ? 'No Session Minutes Available' 
                        : 'No Active Session Minutes'}
                    </p>
                    <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                      {sessionMinutesStatus.totalMinutes === 0 && subscriptionData?.planType === 'free_trial'
                        ? 'Purchase Platform Access & Session Minutes to continue. Secured by Cashfree Payments.'
                        : 'Purchase Session Minutes packages to continue using the platform. Secured by Cashfree Payments.'}
                    </p>
                  </div>
                )}
                
                <Button
                  onClick={() => setLocation(sessionMinutesStatus.totalMinutes === 0 && subscriptionData?.planType === 'free_trial' ? "/packages" : "/manage-subscription")}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                  data-testid="button-manage-minutes"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  {sessionMinutesStatus.totalMinutes === 0 && subscriptionData?.planType === 'free_trial' 
                    ? 'View Packages' 
                    : 'Purchase Session Minutes'}
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground">Failed to load session minutes status</p>
            )}
          </CardContent>
        </Card>

        {/* Train Me Subscription */}
        <Card className="shadow-lg border-border/40 mt-6" data-testid="card-train-me">
          <CardHeader className="border-b border-border/30 bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg shadow-md">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl font-bold">Train Me Add-On</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Upload documents and train the AI on your specific domain</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {isLoadingTrainMe ? (
              <div className="space-y-4">
                <div className="h-4 bg-muted animate-pulse rounded"></div>
                <div className="h-4 bg-muted animate-pulse rounded"></div>
              </div>
            ) : trainMeStatus ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Status</p>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-lg" data-testid="text-train-me-status">
                        {trainMeStatus.active ? "Active" : "Inactive"}
                      </p>
                      {trainMeStatus.active ? (
                        <Badge variant="default">30-Day Access</Badge>
                      ) : (
                        <Badge variant="outline">Not Subscribed</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {trainMeStatus.active && trainMeStatus.purchaseDate && (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Purchase Date</p>
                      <p className="font-semibold text-foreground" data-testid="text-train-me-purchase-date">
                        {formatDate(trainMeStatus.purchaseDate)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Expiry Date</p>
                      <p className="font-semibold text-foreground" data-testid="text-train-me-expiry-date">
                        {formatDate(trainMeStatus.expiryDate)}
                      </p>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-sm font-medium text-green-900 dark:text-green-100">
                        <span className="font-bold text-2xl" data-testid="text-days-remaining">{trainMeStatus.daysRemaining}</span> days remaining
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                        Upload documents and create domain expertise profiles in the Train Me section
                      </p>
                    </div>
                  </>
                )}

                {!trainMeStatus.active && (
                  <div className="space-y-3">
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                      <h3 className="font-semibold text-foreground mb-2">What's Included:</h3>
                      <ul className="text-sm space-y-1.5 text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <span className="text-blue-500 mt-0.5">✓</span>
                          <span>Create up to 5 domain expertise profiles</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-500 mt-0.5">✓</span>
                          <span>Upload up to 100 documents per domain (PDF, DOC, DOCX, TXT, XLS, XLSX, CSV, PPT, PPTX)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-500 mt-0.5">✓</span>
                          <span>Train AI with your specific product knowledge and pricing</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-500 mt-0.5">✓</span>
                          <span>Get accurate, domain-specific answers during sales calls</span>
                        </li>
                      </ul>
                      <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold mt-3">
                        30 days of access from purchase date
                      </p>
                    </div>

                    <Button
                      onClick={purchaseTrainMe}
                      disabled={isPurchasing}
                      className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                      data-testid="button-purchase-trainme"
                    >
                      {isPurchasing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Purchase Train Me Add-on ($15)"
                      )}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">Failed to load Train Me subscription status</p>
            )}
          </CardContent>
        </Card>

        {/* Session History & Usage */}
        <Card className="shadow-lg border-border/40 mt-6" data-testid="card-session-history">
          <CardHeader className="border-b border-border/30 bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg shadow-md">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-xl font-bold">Session History & Usage</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {isLoadingSubscription ? (
              <div className="space-y-3">
                <div className="h-16 bg-muted animate-pulse rounded"></div>
                <div className="h-16 bg-muted animate-pulse rounded"></div>
              </div>
            ) : subscriptionData ? (
              <div className="space-y-6">
                {/* Total Usage Card */}
                {sessionMinutesStatus && (
                  <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border-purple-200 dark:border-purple-800">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Total Usage</p>
                          <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                            {Math.floor((sessionMinutesStatus.usedMinutes || 0) / 60)}h {(sessionMinutesStatus.usedMinutes || 0) % 60}m
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {subscriptionData.sessionsUsed || "0"} session{(subscriptionData.sessionsUsed || "0") !== "1" ? "s" : ""}
                          </p>
                        </div>
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                          <Clock className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Usage Summary with Session Minutes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-lg border border-border/30">
                    <p className="text-xs text-muted-foreground mb-1">Total Sessions</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-sessions-used">
                      {subscriptionData.sessionsUsed || "0"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {subscriptionData.minutesUsed || "0"} minutes used
                    </p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-lg border border-border/30">
                    <p className="text-xs text-muted-foreground mb-1">Minutes Remaining</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400" data-testid="text-minutes-remaining-detailed">
                      {sessionMinutesStatus?.totalMinutesRemaining || 
                       (subscriptionData.minutesLimit && subscriptionData.minutesLimit !== 'unlimited'
                        ? Math.max(0, parseInt(subscriptionData.minutesLimit) - parseInt(subscriptionData.minutesUsed || "0"))
                        : "Unlimited")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {subscriptionData.minutesUsed || sessionMinutesStatus?.usedMinutes || 0} used / {sessionMinutesStatus?.totalMinutes !== Infinity ? sessionMinutesStatus?.totalMinutes || subscriptionData.minutesLimit : 'Unlimited'} total
                    </p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-lg border border-border/30">
                    <p className="text-xs text-muted-foreground mb-1">Next Expiry</p>
                    <p className="text-sm font-semibold text-foreground" data-testid="text-expiry-date">
                      {sessionMinutesStatus?.nextExpiryDate ? formatDate(sessionMinutesStatus.nextExpiryDate) : "N/A"}
                    </p>
                  </div>
                </div>

                {/* Enhanced Session History Table */}
                <EnhancedSessionHistoryTable sessionHistory={subscriptionData.sessionHistory} />
              </div>
            ) : (
              <p className="text-muted-foreground">Failed to load session history</p>
            )}
          </CardContent>
        </Card>

        {/* Call Recordings - Under Development */}
        <Card className="shadow-lg border-border/40 mt-6" data-testid="card-recordings">
          <Collapsible open={isRecordingsOpen} onOpenChange={setIsRecordingsOpen}>
            <CardHeader className="border-b border-border/30 bg-gradient-to-r from-red-50/50 to-pink-50/50 dark:from-red-950/20 dark:to-pink-950/20">
              <CollapsibleTrigger className="flex items-center justify-between w-full group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg shadow-md">
                    <Video className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-left">Call Recordings</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1 text-left">Feature under development</p>
                  </div>
                </div>
                {isRecordingsOpen ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="p-6">
                <div className="text-center py-8 text-muted-foreground">
                  <Video className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-semibold">Call Recording - Coming Soon</p>
                  <p className="text-xs mt-2">This feature is currently under development and will be available in a future update.</p>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Invoice History */}
        <Card className="shadow-lg border-border/40 mt-6" data-testid="card-invoices">
          <CardHeader className="border-b border-border/30 bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg shadow-md">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-xl font-bold">Invoice History</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {isLoadingInvoices ? (
              <div className="space-y-3">
                <div className="h-16 bg-muted animate-pulse rounded"></div>
                <div className="h-16 bg-muted animate-pulse rounded"></div>
              </div>
            ) : invoicesData && invoicesData.invoices.length > 0 ? (
              <div className="space-y-3">
                {invoicesData.invoices.map((invoice, index) => (
                  <div
                    key={invoice.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    data-testid={`invoice-${index}`}
                  >
                    <div className="flex-1 space-y-1 mb-3 sm:mb-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">
                          {formatCurrency(invoice.amount, invoice.currency)}
                        </p>
                        {getStatusBadge(invoice.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(invoice.createdAt)}
                      </p>
                      {invoice.razorpayPaymentId && (
                        <p className="text-xs text-muted-foreground font-mono">
                          ID: {invoice.razorpayPaymentId}
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={() => handleDownloadInvoice(invoice)}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      data-testid={`button-download-invoice-${index}`}
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CreditCard className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground">No invoices found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your payment history will appear here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

// Enhanced Session History Table Component
function EnhancedSessionHistoryTable({ sessionHistory }: { sessionHistory?: SessionHistoryItem[] }) {
  const [selectedSummary, setSelectedSummary] = useState<{ summary: string; sessionNumber: number } | null>(null);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const parseSummarySections = (summaryText: string) => {
    const sectionRegex = /([A-Za-z][A-Za-z &]+):/g;
    const matches = Array.from(summaryText.matchAll(sectionRegex));
    if (matches.length === 0) {
      return null;
    }

    return matches.map((match, index) => {
      const title = match[1].trim();
      const start = (match.index ?? 0) + match[0].length;
      const end = index < matches.length - 1 ? (matches[index + 1].index ?? summaryText.length) : summaryText.length;
      const rawContent = summaryText.slice(start, end).trim();
      const items = rawContent
        .split(/;|\n/)
        .map((item) => item.replace(/^\s*[-•]\s*/, "").trim())
        .filter(Boolean);

      return { title, items };
    });
  };

  const sortedSessions = sessionHistory
    ? [...sessionHistory].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    : [];

  if (!sessionHistory || sessionHistory.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No session history yet</p>
        <p className="text-xs mt-1">Start using the Rev Winner app to see your sessions here</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <div className="text-sm font-semibold text-foreground mb-3">Recent Sessions</div>
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground">#</th>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Start Time</th>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground">End Time</th>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Duration</th>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Summary</th>
              </tr>
            </thead>
            <tbody>
              {sortedSessions.map((session, index) => (
                  <tr
                    key={`${session.sessionId}-${index}-${session.startTime}`}
                    className="border-t border-border hover:bg-muted/30 transition-colors"
                    data-testid={`session-${index}`}
                  >
                    <td className="p-3 text-sm font-mono text-muted-foreground">
                      {index + 1}
                    </td>
                    <td className="p-3 text-sm text-foreground" data-testid={`session-start-${index}`}>
                      {formatDateTime(session.startTime)}
                    </td>
                    <td className="p-3 text-sm text-foreground" data-testid={`session-end-${index}`}>
                      {formatDateTime(session.endTime)}
                    </td>
                    <td className="p-3 text-sm font-semibold text-foreground" data-testid={`session-duration-${index}`}>
                      {formatDuration(session.durationMinutes)}
                    </td>
                    <td className="p-3">
                      {session.summary ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedSummary({ summary: session.summary!, sessionNumber: index + 1 })}
                          className="text-xs"
                        >
                          View Summary
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">No summary</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Dialog */}
      <Dialog open={!!selectedSummary} onOpenChange={(open) => !open && setSelectedSummary(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Session Summary</span>
            </DialogTitle>
          </DialogHeader>
          {selectedSummary ? (() => {
            const sections = parseSummarySections(selectedSummary.summary);
            const sectionStyles = [
              {
                container: "bg-purple-50 dark:bg-purple-950/30",
                border: "border-purple-200 dark:border-purple-800",
                title: "text-purple-700 dark:text-purple-300",
                bullet: "text-purple-500",
              },
              {
                container: "bg-blue-50 dark:bg-blue-950/30",
                border: "border-blue-200 dark:border-blue-800",
                title: "text-blue-700 dark:text-blue-300",
                bullet: "text-blue-500",
              },
              {
                container: "bg-emerald-50 dark:bg-emerald-950/30",
                border: "border-emerald-200 dark:border-emerald-800",
                title: "text-emerald-700 dark:text-emerald-300",
                bullet: "text-emerald-500",
              },
              {
                container: "bg-amber-50 dark:bg-amber-950/30",
                border: "border-amber-200 dark:border-amber-800",
                title: "text-amber-700 dark:text-amber-300",
                bullet: "text-amber-500",
              },
            ];

            if (!sections) {
              return (
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-foreground whitespace-pre-wrap italic">{selectedSummary.summary}</p>
                </div>
              );
            }

            return (
              <div className="space-y-4">
                {sections.map((section, idx) => {
                  const style = sectionStyles[idx % sectionStyles.length];
                  return (
                    <div key={`${section.title}-${idx}`} className={`rounded-lg border ${style.border} ${style.container}`}>
                      <div className="px-4 py-3 border-b border-border/40">
                        <h3 className={`text-xs font-semibold uppercase tracking-wide ${style.title}`}>{section.title}</h3>
                      </div>
                      <ul className="p-4 space-y-2 text-sm text-foreground">
                        {section.items.map((item, itemIndex) => (
                          <li key={`${section.title}-item-${itemIndex}`} className="flex gap-2">
                            <span className={`${style.bullet} mt-0.5`}>•</span>
                            <span className="italic">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            );
          })() : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
