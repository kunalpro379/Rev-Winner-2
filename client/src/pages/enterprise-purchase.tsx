import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Building2, CreditCard, Users } from "lucide-react";

export default function EnterprisePurchase() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [companyName, setCompanyName] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [packageType, setPackageType] = useState<"monthly" | "annual">("annual");
  const [totalSeats, setTotalSeats] = useState("5");
  const [isProcessing, setIsProcessing] = useState(false);

  const pricePerSeat = packageType === "annual" ? 60 : 6;
  const seats = parseInt(totalSeats, 10) || 0;
  const totalAmount = seats * pricePerSeat;

  const handlePurchase = async () => {
    // Validation
    if (!companyName.trim()) {
      toast({
        title: "Company Name Required",
        description: "Please enter your company name",
        variant: "destructive"
      });
      return;
    }

    if (!billingEmail.trim() || !billingEmail.includes("@")) {
      toast({
        title: "Valid Email Required",
        description: "Please enter a valid billing email",
        variant: "destructive"
      });
      return;
    }

    if (seats < 5) {
      toast({
        title: "Minimum Seats Required",
        description: "Minimum 5 seats required for enterprise license",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Create order via backend
      const orderResponse = await apiRequest("POST", "/api/enterprise/purchase", {
        companyName,
        billingEmail,
        packageType,
        totalSeats: seats
      });
      const orderData = await orderResponse.json();

      if (!orderData.success) {
        throw new Error(orderData.message || "Failed to create order");
      }

      // Handle payment based on gateway
      if (orderData.gateway === 'cashfree') {
        // Cashfree payment flow
        const { load } = await import("@cashfreepayments/cashfree-js");
        const cashfree = await load({ mode: orderData.cashfreeMode || "sandbox" });

        const checkoutOptions = {
          paymentSessionId: orderData.paymentSessionId,
          returnUrl: `${window.location.origin}/payment/success?orderId=${orderData.orderId}&type=enterprise`,
        };

        cashfree.checkout(checkoutOptions).then(() => {
          console.log("Cashfree checkout initiated");
        });
      } else {
        // Razorpay payment flow
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);

        script.onload = () => {
          const options = {
            key: orderData.razorpayKeyId,
            amount: Math.round(orderData.amount * 100), // Razorpay expects paise
            currency: orderData.currency || 'USD',
            name: 'Rev Winner',
            description: `Enterprise License - ${seats} Seats (${packageType})`,
            order_id: orderData.razorpayOrderId,
            handler: async function (response: any) {
              try {
                // Verify payment
                const verifyResponse = await apiRequest("POST", "/api/enterprise/verify-purchase", {
                  orderId: orderData.orderId,
                  companyName,
                  billingEmail,
                  totalSeats: seats,
                  packageType,
                  pricePerSeat,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                });
                const verifyData = await verifyResponse.json();

                if (verifyData.success) {
                  toast({
                    title: "Purchase Successful!",
                    description: "Your enterprise license has been activated. Redirecting to dashboard..."
                  });

                  // Redirect to license manager dashboard
                  setTimeout(() => {
                    setLocation("/license-manager");
                  }, 2000);
                } else {
                  throw new Error(verifyData.message || "Verification failed");
                }
              } catch (error: any) {
                toast({
                  title: "Verification Failed",
                  description: error.message || "Failed to verify payment",
                  variant: "destructive"
                });
                setIsProcessing(false);
              }
            },
            modal: {
              ondismiss: function () {
                toast({
                  title: "Payment Cancelled",
                  description: "You cancelled the payment process."
                });
                setIsProcessing(false);
              }
            },
            theme: {
              color: '#7c3aed'
            }
          };

          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        };

        script.onerror = () => {
          toast({
            title: "Payment Gateway Error",
            description: "Failed to load payment gateway. Please try again.",
            variant: "destructive"
          });
          setIsProcessing(false);
        };
      }
    } catch (error: any) {
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to initiate purchase",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8" data-testid="header-enterprise-purchase">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
              Enterprise License Purchase
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Get bulk licenses for your organization with centralized management
            </p>
          </div>

          {/* Pricing Info Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card data-testid="card-pricing-monthly">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-purple-600" />
                  Monthly Plan
                </CardTitle>
                <CardDescription>Pay as you go, cancel anytime</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">$6</div>
                <p className="text-sm text-muted-foreground">per seat per month</p>
              </CardContent>
            </Card>

            <Card data-testid="card-pricing-annual">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  Annual Plan
                  <span className="ml-auto text-xs bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 px-2 py-1 rounded">
                    Save 17%
                  </span>
                </CardTitle>
                <CardDescription>Best value for your team</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">$60</div>
                <p className="text-sm text-muted-foreground">per seat per year</p>
              </CardContent>
            </Card>
          </div>

          {/* Purchase Form */}
          <Card data-testid="card-purchase-form">
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>
                Enter your company information to get started
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Company Name */}
              <div>
                <Label htmlFor="companyName">Company Name *</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="companyName"
                    placeholder="Enter your company name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="pl-10"
                    data-testid="input-company-name"
                  />
                </div>
              </div>

              {/* Billing Email */}
              <div>
                <Label htmlFor="billingEmail">Billing Email *</Label>
                <Input
                  id="billingEmail"
                  type="email"
                  placeholder="billing@company.com"
                  value={billingEmail}
                  onChange={(e) => setBillingEmail(e.target.value)}
                  data-testid="input-billing-email"
                />
              </div>

              {/* Package Type */}
              <div>
                <Label htmlFor="packageType">Package Type *</Label>
                <Select value={packageType} onValueChange={(value: "monthly" | "annual") => setPackageType(value)}>
                  <SelectTrigger id="packageType" data-testid="select-package-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly" data-testid="option-monthly">Monthly ($6/seat/month)</SelectItem>
                    <SelectItem value="annual" data-testid="option-annual">Annual ($60/seat/year - Save 17%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Total Seats */}
              <div>
                <Label htmlFor="totalSeats">Number of Seats * (Minimum 5)</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="totalSeats"
                    type="number"
                    min="5"
                    placeholder="Enter number of seats"
                    value={totalSeats}
                    onChange={(e) => setTotalSeats(e.target.value)}
                    className="pl-10"
                    data-testid="input-total-seats"
                  />
                </div>
              </div>

              {/* Price Summary */}
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg" data-testid="summary-pricing">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Seats:</span>
                  <span className="font-medium" data-testid="text-seats-count">{seats}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Price per seat:</span>
                  <span className="font-medium" data-testid="text-price-per-seat">${pricePerSeat.toLocaleString()}</span>
                </div>
                <div className="border-t dark:border-gray-700 pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">Total Amount:</span>
                    <span className="text-2xl font-bold text-purple-600" data-testid="text-total-amount">
                      ${totalAmount.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {packageType === "annual" ? "Billed annually" : "Billed monthly"}
                  </p>
                </div>
              </div>

              {/* Purchase Button */}
              <Button
                onClick={handlePurchase}
                disabled={isProcessing}
                className="w-full"
                size="lg"
                data-testid="button-purchase"
              >
                {isProcessing ? "Processing..." : `Purchase ${seats} Licenses - $${totalAmount.toLocaleString()}`}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Secure payment powered by Razorpay. You will become the License Manager for your organization.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
