import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Sparkles, Mail, Lock } from "lucide-react";

export default function MarketingLogin() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    document.title = "Marketing Login | Rev Winner";
  }, []);

  const loginMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/marketing/access/login", {
        email,
        password,
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      if (data.success) {
        localStorage.setItem("marketingToken", data.token);
        toast({
          title: "Login Successful",
          description: "Welcome to the Marketing Add-On!",
        });
        setLocation("/marketing");
      } else {
        toast({
          title: "Login Failed",
          description: data.message || "Invalid email or password",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-fuchsia-50 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-purple-200 dark:border-purple-800">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 rounded-full bg-purple-100 dark:bg-purple-900 w-fit">
            <Sparkles className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </div>
          <CardTitle className="text-2xl">Marketing Add-On</CardTitle>
          <CardDescription>
            Sign in to access your marketing tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="pl-10"
                  required
                  data-testid="email-input"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="pl-10"
                  required
                  data-testid="password-input"
                />
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending || !email || !password}
              data-testid="login-btn"
            >
              {loginMutation.isPending ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-slate-500">
            <p>
              Don't have access?{" "}
              <a href="mailto:sales@revwinner.com" className="text-purple-600 hover:underline">
                Contact your administrator
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
