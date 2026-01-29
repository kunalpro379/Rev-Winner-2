import { useLocation } from "wouter";
import { Loader2, ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { TrafficAnalytics } from "@/components/admin/traffic-analytics";
import { useSEO } from "@/hooks/use-seo";
import { ThemeToggle } from "@/components/theme-toggle";
import logoPath from "@assets/rev-winner-logo.png";

export default function AdminTraffic() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isAdmin, isLoading: authLoading, user: currentUser } = useAdminAuth();

  useSEO({
    title: "Traffic Analytics - Admin | Rev Winner",
    description: "Monitor and analyze website visitor traffic and engagement patterns. Administrative access only.",
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Verifying credentials...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin || !currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src={logoPath} 
                alt="Rev Winner Logo" 
                className="h-12 w-auto object-contain"
                data-testid="img-logo"
              />
              <div className="p-2 bg-gradient-to-br from-purple-600 to-blue-900 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-900 bg-clip-text text-transparent">
                  Traffic Analytics
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">Admin Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Button
                data-testid="button-back-dashboard"
                onClick={() => setLocation("/admin")}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TrafficAnalytics />
      </main>
    </div>
  );
}
