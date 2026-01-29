import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Clock,
  Activity,
  Loader2,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  Target,
  Zap,
  Globe,
  UserCheck,
  UserX,
  Repeat,
  CreditCard,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import { getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface UserGrowthData {
  date: string;
  count: number;
}

interface RevenueTrend {
  month: string;
  revenue: string;
}

interface TopUser {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  minutesUsed: string;
}

interface Metrics {
  totalUsers: number;
  activeUsers: number;
  trialUsers: number;
  paidUsers: number;
  suspendedUsers: number;
}

interface SubscriptionMetrics {
  totalSubscriptions: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  canceledSubscriptions: number;
}

interface RevenueMetrics {
  totalRevenue: string;
  monthlyRevenue: string;
  successfulPayments: number;
  failedPayments: number;
}

interface CustomerInsights {
  totalCustomers: number;
  newCustomersThisMonth: number;
  returningCustomers: number;
  customerRetentionRate: string;
  averageLifetimeValue: string;
  churnRate: string;
  monthlyRecurringRevenue: string;
  annualRecurringRevenue: string;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

export function AnalyticsDashboardEnhanced() {
  const { toast } = useToast();
  const [timePeriod, setTimePeriod] = useState("30");
  const [refreshing, setRefreshing] = useState(false);

  const { data: userMetrics, isLoading: isLoadingUsers, refetch: refetchUsers } = useQuery<{ data: Metrics }>({
    queryKey: ["/api/admin/metrics/users"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: subscriptionMetrics, isLoading: isLoadingSubs, refetch: refetchSubs } = useQuery<{ data: SubscriptionMetrics }>({
    queryKey: ["/api/admin/metrics/subscriptions"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: revenueMetrics, isLoading: isLoadingRevenue, refetch: refetchRevenue } = useQuery<{ data: RevenueMetrics }>({
    queryKey: ["/api/admin/metrics/revenue"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: customerInsights, isLoading: isLoadingInsights, refetch: refetchInsights } = useQuery<CustomerInsights>({
    queryKey: ["/api/admin/analytics/customer-insights"],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics/customer-insights", {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch customer insights");
      return res.json();
    },
  });

  const { data: userGrowth, isLoading: isLoadingGrowth, refetch: refetchGrowth } = useQuery<{ data: UserGrowthData[] }>({
    queryKey: ["/api/admin/analytics/user-growth", timePeriod],
    queryFn: async () => {
      const res = await fetch(`/api/admin/analytics/user-growth?days=${timePeriod}`, {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch user growth");
      return res.json();
    },
  });

  const { data: revenueTrends, isLoading: isLoadingTrends, refetch: refetchTrends } = useQuery<{ data: RevenueTrend[] }>({
    queryKey: ["/api/admin/analytics/revenue-trends"],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics/revenue-trends?months=12", {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch revenue trends");
      return res.json();
    },
  });

  const { data: topUsers, isLoading: isLoadingTopUsers, refetch: refetchTopUsers } = useQuery<{ users: TopUser[] }>({
    queryKey: ["/api/admin/analytics/top-users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics/top-users?limit=10", {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch top users");
      return res.json();
    },
  });

  const metrics = userMetrics?.data;
  const subMetrics = subscriptionMetrics?.data;
  const revMetrics = revenueMetrics?.data;

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(num)) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  const handleRefreshAll = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchUsers(),
        refetchSubs(),
        refetchRevenue(),
        refetchInsights(),
        refetchGrowth(),
        refetchTrends(),
        refetchTopUsers(),
      ]);
      toast({
        title: "Analytics Refreshed",
        description: "All analytics data has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh analytics data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleExportData = () => {
    const exportData = {
      generatedAt: new Date().toISOString(),
      userMetrics: metrics,
      subscriptionMetrics: subMetrics,
      revenueMetrics: revMetrics,
      customerInsights,
      userGrowth: userGrowth?.data,
      revenueTrends: revenueTrends?.data,
      topUsers: topUsers?.users,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.create

Element("a");
    a.href = url;
    a.download = `analytics-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Analytics data has been exported successfully.",
    });
  };

  const isLoading = isLoadingUsers || isLoadingSubs || isLoadingRevenue;

  // Prepare pie chart data for user distribution
  const userDistributionData = metrics ? [
    { name: "Active Users", value: metrics.activeUsers, color: COLORS[0] },
    { name: "Trial Users", value: metrics.trialUsers, color: COLORS[1] },
    { name: "Paid Users", value: metrics.paidUsers, color: COLORS[2] },
    { name: "Suspended", value: metrics.suspendedUsers, color: COLORS[3] },
  ].filter(item => item.value > 0) : [];

  // Prepare subscription distribution data
  const subscriptionDistributionData = subMetrics ? [
    { name: "Active", value: subMetrics.activeSubscriptions, color: COLORS[4] },
    { name: "Trial", value: subMetrics.trialSubscriptions, color: COLORS[1] },
    { name: "Canceled", value: subMetrics.canceledSubscriptions, color: COLORS[3] },
  ].filter(item => item.value > 0) : [];

  return (
    <div className="space-y-6" data-testid="analytics-dashboard-enhanced">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Comprehensive business insights and metrics</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefreshAll}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={handleExportData}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingUsers ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{metrics?.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics?.activeUsers || 0} active users
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingSubs ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {subMetrics?.activeSubscriptions || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {subMetrics?.trialSubscriptions || 0} on trial
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingRevenue ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {revMetrics ? formatCurrency(revMetrics.totalRevenue) : "₹0"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {revMetrics?.successfulPayments || 0} successful payments
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {isLoadingRevenue ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {revMetrics ? formatCurrency(revMetrics.monthlyRevenue) : "₹0"}
                </div>
                <p className="text-xs text-muted-foreground">Monthly revenue</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Advanced Metrics Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <Repeat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingInsights ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {customerInsights ? formatCurrency(customerInsights.monthlyRecurringRevenue) : "₹0"}
                </div>
                <p className="text-xs text-muted-foreground">Monthly Recurring Revenue</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ARR</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingInsights ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {customerInsights ? formatCurrency(customerInsights.annualRecurringRevenue) : "₹0"}
                </div>
                <p className="text-xs text-muted-foreground">Annual Recurring Revenue</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer LTV</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingInsights ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {customerInsights ? formatCurrency(customerInsights.averageLifetimeValue) : "₹0"}
                </div>
                <p className="text-xs text-muted-foreground">Average Lifetime Value</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            {isLoadingInsights ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {customerInsights?.churnRate || "0%"}
                </div>
                <p className="text-xs text-muted-foreground">Monthly churn rate</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Customer Health Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingInsights ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {customerInsights?.totalCustomers || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {customerInsights?.newCustomersThisMonth || 0} new this month
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Returning Customers</CardTitle>
            <Repeat className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {isLoadingInsights ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {customerInsights?.returningCustomers || 0}
                </div>
                <p className="text-xs text-muted-foreground">Repeat customers</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
            <Zap className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            {isLoadingInsights ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {customerInsights?.customerRetentionRate || "0%"}
                </div>
                <p className="text-xs text-muted-foreground">Customer retention</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Visualizations */}
      <Tabs defaultValue="growth" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="growth">Growth</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
            <TabsTrigger value="top-users">Top Users</TabsTrigger>
          </TabsList>
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Time Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="60">Last 60 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="growth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Growth Trend</CardTitle>
              <CardDescription>Daily new user registrations over time</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {isLoadingGrowth ? (
                <div className="flex items-center justify-center h-[400px]">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : userGrowth?.data && userGrowth.data.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart
                    data={[...userGrowth.data].sort((a, b) => 
                      new Date(a.date).getTime() - new Date(b.date).getTime()
                    )}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDate}
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                      allowDecimals={false}
                    />
                    <Tooltip
                      labelFormatter={formatDate}
                      contentStyle={{ 
                        borderRadius: "8px",
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))"
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#3b82f6"
                      fillOpacity={1}
                      fill="url(#colorUsers)"
                      name="New Users"
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      name="Trend"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                  No user growth data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends (Last 12 Months)</CardTitle>
              <CardDescription>Monthly revenue performance and growth</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {isLoadingTrends ? (
                <div className="flex items-center justify-center h-[400px]">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart 
                    data={(() => {
                      const months = [];
                      const now = new Date();
                      for (let i = 11; i >= 0; i--) {
                        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                        const monthStr = date.toISOString().slice(0, 7);
                        months.push({
                          month: monthStr,
                          revenue: 0
                        });
                      }
                      
                      if (revenueTrends?.data) {
                        revenueTrends.data.forEach(item => {
                          const idx = months.findIndex(m => m.month === item.month);
                          if (idx !== -1) {
                            months[idx].revenue = parseFloat(item.revenue) || 0;
                          }
                        });
                      }
                      
                      return months;
                    })()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
                    barSize={40}
                  >
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.3}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 11 }}
                      tickFormatter={formatMonth}
                      className="text-muted-foreground"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) =>
                        value >= 1000 ? `₹${(value / 1000).toFixed(1)}k` : `₹${value}`
                      }
                      className="text-muted-foreground"
                    />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(label) => formatMonth(label)}
                      contentStyle={{ 
                        borderRadius: "8px",
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))"
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="revenue"
                      fill="url(#colorRevenue)"
                      radius={[8, 8, 0, 0]}
                      name="Revenue (₹)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* User Distribution Card */}
            <Card>
              <CardHeader>
                <CardTitle>User Distribution</CardTitle>
                <CardDescription>Breakdown by user type</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {isLoadingUsers ? (
                  <div className="flex items-center justify-center h-[350px]">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : metrics && metrics.totalUsers > 0 ? (
                  <div className="space-y-4">
                    {/* Pie Chart */}
                    <ResponsiveContainer width="100%" height={250}>
                      <RechartsPieChart>
                        <Pie
                          data={userDistributionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {userDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => value.toLocaleString()}
                          contentStyle={{ 
                            borderRadius: "8px",
                            backgroundColor: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))"
                          }}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                    
                    {/* Legend */}
                    <div className="grid grid-cols-2 gap-3">
                      {userDistributionData.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: item.color }}
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.value.toLocaleString()} ({((item.value / metrics.totalUsers) * 100).toFixed(1)}%)
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                    No user data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Subscription Distribution Card */}
            <Card>
              <CardHeader>
                <CardTitle>Subscription Status</CardTitle>
                <CardDescription>Current subscription breakdown</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {isLoadingSubs ? (
                  <div className="flex items-center justify-center h-[350px]">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : subMetrics && subMetrics.totalSubscriptions > 0 ? (
                  <div className="space-y-4">
                    {/* Pie Chart */}
                    <ResponsiveContainer width="100%" height={250}>
                      <RechartsPieChart>
                        <Pie
                          data={subscriptionDistributionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {subscriptionDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => value.toLocaleString()}
                          contentStyle={{ 
                            borderRadius: "8px",
                            backgroundColor: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))"
                          }}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                    
                    {/* Legend */}
                    <div className="grid grid-cols-2 gap-3">
                      {subscriptionDistributionData.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: item.color }}
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.value.toLocaleString()} ({((item.value / subMetrics.totalSubscriptions) * 100).toFixed(1)}%)
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                    No subscription data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Additional Bar Chart View */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* User Types Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>User Types Comparison</CardTitle>
                <CardDescription>Detailed user breakdown</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {isLoadingUsers ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : userDistributionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart 
                      data={userDistributionData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={90}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip
                        formatter={(value: number) => value.toLocaleString()}
                        contentStyle={{ 
                          borderRadius: "8px",
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))"
                        }}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {userDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No user data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Subscription Status Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Subscription Status Comparison</CardTitle>
                <CardDescription>Subscription breakdown by status</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {isLoadingSubs ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : subscriptionDistributionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart 
                      data={subscriptionDistributionData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={90}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip
                        formatter={(value: number) => value.toLocaleString()}
                        contentStyle={{ 
                          borderRadius: "8px",
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))"
                        }}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {subscriptionDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No subscription data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="top-users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Users by Usage</CardTitle>
              <CardDescription>
                Users with highest session minutes consumed
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTopUsers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : topUsers?.users && topUsers.users.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-right">Minutes Used</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topUsers.users.map((user, index) => (
                      <TableRow key={user.userId || index}>
                        <TableCell className="font-medium">
                          #{index + 1}
                        </TableCell>
                        <TableCell className="font-medium">
                          {user.firstName || ""} {user.lastName || ""}
                        </TableCell>
                        <TableCell>{user.email || "N/A"}</TableCell>
                        <TableCell className="text-right">
                          <span className="inline-flex items-center gap-1 font-semibold">
                            <Clock className="h-3 w-3" />
                            {parseInt(user.minutesUsed || "0").toLocaleString()}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  No usage data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

