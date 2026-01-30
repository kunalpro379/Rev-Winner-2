import { useQuery } from "@tanstack/react-query";
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
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Clock,
  Activity,
  Loader2,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getQueryFn } from "@/lib/queryClient";

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

export function AnalyticsDashboard() {
  const { data: userMetrics, isLoading: isLoadingUsers } = useQuery<{ data: Metrics }>({
    queryKey: ["/api/admin/metrics/users"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: subscriptionMetrics, isLoading: isLoadingSubs } = useQuery<{ data: SubscriptionMetrics }>({
    queryKey: ["/api/admin/metrics/subscriptions"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: revenueMetrics, isLoading: isLoadingRevenue } = useQuery<{ data: RevenueMetrics }>({
    queryKey: ["/api/admin/metrics/revenue"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: userGrowth, isLoading: isLoadingGrowth } = useQuery<{ data: UserGrowthData[] }>({
    queryKey: ["/api/admin/analytics/user-growth"],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics/user-growth?days=30", {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch user growth");
      return res.json();
    },
  });

  const { data: revenueTrends, isLoading: isLoadingTrends } = useQuery<{ data: RevenueTrend[] }>({
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

  const { data: topUsers, isLoading: isLoadingTopUsers } = useQuery<{ users: TopUser[] }>({
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

  const isLoading = isLoadingUsers || isLoadingSubs || isLoadingRevenue;

  return (
    <div className="space-y-6" data-testid="analytics-dashboard">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-total-users">
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

        <Card data-testid="card-subscriptions">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
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

        <Card data-testid="card-total-revenue">
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
                  {revMetrics ? formatCurrency(revMetrics.totalRevenue) : "$0"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {revMetrics?.successfulPayments || 0} successful payments
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-monthly-revenue">
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

      {/* Charts */}
      <Tabs defaultValue="user-growth" className="space-y-4">
        <TabsList>
          <TabsTrigger value="user-growth" data-testid="tab-user-growth">
            User Growth
          </TabsTrigger>
          <TabsTrigger value="revenue-trends" data-testid="tab-revenue-trends">
            Revenue Trends
          </TabsTrigger>
          <TabsTrigger value="top-users" data-testid="tab-top-users">
            Top Users
          </TabsTrigger>
        </TabsList>

        <TabsContent value="user-growth" className="space-y-4">
          <Card data-testid="chart-user-growth">
            <CardHeader>
              <CardTitle>User Growth (Last 30 Days)</CardTitle>
              <CardDescription>Daily new user registrations</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {isLoadingGrowth ? (
                <div className="flex items-center justify-center h-[300px]">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : userGrowth?.data && userGrowth.data.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart 
                    data={[...userGrowth.data].sort((a, b) => 
                      new Date(a.date).getTime() - new Date(b.date).getTime()
                    )}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
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
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      connectNulls={true}
                      isAnimationActive={true}
                      name="New Users"
                      dot={{ 
                        r: 5, 
                        fill: "#3b82f6", 
                        strokeWidth: 2,
                        stroke: "#ffffff"
                      }}
                      activeDot={{ 
                        r: 7, 
                        fill: "#3b82f6", 
                        strokeWidth: 3,
                        stroke: "#ffffff"
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No user growth data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue-trends" className="space-y-4">
          <Card data-testid="chart-revenue-trends">
            <CardHeader>
              <CardTitle>Revenue Trends (Last 12 Months)</CardTitle>
              <CardDescription>Monthly revenue performance</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {isLoadingTrends ? (
                <div className="flex items-center justify-center h-[300px]">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    data={(() => {
                      // Generate all 12 months
                      const months = [];
                      const now = new Date();
                      for (let i = 11; i >= 0; i--) {
                        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                        const monthStr = date.toISOString().slice(0, 7); // YYYY-MM
                        months.push({
                          month: monthStr,
                          revenue: 0
                        });
                      }
                      
                      // Fill in actual data
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
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    barSize={35}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 11 }}
                      tickFormatter={formatMonth}
                      className="text-muted-foreground"
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) =>
                        value >= 1000 ? `₹${(value / 1000).toFixed(1)}k` : `₹${value}`
                      }
                      className="text-muted-foreground"
                    />
                    <Tooltip
                      formatter={(value: number) =>
                        formatCurrency(value)
                      }
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
                      fill="#3b82f6"
                      radius={[6, 6, 0, 0]}
                      name="Revenue (₹)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="top-users" className="space-y-4">
          <Card data-testid="table-top-users">
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
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-right">Minutes Used</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topUsers.users.map((user, index) => (
                      <TableRow
                        key={user.userId || index}
                        data-testid={`top-user-${index}`}
                      >
                        <TableCell className="font-medium">
                          {user.firstName || ""} {user.lastName || ""}
                        </TableCell>
                        <TableCell>{user.email || "N/A"}</TableCell>
                        <TableCell className="text-right">
                          <span className="inline-flex items-center gap-1">
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
