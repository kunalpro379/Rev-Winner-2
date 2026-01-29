import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import { Loader2, Lock, CheckCircle, Users, Key, Shield } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";

const setupPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type SetupPasswordFormData = z.infer<typeof setupPasswordSchema>;

export default function SetupLicenseManager() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [setupSuccess, setSetupSuccess] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  
  useSEO({
    title: "Set Up License Manager Account - Rev Winner",
    description: "Complete your License Manager account setup by creating a secure password to manage your team's licenses.",
  });

  const form = useForm<SetupPasswordFormData>({
    resolver: zodResolver(setupPasswordSchema),
    defaultValues: {
      token: "",
      password: "",
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (!token) {
      toast({
        title: "Invalid Setup Link",
        description: "This setup link is invalid or has expired.",
        variant: "destructive",
      });
      setTimeout(() => setLocation("/login"), 2000);
    } else {
      setResetToken(token);
      form.setValue('token', token);
    }
  }, [toast, setLocation, form]);

  async function onSubmit(values: SetupPasswordFormData) {
    setIsSubmitting(true);
    try {
      const response = await apiRequest("POST", "/api/auth/reset-password", values);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to set password");
      }

      setSetupSuccess(true);
      toast({
        title: "Account Activated!",
        description: "Your License Manager account is now ready. You can sign in and start managing licenses.",
      });

      setTimeout(() => setLocation("/login"), 3000);
    } catch (error: any) {
      toast({
        title: "Setup Failed",
        description: error.message || "Unable to set password. The link may have expired.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (setupSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-fuchsia-600 via-purple-700 to-blue-900 dark:from-fuchsia-900 dark:via-purple-900 dark:to-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur border-purple-200 dark:border-purple-800" data-testid="card-setup-success">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-fuchsia-600 to-purple-600 bg-clip-text text-transparent">
              Account Activated!
            </CardTitle>
            <CardDescription className="text-center text-slate-600 dark:text-slate-400">
              Your License Manager account is ready
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <div className="relative">
                <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
                <Users className="h-8 w-8 absolute -right-1 -bottom-1 text-purple-600 bg-white dark:bg-slate-900 rounded-full p-1" />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                You can now sign in and start managing your team's licenses.
              </p>
              <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg mt-4">
                <h4 className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-2">As License Manager, you can:</h4>
                <ul className="text-xs text-purple-600 dark:text-purple-400 text-left space-y-1">
                  <li>• Assign licenses to team members</li>
                  <li>• Revoke licenses when needed</li>
                  <li>• Monitor license usage</li>
                  <li>• Manage your team's access</li>
                </ul>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-4">
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
      <Card className="w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur border-purple-200 dark:border-purple-800" data-testid="card-setup-password">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="h-8 w-8 text-purple-600" />
            <Users className="h-6 w-6 text-fuchsia-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-fuchsia-600 to-purple-600 bg-clip-text text-transparent">
            Set Up Your Account
          </CardTitle>
          <CardDescription className="text-center text-slate-600 dark:text-slate-400">
            Create a password to activate your License Manager account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Key className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300">License Manager Role</h4>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  You've been designated as a License Manager. After setting your password, you'll be able to assign and manage licenses for your team.
                </p>
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Create Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input 
                          data-testid="input-password"
                          type="password" 
                          placeholder="Enter secure password (min 8 characters)" 
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
                    Activating Account...
                  </>
                ) : (
                  "Activate Account"
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="text-purple-600 hover:text-purple-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
