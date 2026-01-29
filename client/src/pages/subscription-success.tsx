import { useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";

export default function SubscriptionSuccess() {
  const [, setLocation] = useLocation();
  
  useSEO({
    title: "Subscription Successful - Rev Winner | Welcome to Premium",
    description: "Your Rev Winner subscription is now active! Enjoy unlimited AI-powered sales coaching and conversation intelligence. Start closing more deals today.",
  });

  useEffect(() => {
    // Auto-redirect after 5 seconds
    const timer = setTimeout(() => {
      setLocation("/");
    }, 5000);

    return () => clearTimeout(timer);
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-600 via-purple-700 to-blue-900 dark:from-fuchsia-900 dark:via-purple-900 dark:to-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur border-purple-200 dark:border-purple-800 text-center" data-testid="card-success">
        <CardHeader>
          <div className="mx-auto mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-fuchsia-600 to-purple-600 bg-clip-text text-transparent">
              Subscription Successful!
            </h1>
          <CardDescription className="text-slate-600 dark:text-slate-400">
            Thank you for subscribing to Rev Winner
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-700 dark:text-slate-300">
            Your payment has been processed successfully. You now have full access to all premium features.
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Redirecting you to the app in 5 seconds...
          </p>
          <Button
            data-testid="button-continue"
            onClick={() => setLocation("/")}
            className="w-full bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700"
          >
            Continue to Rev Winner
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
