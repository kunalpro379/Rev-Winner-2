import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { requestPasswordResetSchema } from "@shared/schema";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";

export default function ForgotPassword() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  useSEO({
    title: "Forgot Password - Rev Winner | Reset Your Account Password",
    description: "Reset your Rev Winner account password. Enter your email to receive a secure password reset link. Get back to closing deals in minutes.",
  });

  const form = useForm<z.infer<typeof requestPasswordResetSchema>>({
    resolver: zodResolver(requestPasswordResetSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof requestPasswordResetSchema>) {
    setIsSubmitting(true);
    try {
      const response = await apiRequest("POST", "/api/auth/forgot-password", values);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send reset email");
      }

      setEmailSent(true);
      toast({
        title: "Reset Email Sent",
        description: "If an account exists with that email, you'll receive password reset instructions.",
      });
    } catch (error: any) {
      toast({
        title: "Request Failed",
        description: error.message || "Unable to process password reset request.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-fuchsia-600 via-purple-700 to-blue-900 dark:from-fuchsia-900 dark:via-purple-900 dark:to-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur border-purple-200 dark:border-purple-800" data-testid="card-email-sent">
          <CardHeader className="space-y-1">
            <h1 className="text-2xl font-bold text-center bg-gradient-to-r from-fuchsia-600 to-purple-600 bg-clip-text text-transparent">
              Check Your Email
            </h1>
            <CardDescription className="text-center text-slate-600 dark:text-slate-400">
              If an account exists with the email you provided, you'll receive password reset instructions shortly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-4">
              <Mail className="h-16 w-16 mx-auto text-fuchsia-600 dark:text-fuchsia-400 mb-4" />
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Check your inbox and spam folder for an email from Rev Winner with password reset instructions.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500">
                The reset link will expire in 1 hour.
              </p>
            </div>

            <Link href="/login" data-testid="link-back-to-login">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sign In
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-600 via-purple-700 to-blue-900 dark:from-fuchsia-900 dark:via-purple-900 dark:to-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur border-purple-200 dark:border-purple-800" data-testid="card-forgot-password">
        <CardHeader className="space-y-1">
          <h1 className="text-2xl font-bold text-center bg-gradient-to-r from-fuchsia-600 to-purple-600 bg-clip-text text-transparent">
              Forgot Password?
            </h1>
          <CardDescription className="text-center text-slate-600 dark:text-slate-400">
            Enter your email and we'll send you reset instructions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input 
                          data-testid="input-email"
                          type="email" 
                          placeholder="your@email.com" 
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
                    Sending Reset Link...
                  </>
                ) : (
                  "Send Reset Link"
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
