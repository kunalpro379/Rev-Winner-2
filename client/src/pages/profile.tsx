import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HamburgerNav } from "@/components/hamburger-nav";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { User, Mail, Phone, Building2, Calendar, CreditCard, Download, ShieldCheck, Clock, GraduationCap, Loader2, Video, ChevronDown, ChevronUp, Search, FileAudio, FileText, Package, Hash } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

declare global {
  interface Window {
    Razorpay: any;
  }
}

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
    nextExpiryDate: string | null;
  }>({
    queryKey: ["/api/session-minutes/status"],
  });
  
  // Fetch Call Recordings
  const { data: recordingsData, isLoading: isLoadingRecordings } = useQuery<{ recordings: CallRecording[] }>({
    queryKey: ["/api/call-recordings"],
  });
  
  // Purchase Train Me subscription using enhanced Razorpay
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

      // Step 1: Create order
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

      const { razorpayOrderId, razorpayKeyId, orderId, amount, currency } = await orderResponse.json();

      // Import enhanced Razorpay utilities
      const { openRazorpayCheckout, createPaymentHandler } = await import("@/utils/razorpay-config");

      // Create enhanced payment handler with proper redirection
      const paymentHandler = createPaymentHandler(
        "/api/train-me/verify-payment",
        orderId,
        accessToken,
        () => {
          queryClient.invalidateQueries({ queryKey: ["/api/train-me/status"] });
          queryClient.invalidateQueries({ queryKey: ["/api/profile/invoices"] });
          toast({
            title: "Train Me Activated!",
            description: "You now have 30 days of access to Train Me features.",
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

      // Step 2: Open enhanced Razorpay checkout with all payment methods
      openRazorpayCheckout({
        key: razorpayKeyId,
        amount: Math.round(parseFloat(amount) * 100),
        currency: currency || 'USD',
        name: 'Rev Winner',
        description: 'Train Me Subscription - 30 Days Access',
        order_id: razorpayOrderId,
        handler: paymentHandler,
        modal: {
          ondismiss: () => {
            toast({
              title: "Payment Cancelled",
              description: "You cancelled the payment process.",
            });
            setIsPurchasing(false);
          }
        },
        prefill: {
          name: profileData ? `${profileData.firstName} ${profileData.lastName}` : 'Customer',
          email: profileData?.email || 'customer@revwinner.com',
          contact: profileData?.mobile || undefined
        },
        notes: {
          addon_type: 'train_me',
          order_type: 'train_me_subscription',
          user_id: profileData?.id
        }
      });

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

  const handleDownloadInvoice = async (invoice: Invoice) => {
    if (!invoice.receiptUrl) {
      // Generate a simple invoice view
      const invoiceWindow = window.open("", "_blank");
      if (invoiceWindow) {
        invoiceWindow.document.write(`
          <html>
            <head>
              <title>Invoice ${invoice.id}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 40px; }
                .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
                .details { margin: 20px 0; }
                .row { display: flex; justify-content: space-between; margin: 10px 0; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>Rev Winner Invoice</h1>
                <p>Invoice ID: ${invoice.id}</p>
              </div>
              <div class="details">
                <div class="row"><span>Date:</span><span>${new Date(invoice.createdAt).toLocaleDateString()}</span></div>
                <div class="row"><span>Product:</span><span>${invoice.productName}</span></div>
                <div class="row"><span>Amount:</span><span>$${invoice.amount}</span></div>
                <div class="row"><span>Status:</span><span>${invoice.status}</span></div>
                <div class="row"><span>Payment Method:</span><span>${invoice.paymentMethod}</span></div>
              </div>
            </body>
          </html>
        `);
        invoiceWindow.document.close();
      }
      return;
    }

    try {
      // Redirect to the new invoice page instead of trying to download directly
      if (invoice.orderId) {
        window.open(`/invoice?orderId=${invoice.orderId}`, '_blank');
        return;
      }
      
      // Fallback for old invoices: try receiptUrl first, then generate simple view
      if (invoice.receiptUrl) {
        // Make authenticated request to get invoice data
        const response = await apiRequest("GET", invoice.receiptUrl);
        
        if (response.ok) {
          // Check if response is JSON (error) or HTML (invoice)
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to download invoice');
          }
          
          // Get the HTML content
          const htmlContent = await response.text();
          
          // Create a new window and write the invoice HTML
          const invoiceWindow = window.open("", "_blank");
          if (invoiceWindow) {
            invoiceWindow.document.write(htmlContent);
            invoiceWindow.document.close();
            return;
          }
        }
      }
      
      // Generate a simple invoice view as fallback
    } catch (error: any) {
      console.error("Invoice download error:", error);
      toast({
        title: "Download Failed",
        description: error.message || "Failed to download invoice. Please try again.",
        variant: "destructive",
      });
    }
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-lg border border-border/30">
                    <p className="text-sm text-muted-foreground mb-1">Minutes Remaining</p>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400" data-testid="text-minutes-remaining">
                      {sessionMinutesStatus.totalMinutesRemaining}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg border border-border/30">
                    <p className="text-sm text-muted-foreground mb-1">Next Expiry</p>
                    <p className="text-sm font-semibold text-foreground" data-testid="text-minutes-expiry">
                      {sessionMinutesStatus.nextExpiryDate ? formatDate(sessionMinutesStatus.nextExpiryDate) : "N/A"}
                    </p>
                  </div>
                </div>
                
                {!sessionMinutesStatus.hasActiveMinutes && (
                  <div className="p-4 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg">
                    <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                      No session minutes available
                    </p>
                    <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                      Purchase session minutes packages to continue using the platform
                    </p>
                  </div>
                )}
                
                <Button
                  onClick={() => setLocation("/manage-subscription")}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                  data-testid="button-manage-minutes"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Purchase Session Minutes
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
                {/* Usage Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-lg border border-border/30">
                    <p className="text-xs text-muted-foreground mb-1">Sessions Used</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-sessions-used">
                      {subscriptionData.sessionsUsed || "0"}
                      {subscriptionData.sessionsLimit && (
                        <span className="text-sm text-muted-foreground ml-1">/ {subscriptionData.sessionsLimit}</span>
                      )}
                    </p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-lg border border-border/30">
                    <p className="text-xs text-muted-foreground mb-1">Minutes Used</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-minutes-used">
                      {subscriptionData.minutesUsed || "0"}
                      {subscriptionData.minutesLimit && (
                        <span className="text-sm text-muted-foreground ml-1">/ {subscriptionData.minutesLimit}</span>
                      )}
                    </p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-lg border border-border/30">
                    <p className="text-xs text-muted-foreground mb-1">Remaining Sessions</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-sessions-remaining">
                      {subscriptionData.sessionsLimit 
                        ? Math.max(0, parseInt(subscriptionData.sessionsLimit) - parseInt(subscriptionData.sessionsUsed || "0"))
                        : "∞"}
                    </p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-lg border border-border/30">
                    <p className="text-xs text-muted-foreground mb-1">Remaining Minutes</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-minutes-remaining">
                      {subscriptionData.minutesLimit 
                        ? Math.max(0, parseInt(subscriptionData.minutesLimit) - parseInt(subscriptionData.minutesUsed || "0"))
                        : "∞"}
                    </p>
                  </div>
                </div>

                {/* Session History Table */}
                {subscriptionData.sessionHistory && subscriptionData.sessionHistory.length > 0 ? (
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
                          </tr>
                        </thead>
                        <tbody>
                          {subscriptionData.sessionHistory
                            .slice()
                            .reverse()
                            .map((session, index) => (
                              <tr
                                key={session.sessionId}
                                className="border-t border-border hover:bg-muted/30 transition-colors"
                                data-testid={`session-${index}`}
                              >
                                <td className="p-3 text-sm font-mono text-muted-foreground">
                                  {subscriptionData.sessionHistory!.length - index}
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
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No session history yet</p>
                    <p className="text-xs mt-1">Start using the Rev Winner app to see your sessions here</p>
                  </div>
                )}
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
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border border-border rounded-lg p-4 animate-pulse">
                    <div className="flex items-center justify-between mb-3">
                      <div className="h-6 bg-muted rounded w-32"></div>
                      <div className="h-6 bg-muted rounded w-20"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-48"></div>
                      <div className="h-4 bg-muted rounded w-36"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : invoicesData && invoicesData.invoices.length > 0 ? (
              <div className="space-y-4">
                {invoicesData.invoices.map((invoice, index) => (
                  <div
                    key={invoice.id}
                    className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-all duration-200 hover:shadow-md"
                    data-testid={`invoice-${index}`}
                  >
                    {/* Invoice Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-lg">
                          <FileText className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-lg text-foreground">
                              {formatCurrency(invoice.amount, invoice.currency)}
                            </h3>
                            {getStatusBadge(invoice.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Invoice #{invoice.razorpayPaymentId?.substring(0, 12) || invoice.id.substring(0, 12)}...
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleDownloadInvoice(invoice)}
                        variant="outline"
                        size="sm"
                        className="gap-2 hover:bg-purple-50 hover:border-purple-300 dark:hover:bg-purple-950"
                        data-testid={`button-download-invoice-${index}`}
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    </div>

                    {/* Invoice Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-purple-500" />
                        <div>
                          <p className="text-muted-foreground">Purchase Date</p>
                          <p className="font-semibold">{formatDate(invoice.createdAt)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="text-muted-foreground">Product</p>
                          <p className="font-semibold">
                            {invoice.metadata?.description || 'Rev Winner Service'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="text-muted-foreground">Payment Method</p>
                          <p className="font-semibold">
                            {invoice.razorpayPaymentId ? 'Razorpay' : 'Cashfree'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Additional Details */}
                    {(invoice.metadata?.minutesAdded || invoice.razorpayPaymentId) && (
                      <div className="mt-4 pt-4 border-t border-border/50">
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                          {invoice.metadata?.minutesAdded && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{invoice.metadata.minutesAdded} minutes added</span>
                            </div>
                          )}
                          {invoice.razorpayPaymentId && (
                            <div className="flex items-center gap-1">
                              <Hash className="h-3 w-3" />
                              <span>Payment ID: {invoice.razorpayPaymentId}</span>
                            </div>
                          )}
                          {invoice.metadata?.invoiceNumber && (
                            <div className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              <span>{invoice.metadata.invoiceNumber}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="p-4 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <CreditCard className="h-10 w-10 text-purple-500" />
                </div>
                <h3 className="font-semibold text-lg mb-2">No invoices yet</h3>
                <p className="text-muted-foreground mb-4">
                  Your payment history and invoices will appear here
                </p>
                <Button
                  onClick={() => setLocation('/packages')}
                  className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700"
                >
                  Browse Packages
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
