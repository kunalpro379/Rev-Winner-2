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

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get order ID from URL
        const params = new URLSearchParams(window.location.search);
        const orderId = params.get('orderId');

        if (!orderId) {
          setStatus('failed');
          setMessage('Invalid payment link. Order ID not found.');
          return;
        }

        // Verify payment with backend
        const response = await apiRequest(
          'POST',
          '/api/session-minutes/verify-payment',
          {
            orderId: orderId,
            paymentGateway: 'cashfree',
          }
        );

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message || 'Payment verified successfully!');
          
          toast({
            title: "Payment Successful!",
            description: `You've added ${data.minutesAdded || 0} minutes to your account.`,
          });

          // Redirect to profile after 3 seconds
          setTimeout(() => {
            setLocation('/manage-subscription');
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
            <div className="text-center text-sm text-muted-foreground">
              Redirecting to your account in 3 seconds...
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
