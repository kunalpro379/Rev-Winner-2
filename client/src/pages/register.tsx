import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerUserSchema } from "@shared/schema";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import { Loader2, Mail, Lock, User, Building2, Phone } from "lucide-react";
import logoPath from "@assets/rev-winner-logo.png";
import { useSEO } from "@/hooks/use-seo";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  
  useSEO({
    title: "Sign Up - Rev Winner | Start Your Free Trial Today",
    description: "Create your Rev Winner account and get 3 free sessions to experience AI-powered sales coaching. No credit card required. Start closing more deals with real-time conversation intelligence.",
  });

  const form = useForm<z.infer<typeof registerUserSchema>>({
    resolver: zodResolver(registerUserSchema),
    defaultValues: {
      email: "",
      mobile: "",
      password: "",
      firstName: "",
      lastName: "",
      username: "",
      organization: "",
      termsAccepted: false,
    },
  });

  async function onSubmit(values: z.infer<typeof registerUserSchema>) {
    setIsSubmitting(true);
    try {
      const response = await apiRequest("POST", "/api/auth/register", values);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      setEmail(values.email);
      setShowOTP(true);
      toast({
        title: "Registration Successful!",
        description: "Please check your email for the verification code.",
      });
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Unable to register. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyOTP() {
    if (!otpCode || otpCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit verification code.",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const response = await apiRequest("POST", "/api/auth/verify-otp", {
        email,
        code: otpCode,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Verification failed");
      }

      // Store tokens
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);

      toast({
        title: "Welcome to Rev Winner!",
        description: `Your trial has started - 3 sessions with 60 minutes each!`,
      });

      // Redirect to sales assistant or subscription page
      setTimeout(() => setLocation("/sales-assistant"), 500);
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid or expired code.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResendOTP() {
    try {
      const response = await apiRequest("POST", "/api/auth/resend-otp", { email });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to resend code");
      }

      toast({
        title: "Code Sent!",
        description: "A new verification code has been sent to your email.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to Resend",
        description: error.message || "Unable to resend code.",
        variant: "destructive",
      });
    }
  }

  if (showOTP) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-fuchsia-600 via-purple-700 to-blue-900 dark:from-fuchsia-900 dark:via-purple-900 dark:to-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur border-purple-200 dark:border-purple-800" data-testid="card-otp-verification">
          <CardHeader className="space-y-1">
            <h1 className="text-2xl font-bold text-center bg-gradient-to-r from-fuchsia-600 to-purple-600 bg-clip-text text-transparent">
              Verify Your Email
            </h1>
            <CardDescription className="text-center text-slate-600 dark:text-slate-400">
              We sent a 6-digit code to <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Verification Code
              </label>
              <Input
                data-testid="input-otp-code"
                type="text"
                placeholder="000000"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                className="text-center text-2xl tracking-widest font-mono"
              />
            </div>

            <Button
              data-testid="button-verify-otp"
              onClick={handleVerifyOTP}
              disabled={isVerifying || otpCode.length !== 6}
              className="w-full bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify & Start Free Trial"
              )}
            </Button>

            <Button
              data-testid="button-resend-otp"
              onClick={handleResendOTP}
              variant="ghost"
              className="w-full"
            >
              Didn't receive code? Resend
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-300 dark:border-slate-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-slate-900 px-2 text-slate-500">Or</span>
              </div>
            </div>

            <Button
              data-testid="button-skip-trial"
              onClick={async () => {
                await handleVerifyOTP();
                setTimeout(() => setLocation("/subscribe"), 1000);
              }}
              variant="outline"
              disabled={isVerifying || otpCode.length !== 6}
              className="w-full border-2 border-fuchsia-600 text-fuchsia-600 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-950"
            >
              Skip Trial & Upgrade Now - Save $700!
            </Button>

            <div className="text-center text-sm text-slate-600 dark:text-slate-400">
              <button
                onClick={() => setShowOTP(false)}
                className="text-purple-600 dark:text-purple-400 hover:underline"
                data-testid="button-back-to-register"
              >
                ← Back to registration
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-600 via-purple-700 to-blue-900 dark:from-fuchsia-900 dark:via-purple-900 dark:to-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur border-purple-200 dark:border-purple-800" data-testid="card-register">
        <CardHeader className="space-y-1">
          <div className="flex flex-col items-center gap-3 mb-2">
            <img 
              src={logoPath} 
              alt="Rev Winner Logo" 
              className="h-16 w-auto object-contain"
              data-testid="img-logo"
            />
          </div>
          <h1 className="text-2xl font-bold text-center bg-gradient-to-r from-fuchsia-600 to-purple-600 bg-clip-text text-transparent">
              Create Your Rev Winner Account
            </h1>
          <CardDescription className="text-center text-slate-600 dark:text-slate-400">
            Start your trial - 3 sessions, 60 minutes each - or upgrade directly for unlimited access!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input data-testid="input-firstname" placeholder="John" {...field} className="pl-9" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input data-testid="input-lastname" placeholder="Doe" {...field} className="pl-9" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input data-testid="input-email" type="email" placeholder="john@company.com" {...field} className="pl-9" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input data-testid="input-mobile" type="tel" placeholder="+1 234 567 8900" {...field} className="pl-9" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input data-testid="input-username" placeholder="johndoe" {...field} className="pl-9" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="organization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization (Optional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input data-testid="input-organization" placeholder="Acme Corp" {...field} value={field.value || ""} className="pl-9" />
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input data-testid="input-password" type="password" placeholder="••••••••" {...field} className="pl-9" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="termsAccepted"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        data-testid="checkbox-terms"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-normal cursor-pointer">
                        I agree to the{" "}
                        <Link 
                          href="/terms" 
                          target="_blank"
                          className="text-fuchsia-600 dark:text-fuchsia-400 hover:underline font-semibold"
                          data-testid="link-terms"
                        >
                          Terms & Conditions
                        </Link>
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <Button
                data-testid="button-register"
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700 text-white font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
            Already have an account?{" "}
            <Link href="/login" data-testid="link-login" className="text-purple-600 dark:text-purple-400 hover:underline font-semibold">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
