import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Lock, CheckCircle, AlertCircle, Sparkles } from "lucide-react";

export default function MarketingSetup() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  useEffect(() => {
    document.title = "Setup Marketing Access | Rev Winner";
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    if (tokenParam) {
      setToken(tokenParam);
      setTokenValid(true);
    } else {
      setTokenValid(false);
    }
  }, []);

  const setupMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/marketing/access/setup-password", {
        token,
        password,
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      if (data.success) {
        setIsComplete(true);
        toast({
          title: "Password Set Successfully",
          description: "You can now log in to the Marketing Add-On.",
        });
      } else {
        toast({
          title: "Setup Failed",
          description: data.message || "Failed to set password",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to set password",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }
    
    if (password !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure both passwords are the same",
        variant: "destructive",
      });
      return;
    }
    
    setupMutation.mutate();
  };

  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-fuchsia-50 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-fuchsia-50 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200 dark:border-red-800">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 rounded-full bg-red-100 dark:bg-red-900 w-fit">
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle>Invalid or Expired Link</CardTitle>
            <CardDescription>
              This setup link is invalid or has already been used. Please contact your administrator for a new access link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={() => setLocation("/marketing/login")}
              data-testid="go-to-login-btn"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-fuchsia-50 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-green-200 dark:border-green-800">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 rounded-full bg-green-100 dark:bg-green-900 w-fit">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle>Setup Complete!</CardTitle>
            <CardDescription>
              Your password has been set. You can now access the Marketing Add-On.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={() => setLocation("/marketing/login")}
              data-testid="go-to-login-btn"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Go to Marketing Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-fuchsia-50 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-purple-200 dark:border-purple-800">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 rounded-full bg-purple-100 dark:bg-purple-900 w-fit">
            <Lock className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </div>
          <CardTitle className="text-2xl">Set Your Password</CardTitle>
          <CardDescription>
            Create a password to access the Rev Winner Marketing Add-On
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="mt-1"
                required
                minLength={8}
                data-testid="password-input"
              />
              <p className="text-xs text-slate-500 mt-1">Minimum 8 characters</p>
            </div>
            
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="mt-1"
                required
                data-testid="confirm-password-input"
              />
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={setupMutation.isPending || !password || !confirmPassword}
              data-testid="setup-password-btn"
            >
              {setupMutation.isPending ? "Setting up..." : "Set Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
