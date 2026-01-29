import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CheckCircle2, XCircle, AlertTriangle, Key, RefreshCw, ExternalLink } from "lucide-react";

interface CashfreeConfig {
  configured: boolean;
  testMode: boolean;
  appId: string | null;
  lastUpdated: string | null;
}

export function CashfreeSettings() {
  const { toast } = useToast();

  const { data: config, isLoading, refetch } = useQuery<CashfreeConfig>({
    queryKey: ['/api/admin/cashfree/config'],
  });

  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/cashfree/test-connection", {});
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Connection test failed");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Connection Successful",
        description: `Cashfree ${data.mode} mode is working correctly.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Card data-testid="card-cashfree-settings">
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-slate-600 dark:text-slate-400">Loading Cashfree configuration...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="container-cashfree-settings">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-purple-600" />
            Cashfree Configuration
          </CardTitle>
          <CardDescription>
            Manage your payment gateway credentials for processing subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Configuration Status */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="space-y-1">
                <h4 className="font-medium text-slate-900 dark:text-slate-100">Connection Status</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {config?.configured ? "Cashfree is configured and ready" : "Cashfree credentials not configured"}
                </p>
              </div>
              {config?.configured ? (
                <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Not Configured
                </Badge>
              )}
            </div>

            {config?.configured && (
              <>
                {/* Mode Badge */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="space-y-1">
                    <h4 className="font-medium text-slate-900 dark:text-slate-100">Payment Mode</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {config.testMode 
                        ? "Using sandbox mode - transactions will not be processed" 
                        : "Using production mode - real transactions will be processed"}
                    </p>
                  </div>
                  <Badge variant={config.testMode ? "secondary" : "default"} className={config.testMode ? "" : "bg-purple-600"}>
                    {config.testMode ? "Sandbox Mode" : "Production Mode"}
                  </Badge>
                </div>

                {/* App ID Display */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-2">
                  <h4 className="font-medium text-slate-900 dark:text-slate-100">App ID</h4>
                  <code className="text-sm text-slate-600 dark:text-slate-400 font-mono bg-white dark:bg-slate-900 px-3 py-2 rounded border block">
                    {config.appId || "Not set"}
                  </code>
                  <p className="text-xs text-slate-500 dark:text-slate-500">
                    Secret Key is hidden for security
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Test Connection */}
          {config?.configured && (
            <div>
              <Button
                onClick={() => testConnectionMutation.mutate()}
                disabled={testConnectionMutation.isPending}
                variant="outline"
                className="w-full sm:w-auto"
                data-testid="button-test-connection"
              >
                {testConnectionMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Test Connection
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Instructions */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>How to Update Cashfree Credentials</AlertTitle>
            <AlertDescription className="space-y-3 mt-2">
              <p className="text-sm">
                Cashfree credentials are stored as secure environment secrets. To update them:
              </p>
              <ol className="text-sm space-y-2 ml-4 list-decimal">
                <li>
                  <a 
                    href="https://merchant.cashfree.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center gap-1"
                  >
                    Log in to Cashfree Merchant Dashboard
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>Switch to <strong>{config?.testMode ? "Production" : "Sandbox"}</strong> mode (if needed) using the toggle</li>
                <li>Navigate to Developers → API Keys</li>
                <li>Copy your App ID</li>
                <li>Copy your Secret Key</li>
                <li>In the RevWinner admin settings, configure environment variables</li>
                <li>Update or add these secrets:
                  <ul className="ml-4 mt-1 space-y-1 list-disc">
                    <li><code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">CASHFREE_APP_ID</code></li>
                    <li><code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">CASHFREE_SECRET_KEY</code></li>
                    <li><code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">CASHFREE_WEBHOOK_SECRET</code> (for webhook signature verification)</li>
                  </ul>
                </li>
                <li>The application will automatically restart and use the new credentials</li>
              </ol>
              <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                  ⚠️ Important: Never share your Secret Key publicly or commit it to version control
                </p>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
