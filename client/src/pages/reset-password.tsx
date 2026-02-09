import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema } from "@shared/schema";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import { Loader2, Lock, CheckCircle } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  
  useSEO({
    title: "Reset Password - Rev Winner | Create New Password",
    description: "Set a new password for your Rev Winner account. Enter your secure token and create a strong password to regain access.",
  });

  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: "",
      password: "",
    },
  });

  useEffect(() => {
    // Get token from URL query parameters
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    
    console.log('[Reset Password] Token from URL:', token ? token.substring(0, 20) + '...' : 'null');
    
    if (!token) {
      toast({
        title: "Invalid Reset Link",
        description: "This password reset link is invalid or has expired.",
        variant: "destructive",
      });
      setTimeout(() => setLocation("/forgot-password"), 2000);
    } else {
      setResetToken(token);
      // Set the token in the form
      form.setValue('token', token);
      console.log('[Reset Password] Token set in form');
    }
  }, [toast, setLocation, form]);

  async function onSubmit(values: z.infer<typeof resetPasswordSchema>) {
    setIsSubmitting(true);
    try {
      console.log('[Reset Password] Submitting with values:', { token: values.token?.substring(0, 20) + '...', hasPassword: !!values.password });
      
      const response = await apiRequest("POST", "/api/auth/reset-password", values);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to reset password");
      }

      setResetSuccess(true);
      toast({
        title: "Password Reset Successful!",
        description: "You can now sign in with your new password.",
      });

      // Redirect to login after 3 seconds
      setTimeout(() => setLocation("/login"), 3000);
    } catch (error: any) {
      console.error('[Reset Password] Error:', error);
      toast({
        title: "Reset Failed",
        description: error.message || "Unable to reset password. The link may have expired.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (resetSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-fuchsia-600 via-purple-700 to-blue-900 dark:from-fuchsia-900 dark:via-purple-900 dark:to-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur border-purple-200 dark:border-purple-800" data-testid="card-reset-success">
          <CardHeader className="space-y-1">
            <h1 className="text-2xl font-bold text-center bg-gradient-to-r from-fuchsia-600 to-purple-600 bg-clip-text text-transparent">
              Password Reset Successful!
            </h1>
            <CardDescription className="text-center text-slate-600 dark:text-slate-400">
              Your password has been updated successfully
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-4">
              <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                You can now sign in with your new password.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500">
                Redirecting to sign in page...
              </p>
            </div>

            <Link href="/login" data-testid="link-login">
              <Button className="w-full bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700">
                Sign In Now
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!resetToken) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-600 via-purple-700 to-blue-900 dark:from-fuchsia-900 dark:via-purple-900 dark:to-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur border-purple-200 dark:border-purple-800" data-testid="card-reset-password">
        <CardHeader className="space-y-1">
          <h1 className="text-2xl font-bold text-center bg-gradient-to-r from-fuchsia-600 to-purple-600 bg-clip-text text-transparent">
              Reset Your Password
            </h1>
          <CardDescription className="text-center text-slate-600 dark:text-slate-400">
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Hidden token field */}
              <FormField
                control={form.control}
                name="token"
                render={({ field }) => (
                  <FormItem className="hidden">
                    <FormControl>
                      <Input type="hidden" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input 
                          data-testid="input-password"
                          type="password" 
                          placeholder="Enter new password (min 8 characters)" 
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
                data-testid="button-submit"
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700 text-white font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
            Remember your password?{" "}
            <Link href="/login" data-testid="link-login" className="text-purple-600 dark:text-purple-400 hover:underline font-semibold">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
