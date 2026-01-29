import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";

export default function SubscriptionCancel() {
  const [, setLocation] = useLocation();
  
  useSEO({
    title: "Subscription Cancelled - Rev Winner | No Charges Made",
    description: "Your subscription was cancelled. No charges were made to your account. You can try again anytime to access AI-powered sales coaching.",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-600 via-purple-700 to-blue-900 dark:from-fuchsia-900 dark:via-purple-900 dark:to-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur border-purple-200 dark:border-purple-800 text-center" data-testid="card-cancelled">
        <CardHeader>
          <div className="mx-auto mb-4">
            <XCircle className="h-16 w-16 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-fuchsia-600 to-purple-600 bg-clip-text text-transparent">
              Subscription Cancelled
            </h1>
          <CardDescription className="text-slate-600 dark:text-slate-400">
            Your subscription was not completed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-700 dark:text-slate-300">
            No charges have been made to your account. You can try again anytime.
          </p>
          <div className="flex flex-col gap-2">
            <Button
              data-testid="button-try-again"
              onClick={() => setLocation("/subscribe")}
              className="w-full bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700"
            >
              Try Again
            </Button>
            <Button
              data-testid="button-back-to-home"
              onClick={() => setLocation("/")}
              variant="outline"
              className="w-full"
            >
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
