/**
 * Refund Manager Component
 * 
 * Admin interface for processing refunds
 * Automatically detects and displays environment (DEV/PROD)
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, CheckCircle2, Info } from "lucide-react";

interface EnvironmentInfo {
  environment: string;
  isProduction: boolean;
  gateway: string;
  razorpayMode: string;
  cashfreeEnvironment: string;
  message: string;
}

interface RefundResult {
  success: boolean;
  message?: string;
  refundId?: string;
  gatewayRefundId?: string;
  amount?: number;
  currency?: string;
  status?: string;
  error?: string;
  isTestMode?: boolean;
}

export function RefundManager() {
  const [envInfo, setEnvInfo] = useState<EnvironmentInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [envLoading, setEnvLoading] = useState(true);
  const [result, setResult] = useState<RefundResult | null>(null);

  // Form state
  const [paymentId, setPaymentId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [refundType, setRefundType] = useState<"payment" | "addon">("payment");

  // Fetch environment info on mount
  useEffect(() => {
    fetchEnvironmentInfo();
  }, []);

  const fetchEnvironmentInfo = async () => {
    try {
      setEnvLoading(true);
      const response = await fetch("/api/refunds/environment", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEnvInfo(data);
      } else {
        console.error("Failed to fetch environment info");
      }
    } catch (error) {
      console.error("Error fetching environment info:", error);
    } finally {
      setEnvLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const endpoint = refundType === "payment" 
        ? "/api/refunds/process" 
        : "/api/refunds/addon";

      const body: any = {
        reason,
      };

      if (refundType === "payment") {
        body.paymentId = paymentId;
      } else {
        body.addonPurchaseId = paymentId;
      }

      if (amount) {
        body.amount = parseFloat(amount);
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      setResult(data);

      // Clear form on success
      if (data.success) {
        setPaymentId("");
        setAmount("");
        setReason("");
      }
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || "Failed to process refund",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Environment Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Environment Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {envLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading environment info...</span>
            </div>
          ) : envInfo ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant={envInfo.isProduction ? "destructive" : "default"}>
                  {envInfo.environment}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {envInfo.message}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Gateway:</span>{" "}
                  <span className="text-muted-foreground">{envInfo.gateway}</span>
                </div>
                <div>
                  <span className="font-medium">Razorpay:</span>{" "}
                  <span className="text-muted-foreground">{envInfo.razorpayMode}</span>
                </div>
                <div>
                  <span className="font-medium">Cashfree:</span>{" "}
                  <span className="text-muted-foreground">{envInfo.cashfreeEnvironment}</span>
                </div>
              </div>
              {envInfo.isProduction && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Warning:</strong> You are in PRODUCTION mode. Refunds will process real money!
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <Alert variant="destructive">
              <AlertDescription>
                Failed to load environment information
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Refund Form */}
      <Card>
        <CardHeader>
          <CardTitle>Process Refund</CardTitle>
          <CardDescription>
            Process a full or partial refund for a payment or addon purchase
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Refund Type */}
            <div className="space-y-2">
              <Label>Refund Type</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="payment"
                    checked={refundType === "payment"}
                    onChange={(e) => setRefundType(e.target.value as "payment")}
                  />
                  <span>Payment</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="addon"
                    checked={refundType === "addon"}
                    onChange={(e) => setRefundType(e.target.value as "addon")}
                  />
                  <span>Addon Purchase</span>
                </label>
              </div>
            </div>

            {/* Payment/Addon ID */}
            <div className="space-y-2">
              <Label htmlFor="paymentId">
                {refundType === "payment" ? "Payment ID" : "Addon Purchase ID"}
              </Label>
              <Input
                id="paymentId"
                value={paymentId}
                onChange={(e) => setPaymentId(e.target.value)}
                placeholder={refundType === "payment" ? "pay_abc123" : "addon_abc123"}
                required
              />
            </div>

            {/* Amount (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="amount">
                Amount (Optional - leave empty for full refund)
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="10.50"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to refund the full amount
              </p>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Customer requested refund"
                required
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Refund...
                </>
              ) : (
                "Process Refund"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Result */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Refund Successful
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Refund Failed
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.success ? (
              <div className="space-y-3">
                <Alert>
                  <AlertDescription>{result.message}</AlertDescription>
                </Alert>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Refund ID:</span>{" "}
                    <span className="text-muted-foreground">{result.refundId}</span>
                  </div>
                  <div>
                    <span className="font-medium">Gateway Refund ID:</span>{" "}
                    <span className="text-muted-foreground">{result.gatewayRefundId}</span>
                  </div>
                  <div>
                    <span className="font-medium">Amount:</span>{" "}
                    <span className="text-muted-foreground">
                      {result.amount} {result.currency}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>{" "}
                    <span className="text-muted-foreground">{result.status}</span>
                  </div>
                  <div>
                    <span className="font-medium">Mode:</span>{" "}
                    <Badge variant={result.isTestMode ? "default" : "destructive"}>
                      {result.isTestMode ? "TEST" : "PRODUCTION"}
                    </Badge>
                  </div>
                </div>
                {result.isTestMode && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      This was a test refund. No real money was refunded.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <Alert variant="destructive">
                <AlertDescription>{result.error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
