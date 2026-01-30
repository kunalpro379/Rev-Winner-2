import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const [message, setMessage] = useState('Verifying your payment...');
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get order ID and payment details from URL
        const params = new URLSearchParams(window.location.search);
        const orderIdParam = params.get('orderId');
        const cfPaymentId = params.get('cf_payment_id') || params.get('payment_id');
        const razorpayPaymentId = params.get('razorpay_payment_id');
        const razorpaySignature = params.get('razorpay_signature');

        if (!orderIdParam) {
          setStatus('failed');
          setMessage('Invalid payment link. Order ID not found.');
          return;
        }

        setOrderId(orderIdParam);

        // First, get the order details to determine the correct verification endpoint
        let verificationEndpoint = '/api/cart/verify'; // Default to cart verification
        let requestBody: any = {
          orderId: orderIdParam,
        };

        // Add payment details if available
        if (cfPaymentId) {
          requestBody.cfPaymentId = cfPaymentId;
        }
        if (razorpayPaymentId && razorpaySignature) {
          requestBody.razorpayPaymentId = razorpayPaymentId;
          requestBody.razorpaySignature = razorpaySignature;
        }

        try {
          // Try to get order details to determine the correct endpoint
          const orderResponse = await apiRequest('GET', `/api/billing/order-details?orderId=${orderIdParam}`);
          if (orderResponse.ok) {
            const orderData = await orderResponse.json();
            
            // Determine endpoint based on order type
            if (orderData.addonType === 'session_minutes') {
              verificationEndpoint = '/api/session-minutes/verify-payment';
              // Session minutes endpoint expects different parameters
              requestBody = {
                orderId: orderIdParam,
                ...(cfPaymentId && { cfPaymentId }),
                ...(razorpayPaymentId && { razorpay_payment_id: razorpayPaymentId }),
                ...(razorpaySignature && { razorpay_signature: razorpaySignature }),
              };
            } else if (orderData.addonType === 'train_me') {
              verificationEndpoint = '/api/train-me/verify-payment';
              // Train Me endpoint expects different parameters
              requestBody = {
                orderId: orderIdParam,
                ...(cfPaymentId && { cfPaymentId }),
                ...(razorpayPaymentId && { razorpay_payment_id: razorpayPaymentId }),
                ...(razorpaySignature && { razorpay_signature: razorpaySignature }),
              };
            } else if (orderData.addonType === 'platform_access') {
              verificationEndpoint = '/api/billing/platform-access/verify';
              requestBody = {
                orderId: orderIdParam,
                ...(cfPaymentId && { cfPaymentId }),
                ...(razorpayPaymentId && { razorpayPaymentId }),
                ...(razorpaySignature && { razorpaySignature }),
              };
            } else if (orderData.addonType === 'cart_checkout') {
              verificationEndpoint = '/api/cart/verify';
              // Cart verification uses the parameters we already set
            }
            
            console.log(`[Payment Success] Order type: ${orderData.addonType}, using endpoint: ${verificationEndpoint}`);
          }
        } catch (orderError) {
          console.warn('[Payment Success] Could not get order details, defaulting to cart verification:', orderError);
          // Default to cart verification if we can't get order details
        }

        // Verify payment with the correct backend endpoint
        const response = await apiRequest('POST', verificationEndpoint, requestBody);

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message || 'Payment verified successfully!');
          
          // Show appropriate success message based on verification type
          let successDescription = 'Your payment has been processed successfully.';
          if (data.minutesAdded) {
            successDescription = `You've added ${data.minutesAdded} minutes to your account.`;
          } else if (data.activatedAddons && data.activatedAddons.length > 0) {
            successDescription = `${data.activatedAddons.length} item(s) have been activated in your account.`;
          }
          
          toast({
            title: "Payment Successful!",
            description: successDescription,
          });

          // Redirect to invoice page after 3 seconds
          setTimeout(() => {
            setLocation(`/invoice?orderId=${orderIdParam}`);
          }, 3000);
        } else {
          setStatus('failed');
          setMessage(data.message || 'Payment verification failed.');
          
          toast({
            title: "Verification Failed",
            description: data.message || 'Payment verification failed.',
            variant: "destructive",
          });
        }
      } catch (error: any) {
        setStatus('failed');
        setMessage(error.message || 'Failed to verify payment.');
        
        toast({
          title: "Verification Error",
          description: error.message || 'Failed to verify payment.',
          variant: "destructive",
        });
      }
    };

    verifyPayment();
  }, [toast, setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === 'verifying' && (
              <Loader2 className="h-16 w-16 text-purple-600 animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            )}
            {status === 'failed' && (
              <XCircle className="h-16 w-16 text-red-600" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {status === 'verifying' && 'Verifying Payment'}
            {status === 'success' && 'Payment Successful!'}
            {status === 'failed' && 'Payment Failed'}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'success' && (
            <div className="space-y-4">
              <Button
                onClick={() => setLocation(`/invoice?orderId=${orderId}`)}
                className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700"
              >
                View Invoice
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                Redirecting to invoice in 3 seconds...
              </div>
            </div>
          )}
          
          {status === 'failed' && (
            <div className="space-y-2">
              <Button
                onClick={() => setLocation('/manage-subscription')}
                className="w-full"
              >
                Go to Subscription
              </Button>
              <Button
                onClick={() => setLocation('/help')}
                variant="outline"
                className="w-full"
              >
                Contact Support
              </Button>
            </div>
          )}

          {status === 'verifying' && (
            <div className="text-center text-sm text-muted-foreground">
              Please wait while we confirm your payment...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
