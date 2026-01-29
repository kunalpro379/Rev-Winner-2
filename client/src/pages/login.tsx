import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@shared/schema";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Link, useLocation } from "wouter";
import { Loader2, Mail, Lock, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import logoPath from "@assets/rev-winner-logo.png";
import { useSEO } from "@/hooks/use-seo";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trialExpired, setTrialExpired] = useState(false);
  const [showDeviceConfirmation, setShowDeviceConfirmation] = useState(false);
  const [pendingLoginData, setPendingLoginData] = useState<z.infer<typeof loginSchema> | null>(null);
  
  useSEO({
    title: "Login - Rev Winner | Access Your AI Sales Assistant",
    description: "Sign in to your Rev Winner account to access real-time sales coaching, AI conversation insights, and meeting transcription. Secure login with email or username.",
  });

  // Get redirect parameter from URL
  const urlParams = new URLSearchParams(window.location.search);
  const redirectTo = urlParams.get('redirect') || '/app';

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      usernameOrEmail: "",
      password: "",
    },
  });

  async function handleLogin(values: z.infer<typeof loginSchema>, forceLogin: boolean = false) {
    setIsSubmitting(true);
    setTrialExpired(false);
    
    try {
      const response = await apiRequest("POST", "/api/auth/login", { ...values, forceLogin }, { allowedStatusCodes: [409] });
      const data = await response.json();

      // Handle multi-device confirmation required
      if (response.status === 409 && data.requiresConfirmation) {
        setPendingLoginData(values);
        setShowDeviceConfirmation(true);
        setIsSubmitting(false);
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Store tokens
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);

      // Check trial/subscription status
      if (data.subscription?.trialExpired) {
        setTrialExpired(true);
        toast({
          title: "Trial Expired",
          description: "Your free trial has ended. Please subscribe to continue.",
          variant: "destructive",
        });
        
        // Redirect to subscription page after showing message
        setTimeout(() => setLocation("/subscribe"), 2000);
        return;
      }

      toast({
        title: "Welcome Back!",
        description: `Logged in as ${data.user.firstName} ${data.user.lastName}`,
      });

      // Redirect to intended destination or app
      setTimeout(() => setLocation(redirectTo), 500);
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    await handleLogin(values, false);
  }

  const handleConfirmDeviceLogout = async () => {
    setShowDeviceConfirmation(false);
    if (pendingLoginData) {
      await handleLogin(pendingLoginData, true);
      setPendingLoginData(null);
    }
  };

  const handleCancelDeviceLogout = () => {
    setShowDeviceConfirmation(false);
    setPendingLoginData(null);
    toast({
      title: "Login Cancelled",
      description: "Redirecting to home page...",
    });
    setTimeout(() => setLocation("/"), 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-600 via-purple-700 to-blue-900 dark:from-fuchsia-900 dark:via-purple-900 dark:to-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur border-purple-200 dark:border-purple-800" data-testid="card-login">
        <CardHeader className="space-y-1">
          <div className="flex flex-col items-center gap-3 mb-4">
            <div className="h-20 overflow-hidden flex items-center">
              <img 
                src={logoPath} 
                alt="Rev Winner Logo" 
                className="h-20 w-auto object-contain"
                data-testid="img-logo"
              />
            </div>
          </div>
          <h1 className="text-lg font-bold text-center bg-gradient-to-r from-fuchsia-600 to-purple-600 bg-clip-text text-transparent">
              Login to Rev Winner
            </h1>
          <CardDescription className="text-center text-slate-600 dark:text-slate-400">
            Sign in to continue your sales journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          {trialExpired && (
            <Alert className="mb-4 border-amber-500 bg-amber-50 dark:bg-amber-950" data-testid="alert-trial-expired">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                Your free trial has expired. Redirecting to subscription...
              </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="usernameOrEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email or Username</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input 
                          data-testid="input-username-or-email"
                          placeholder="john@company.com or johndoe" 
                          {...field} 
                          className="pl-9" 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Password</FormLabel>
                      <Link 
                        href="/forgot-password" 
                        data-testid="link-forgot-password"
                        className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input 
                          data-testid="input-password"
                          type="password" 
                          placeholder="••••••••" 
                          {...field} 
                          className="pl-9" 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                data-testid="button-login"
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700 text-white font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
            Don't have an account?{" "}
            <Link href="/register" data-testid="link-register" className="text-purple-600 dark:text-purple-400 hover:underline font-semibold">
              Start free trial
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Multi-Device Login Confirmation Dialog */}
      <AlertDialog open={showDeviceConfirmation} onOpenChange={setShowDeviceConfirmation}>
        <AlertDialogContent data-testid="dialog-device-confirmation">
          <AlertDialogHeader>
            <AlertDialogTitle>Already Logged In</AlertDialogTitle>
            <AlertDialogDescription>
              You are already logged in on another device. Continuing will log you out from that device. Do you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={handleCancelDeviceLogout}
              data-testid="button-cancel-device-logout"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDeviceLogout}
              data-testid="button-confirm-device-logout"
              className="bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700"
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
