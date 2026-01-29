import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, subDays } from "date-fns";
import { DollarSign, TrendingUp, CreditCard, AlertCircle, Search, Download, RefreshCw, Users, Building, Trash2 } from "lucide-react";
import type { BillingTransaction, BillingAnalytics } from "@shared/schema";

interface RefundDialogState {
  open: boolean;
  transaction: BillingTransaction | null;
}

// Helper to get default date range - Show ALL transactions by default (no date filter)
function getDefaultDateRange() {
  return {
    start: "",
    end: "",
  };
}

export function AdminBillingPortal() {
  const { toast } = useToast();
  
  // Default date range (last 30 days)
  const defaultDateRange = useMemo(() => getDefaultDateRange(), []);
  
  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [customerTypeFilter, setCustomerTypeFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState(defaultDateRange.start);
  const [endDate, setEndDate] = useState(defaultDateRange.end);
  const [page, setPage] = useState(1);
  const limit = 20;
  
  // Refund dialog
  const [refundDialog, setRefundDialog] = useState<RefundDialogState>({
    open: false,
    transaction: null,
  });
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  
  // Analytics period
  const [analyticsPeriod, setAnalyticsPeriod] = useState(30);
  
  // Fetch transactions
  const { data: transactionsData, isLoading: isLoadingTransactions } = useQuery<{
    transactions: BillingTransaction[];
    pagination: {
      page: number;
      limit: number;
      totalPages: number;
      totalCount: number;
    };
  }>({
    queryKey: [
      "/api/admin/billing/transactions",
      page,
      statusFilter,
      typeFilter,
      customerTypeFilter,
      search,
      startDate,
      endDate,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      // Only add status filter if it's not 'all'
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      // Only add type filter if it's not 'all'
      if (typeFilter && typeFilter !== 'all') {
        params.append('type', typeFilter);
      }
      // Only add customer type filter if it's not 'all'
      if (customerTypeFilter && customerTypeFilter !== 'all') {
        params.append('customerType', customerTypeFilter);
      }
      if (search) {
        params.append('search', search);
      }
      if (startDate) {
        params.append('startDate', startDate);
      }
      if (endDate) {
        params.append('endDate', endDate);
      }
      
      const response = await fetch(`/api/admin/billing/transactions?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      
      return response.json();
    },
  });
  
  // Fetch analytics
  const { data: analytics, isLoading: isLoadingAnalytics } = useQuery<BillingAnalytics>({
    queryKey: ["/api/admin/billing/analytics", analyticsPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/admin/billing/analytics?period=${analyticsPeriod}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      
      return response.json();
    },
  });
  
  // Fetch enhanced analytics
  const { data: enhancedAnalytics } = useQuery<any>({
    queryKey: ["/api/admin/billing/analytics/enhanced", analyticsPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/admin/billing/analytics/enhanced?period=${analyticsPeriod}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch enhanced analytics');
      }
      
      return response.json();
    },
  });
  
  // Fetch payment method breakdown
  const { data: paymentMethods } = useQuery<any>({
    queryKey: ["/api/admin/billing/payment-methods", analyticsPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/admin/billing/payment-methods?period=${analyticsPeriod}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch payment methods');
      }
      
      return response.json();
    },
  });
  
  // Fetch customer insights
  const { data: customerInsights } = useQuery<any>({
    queryKey: ["/api/admin/analytics/customer-insights"],
    queryFn: async () => {
      const response = await fetch(`/api/admin/analytics/customer-insights`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch customer insights');
      }
      
      return response.json();
    },
  });
  
  // Fetch payment gateway configuration
  const { data: paymentConfig } = useQuery<any>({
    queryKey: ["/api/admin/payment-config"],
    queryFn: async () => {
      const response = await fetch(`/api/admin/payment-config`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch payment config');
      }
      
      return response.json();
    },
  });
  
  // Process refund mutation
  const processRefundMutation = useMutation({
    mutationFn: async (data: {
      transactionId: string;
      transactionType: string;
      amount: string;
      reason: string;
    }) => {
      return await apiRequest("POST", "/api/admin/billing/refund", data);
    },
    onSuccess: () => {
      toast({
        title: "Refund Processed",
        description: "The refund has been successfully processed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/billing/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/billing/analytics"] });
      setRefundDialog({ open: false, transaction: null });
      setRefundAmount("");
      setRefundReason("");
    },
    onError: (error: Error) => {
      toast({
        title: "Refund Failed",
        description: error.message || "Failed to process refund. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Delete transaction mutation
  const deleteTransactionMutation = useMutation({
    mutationFn: async (data: { id: string; type: string }) => {
      return await apiRequest("DELETE", `/api/admin/billing/transaction/${data.id}?type=${data.type}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Transaction Deleted",
        description: "The transaction has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/billing/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/billing/analytics"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete transaction.",
        variant: "destructive",
      });
    },
  });
  
  const handleRefundSubmit = () => {
    if (!refundDialog.transaction) return;
    
    const amountInDollars = parseFloat(refundAmount);
    const originalAmountInCents = parseFloat(refundDialog.transaction.amount);
    const originalAmountInDollars = originalAmountInCents / 100;
    
    if (!refundAmount || amountInDollars <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid refund amount.",
        variant: "destructive",
      });
      return;
    }
    
    if (amountInDollars > originalAmountInDollars) {
      toast({
        title: "Invalid Amount",
        description: "Refund amount cannot exceed the original transaction amount.",
        variant: "destructive",
      });
      return;
    }
    
    if (!refundReason || !refundReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for the refund.",
        variant: "destructive",
      });
      return;
    }
    
    // Convert dollars to cents for backend
    const amountInCents = Math.round(amountInDollars * 100).toString();
    
    processRefundMutation.mutate({
      transactionId: refundDialog.transaction.id,
      transactionType: refundDialog.transaction.type,
      amount: amountInCents,
      reason: refundReason.trim(),
    });
  };
  
  const formatCurrency = (amount: string, currency: string = "INR") => {
    const value = parseFloat(amount) / 100;
    const locale = currency === "INR" ? "en-IN" : "en-US";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
    }).format(value);
  };
  
  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      succeeded: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      refunded: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
      partially_refunded: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-800"}`}>
        {status.replace(/_/g, " ").toUpperCase()}
      </span>
    );
  };
  
  const getTypeBadge = (type: string) => {
    return type === "subscription_payment" ? (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
        SUBSCRIPTION
      </span>
    ) : (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400">
        MINUTES
      </span>
    );
  };
  
  const canRefund = (transaction: BillingTransaction) => {
    return (
      transaction.status === "succeeded" &&
      !transaction.refundedAt &&
      transaction.razorpayPaymentId
    );
  };
  
  const formatDate = (dateInput: string | Date | null | undefined, formatStr: string = "MMM dd, yyyy HH:mm") => {
    if (!dateInput) return "—";
    try {
      const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
      if (isNaN(date.getTime())) return "—";
      return format(date, formatStr);
    } catch {
      return "—";
    }
  };
  
  const totalPages = transactionsData ? Math.ceil(transactionsData.pagination.totalCount / limit) : 0;
  
  return (
    <div className="space-y-6 p-6">
      {/* Analytics Dashboard */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Billing Portal
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage all transactions, refunds, and revenue analytics
            </p>
          </div>
          <Select value={analyticsPeriod.toString()} onValueChange={(v) => setAnalyticsPeriod(parseInt(v))}>
            <SelectTrigger className="w-[180px]" data-testid="select-analytics-period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last 365 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {isLoadingAnalytics ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : analytics ? (
          <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  ${(analytics.totalRevenue / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {analytics.totalTransactions} transactions
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Success Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {analytics.totalTransactions > 0
                    ? ((analytics.successfulPayments / analytics.totalTransactions) * 100).toFixed(1)
                    : 0}%
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {analytics.successfulPayments} successful
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
                  <CreditCard className="h-4 w-4 mr-1" />
                  Refunds
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  ${(analytics.totalRefundAmount / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {analytics.totalRefunds} refunds
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Failed Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {analytics.failedPayments}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {analytics.totalTransactions > 0
                    ? ((analytics.failedPayments / analytics.totalTransactions) * 100).toFixed(1)
                    : 0}% failure rate
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Customer Type Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  Individual Subscribers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  ${(analytics.individualRevenue / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {analytics.individualTransactions} transactions
                </p>
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                  {analytics.totalRevenue > 0
                    ? ((analytics.individualRevenue / analytics.totalRevenue) * 100).toFixed(1)
                    : 0}% of total revenue
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-purple-200 dark:border-purple-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
                  <Building className="h-4 w-4 mr-1" />
                  Enterprise/Team Licenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  ${(analytics.enterpriseRevenue / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {analytics.enterpriseTransactions} transactions
                </p>
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                  {analytics.totalRevenue > 0
                    ? ((analytics.enterpriseRevenue / analytics.totalRevenue) * 100).toFixed(1)
                    : 0}% of total revenue
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Enhanced Analytics */}
          {enhancedAnalytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-green-200 dark:border-green-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Conversion Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {enhancedAnalytics.conversionRate.toFixed(1)}%
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Payment success rate
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-blue-200 dark:border-blue-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Avg Transaction
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    ${(enhancedAnalytics.avgTransactionValue / 100).toFixed(2)}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Average order value
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-purple-200 dark:border-purple-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Revenue Growth
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${enhancedAnalytics.revenueGrowth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {enhancedAnalytics.revenueGrowth >= 0 ? '+' : ''}{enhancedAnalytics.revenueGrowth.toFixed(1)}%
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    vs previous period
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-orange-200 dark:border-orange-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Customers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {customerInsights?.totalCustomers || 0}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {customerInsights?.repeatCustomerRate || 0}% repeat rate
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Payment Methods Breakdown */}
          {paymentMethods && paymentMethods.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Revenue breakdown by payment method</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {paymentMethods.map((method: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium capitalize">{method.method}</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            ${(method.totalAmount / 100).toFixed(2)} ({method.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${method.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Customer Insights */}
          {customerInsights && (
            <Card>
              <CardHeader>
                <CardTitle>Customer Insights</CardTitle>
                <CardDescription>Customer value and behavior analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      ${(parseFloat(customerInsights.avgLifetimeValue) / 100).toFixed(2)}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Avg Lifetime Value</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {customerInsights.repeatCustomers}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Repeat Customers</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      ${(parseFloat(customerInsights.maxLifetimeValue) / 100).toFixed(2)}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Highest LTV</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          </div>
        ) : null}
      </div>
      
      {/* Transactions Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>All Transactions</CardTitle>
            <CardDescription>Search, filter, and manage all billing transactions</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                const params = new URLSearchParams({
                  export: 'csv',
                });
                
                if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
                if (typeFilter && typeFilter !== 'all') params.append('type', typeFilter);
                if (customerTypeFilter && customerTypeFilter !== 'all') params.append('customerType', customerTypeFilter);
                if (search) params.append('search', search);
                if (startDate) params.append('startDate', startDate);
                if (endDate) params.append('endDate', endDate);
                
                const response = await fetch(`/api/admin/billing/transactions?${params.toString()}`, {
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                  },
                });
                
                if (!response.ok) throw new Error('Export failed');
                
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `billing-transactions-${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                
                toast({
                  title: "Export Successful",
                  description: "Transactions exported to CSV",
                });
              } catch (error) {
                toast({
                  title: "Export Failed",
                  description: "Failed to export transactions",
                  variant: "destructive",
                });
              }
            }}
            data-testid="button-export-transactions"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by email or name..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
                data-testid="input-transaction-search"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger data-testid="select-status-filter">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="succeeded">Succeeded</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
                <SelectItem value="partially_refunded">Partially Refunded</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
              <SelectTrigger data-testid="select-type-filter">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="subscription_payment">Subscription</SelectItem>
                <SelectItem value="minutes_purchase">Minutes</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={customerTypeFilter} onValueChange={(v) => { setCustomerTypeFilter(v); setPage(1); }}>
              <SelectTrigger data-testid="select-customer-type-filter">
                <SelectValue placeholder="All Customer Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customer Types</SelectItem>
                <SelectItem value="individual">Individual Subscriber</SelectItem>
                <SelectItem value="enterprise">Enterprise/Team License</SelectItem>
              </SelectContent>
            </Select>
            
            <Input
              type="date"
              placeholder="Start Date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              data-testid="input-start-date"
            />
            
            <Input
              type="date"
              placeholder="End Date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              data-testid="input-end-date"
            />
          </div>
          
          {/* Table */}
          {isLoadingTransactions ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading transactions...</p>
            </div>
          ) : transactionsData && transactionsData.transactions.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Customer Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment ID</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactionsData.transactions.map((transaction) => (
                      <TableRow key={transaction.id} data-testid={`row-transaction-${transaction.id}`}>
                        <TableCell className="text-sm">
                          {formatDate(transaction.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {transaction.userFirstName} {transaction.userLastName}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {transaction.userEmail}
                          </div>
                        </TableCell>
                        <TableCell>{getTypeBadge(transaction.type)}</TableCell>
                        <TableCell>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {transaction.customerType || 'Individual Subscriber'}
                          </div>
                          {transaction.organizationName && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {transaction.organizationName}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(transaction.amount, transaction.currency)}
                          {transaction.refundAmount && (
                            <div className="text-xs text-purple-600 dark:text-purple-400">
                              Refunded: {formatCurrency(transaction.refundAmount, transaction.currency)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                        <TableCell className="text-xs font-mono text-gray-600 dark:text-gray-400">
                          {transaction.razorpayPaymentId || "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {canRefund(transaction) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setRefundDialog({ open: true, transaction });
                                  // Set default to full amount in dollars
                                  setRefundAmount((parseFloat(transaction.amount) / 100).toString());
                                  setRefundReason("");
                                }}
                                data-testid={`button-refund-${transaction.id}`}
                              >
                                Process Refund
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                              onClick={() => {
                                if (window.confirm("Are you sure you want to delete this transaction? This action cannot be undone.")) {
                                  deleteTransactionMutation.mutate({
                                    id: transaction.id,
                                    type: transaction.type,
                                  });
                                }
                              }}
                              data-testid={`button-delete-${transaction.id}`}
                              title="Delete transaction"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          {transaction.refundedAt && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              Refunded by {transaction.refundedByName}
                              <br />
                              {formatDate(transaction.refundedAt, "MMM dd, yyyy")}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, transactionsData.pagination.totalCount)} of{" "}
                  {transactionsData.pagination.totalCount} transactions
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    data-testid="button-prev-page"
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPage(pageNum)}
                          data-testid={`button-page-${pageNum}`}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    {totalPages > 5 && <span className="px-2">...</span>}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    data-testid="button-next-page"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No transactions found</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Refund Dialog */}
      <Dialog open={refundDialog.open} onOpenChange={(open) => setRefundDialog({ ...refundDialog, open })}>
        <DialogContent data-testid="dialog-refund">
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              Issue a full or partial refund for this transaction
            </DialogDescription>
          </DialogHeader>
          
          {refundDialog.transaction && (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">User:</span>
                  <span className="font-medium">
                    {refundDialog.transaction.userFirstName} {refundDialog.transaction.userLastName}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Original Amount:</span>
                  <span className="font-medium">
                    {formatCurrency(refundDialog.transaction.amount, refundDialog.transaction.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Transaction Date:</span>
                  <span className="font-medium">
                    {format(new Date(refundDialog.transaction.createdAt), "MMM dd, yyyy")}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="refund-amount">Refund Amount (in $)</Label>
                <Input
                  id="refund-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder="Enter amount in dollars"
                  data-testid="input-refund-amount"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Enter the refund amount in dollars. Max:{" "}
                  {formatCurrency(refundDialog.transaction.amount, refundDialog.transaction.currency)}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="refund-reason">Reason for Refund</Label>
                <Textarea
                  id="refund-reason"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Explain why this refund is being processed..."
                  rows={3}
                  data-testid="textarea-refund-reason"
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRefundDialog({ open: false, transaction: null })}
              data-testid="button-cancel-refund"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRefundSubmit}
              disabled={processRefundMutation.isPending}
              data-testid="button-submit-refund"
            >
              {processRefundMutation.isPending ? "Processing..." : "Process Refund"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
