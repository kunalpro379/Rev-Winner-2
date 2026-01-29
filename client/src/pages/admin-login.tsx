import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@shared/schema";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
import { useLocation } from "wouter";
import { Loader2, Mail, Lock, Shield } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import logoPath from "@assets/rev-winner-logo.png";
import { useSEO } from "@/hooks/use-seo";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeviceConfirmation, setShowDeviceConfirmation] = useState(false);
  const [pendingLoginData, setPendingLoginData] = useState<z.infer<typeof loginSchema> | null>(null);
  
  useSEO({
    title: "Admin Login - Rev Winner | Administrative Portal Access",
    description: "Secure admin login for Rev Winner platform administrators. Manage users, system settings, and Razorpay configurations.",
  });

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      usernameOrEmail: "",
      password: "",
    },
  });

  async function handleLogin(values: z.infer<typeof loginSchema>, forceLogin: boolean = false) {
    setIsSubmitting(true);
    setError(null);
    try {
      console.log("Admin login attempt:", values.usernameOrEmail);
      const response = await apiRequest("POST", "/api/admin/login", { ...values, forceLogin }, { allowedStatusCodes: [409] });
      const data = await response.json();
      
      console.log("Login response:", { ok: response.ok, status: response.status, data });

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

      console.log("User role check:", { 
        role: data.user.role, 
        isAdmin: data.user.role === 'admin' || data.user.role === 'super_admin',
        roleType: typeof data.user.role 
      });

      // Check if user is an admin or super_admin
      const isAdminOrSuperAdmin = data.user.role === 'admin' || data.user.role === 'super_admin';
      if (!isAdminOrSuperAdmin) {
        console.error("Access denied - user role is not admin/super_admin:", data.user.role);
        // Clear any stale tokens
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        setError("Access denied. Admin credentials required.");
        setIsSubmitting(false);
        return;
      }

      console.log("Admin check passed (role:", data.user.role, "), storing tokens...");

      // Store tokens only if admin
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("user", JSON.stringify(data.user));

      toast({
        title: "Admin Login Successful",
        description: `Welcome back, ${data.user.firstName}!`,
      });

      // Invalidate queries and wait before redirect to ensure tokens are stored
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      
      // Small delay to ensure localStorage is persisted
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log("Redirecting to /admin...");
      setLocation("/admin");
    } catch (error: any) {
      setError(error.message || "Invalid credentials. Please try again.");
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-slate-950 dark:via-purple-950 dark:to-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur border-purple-200 dark:border-purple-800" data-testid="card-admin-login">
        <CardHeader className="space-y-1">
          <div className="flex flex-col items-center gap-3 mb-2">
            <img 
              src={logoPath} 
              alt="Rev Winner Logo" 
              className="h-14 w-auto object-contain"
              data-testid="img-logo"
            />
            <div className="p-3 bg-gradient-to-br from-purple-600 to-blue-900 rounded-full">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-purple-600 to-blue-900 bg-clip-text text-transparent">
            Admin Portal
          </CardTitle>
          <CardDescription className="text-center text-slate-600 dark:text-slate-400">
            Secure access for administrators only
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4" data-testid="alert-error">
              <AlertDescription>{error}</AlertDescription>
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
                          placeholder="admin@company.com" 
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
                    <FormLabel>Password</FormLabel>
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
                data-testid="button-admin-login"
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-900 hover:from-purple-700 hover:to-blue-950 text-white font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Admin Sign In
                  </>
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-center text-slate-500 dark:text-slate-500">
              This portal is restricted to authorized administrators only. Unauthorized access attempts are logged.
            </p>
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
              className="bg-gradient-to-r from-purple-600 to-blue-900 hover:from-purple-700 hover:to-blue-950"
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
