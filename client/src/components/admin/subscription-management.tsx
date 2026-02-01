import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Calendar, XCircle, Clock, Users, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

interface Subscription {
  id: string;
  userId: string;
  planType: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  minutesUsed: string;
  minutesLimit: string;
  createdAt: string;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  status: string;
}

interface ExpiringSubscription {
  subscription: Subscription;
  user: User;
}

interface AllSubscriptionsUser extends User {
  subscription: Subscription | null;
}

export function SubscriptionManagement() {
  const { toast } = useToast();
  const [expiringDays, setExpiringDays] = useState(7);
  const [extendTrialDialog, setExtendTrialDialog] = useState<{ open: boolean; userId?: string; email?: string }>({ open: false });
  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; subscriptionId?: string; userEmail?: string }>({ open: false });
  const [trialDays, setTrialDays] = useState("7");
  const [cancelReason, setCancelReason] = useState("");
  
  // Filters for all subscriptions tab
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planTypeFilter, setPlanTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 20;

  // Fetch expiring subscriptions
  const { data: expiringSubscriptions, isLoading: isLoadingExpiring } = useQuery<{ subscriptions: ExpiringSubscription[] }>({
    queryKey: ["/api/admin/subscriptions/expiring-soon", expiringDays],
    queryFn: async () => {
      const accessToken = localStorage.getItem("accessToken");
      const response = await fetch(`/api/admin/subscriptions/expiring-soon?days=${expiringDays}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch expiring subscriptions");
      }
      return response.json();
    },
  });

  // Fetch all subscriptions
  const { data: allSubscriptionsData, isLoading: isLoadingAll } = useQuery<{ 
    users: AllSubscriptionsUser[];
    pagination: {
      page: number;
      limit: number;
      totalPages: number;
      totalCount: number;
    };
  }>({
    queryKey: ["/api/admin/users", page, searchQuery, statusFilter, planTypeFilter],
    queryFn: async () => {
      const accessToken = localStorage.getItem("accessToken");
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter && statusFilter !== 'all') params.append('subscriptionStatus', statusFilter);
      if (planTypeFilter && planTypeFilter !== 'all') params.append('planType', planTypeFilter);
      
      const response = await fetch(`/api/admin/users?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch users");
      }
      return response.json();
    },
  });

  const extendTrialMutation = useMutation({
    mutationFn: async ({ userId, days }: { userId: string; days: number }) => {
      const response = await apiRequest("POST", `/api/admin/subscriptions/${userId}/extend-trial`, { days });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to extend trial");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Trial Extended",
        description: "Trial period has been extended successfully.",
      });
      setExtendTrialDialog({ open: false });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscriptions/expiring-soon"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async ({ subscriptionId, reason }: { subscriptionId: string; reason: string }) => {
      const response = await apiRequest("POST", `/api/admin/subscriptions/${subscriptionId}/cancel`, { reason });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to cancel subscription");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscription Canceled",
        description: "Subscription has been canceled successfully.",
      });
      setCancelDialog({ open: false });
      setCancelReason("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscriptions/expiring-soon"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleExtendTrial = () => {
    if (extendTrialDialog.userId) {
      const days = parseInt(trialDays);
      if (days > 0) {
        extendTrialMutation.mutate({ userId: extendTrialDialog.userId, days });
      }
    }
  };

  const handleCancelSubscription = () => {
    if (cancelDialog.subscriptionId) {
      cancelSubscriptionMutation.mutate({
        subscriptionId: cancelDialog.subscriptionId,
        reason: cancelReason
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      trial: "secondary",
      canceled: "destructive",
      expired: "outline",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "N/A";
    return format(new Date(dateStr), 'MMM d, yyyy');
  };

  const formatDateRange = (startStr: string | null | undefined, endStr: string | null | undefined) => {
    if (!startStr || !endStr) {
      if (!startStr && !endStr) return "No date";
      if (!startStr) return `Ends: ${formatDate(endStr)}`;
      return `Starts: ${formatDate(startStr)}`;
    }
    return `${formatDate(startStr)} - ${formatDate(endStr)}`;
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diff = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50';
      case 'trial':
        return 'text-blue-600 bg-blue-50';
      case 'expired':
        return 'text-red-600 bg-red-50';
      case 'canceled':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6" data-testid="subscription-management">
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            All Subscriptions
          </TabsTrigger>
          <TabsTrigger value="expiring" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Expiring Soon
          </TabsTrigger>
        </TabsList>

        {/* ALL SUBSCRIPTIONS TAB */}
        <TabsContent value="all" className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-2xl">All Subscriptions</CardTitle>
              <CardDescription>View and manage all user subscriptions</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    className="pl-10 bg-white"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="canceled">Canceled</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={planTypeFilter} onValueChange={(v) => { setPlanTypeFilter(v); setPage(1); }}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="All Plans" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Plans</SelectItem>
                    <SelectItem value="free_trial">Free Trial</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                    <SelectItem value="three_year">3-Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Table */}
              {isLoadingAll ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  Loading...
                </div>
              ) : allSubscriptionsData?.users && allSubscriptionsData.users.length > 0 ? (
                <>
                  <div className="overflow-x-auto border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="font-semibold">User</TableHead>
                          <TableHead className="font-semibold">Email</TableHead>
                          <TableHead className="font-semibold">Plan</TableHead>
                          <TableHead className="font-semibold">Status</TableHead>
                          <TableHead className="font-semibold">Subscription Period</TableHead>
                          <TableHead className="font-semibold">Usage</TableHead>
                          <TableHead className="text-right font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allSubscriptionsData.users.map((user, index) => {
                          const sub = user.subscription;
                          return (
                            <TableRow key={user.id} data-testid={`sub-row-${index}`} className="hover:bg-gray-50">
                              <TableCell className="font-medium">
                                {user.firstName} {user.lastName}
                              </TableCell>
                              <TableCell className="text-sm">{user.email}</TableCell>
                              <TableCell>
                                {sub ? (
                                  <Badge variant="outline" className="capitalize">
                                    {sub.planType.replace(/_/g, ' ')}
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">No Plan</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {sub?.status ? (
                                  <Badge className={getStatusColor(sub.status)}>
                                    {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">None</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-sm">
                                {sub ? (
                                  <div className="space-y-1">
                                    <div>{formatDateRange(sub.currentPeriodStart, sub.currentPeriodEnd)}</div>
                                    {sub.currentPeriodEnd && getDaysUntilExpiry(sub.currentPeriodEnd) >= 0 && (
                                      <div className="text-xs text-amber-600 font-medium">
                                        {getDaysUntilExpiry(sub.currentPeriodEnd)} days left
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-500 italic">N/A</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {sub ? (
                                  <div className="flex flex-col gap-1">
                                    <div className="text-sm font-medium">
                                      {sub.minutesUsed && sub.minutesLimit
                                        ? `${sub.minutesUsed}/${sub.minutesLimit} min`
                                        : sub.minutesUsed
                                        ? `${sub.minutesUsed} min`
                                        : 'Unlimited'}
                                    </div>
                                    {sub.minutesLimit && (
                                      <div className="w-32 bg-gray-200 rounded-full h-2">
                                        <div
                                          className="bg-blue-600 h-2 rounded-full"
                                          style={{
                                            width: `${(parseInt(sub.minutesUsed || '0') / parseInt(sub.minutesLimit)) * 100}%`,
                                          }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-500 italic">N/A</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {sub && (
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="hover:bg-blue-50"
                                      onClick={() => setExtendTrialDialog({
                                        open: true,
                                        userId: user.id,
                                        email: user.email
                                      })}
                                      data-testid={`btn-extend-${index}`}
                                    >
                                      <Calendar className="h-4 w-4 mr-1" />
                                      Extend
                                    </Button>
                                    {sub.status !== 'canceled' && sub.status !== 'expired' && (
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        className="hover:bg-red-600"
                                        onClick={() => setCancelDialog({
                                          open: true,
                                          subscriptionId: sub.id,
                                          userEmail: user.email
                                        })}
                                        data-testid={`btn-cancel-${index}`}
                                      >
                                        <XCircle className="h-4 w-4 mr-1" />
                                        Cancel
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Pagination */}
                  {allSubscriptionsData.pagination && allSubscriptionsData.pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t">
                      <div className="text-sm text-muted-foreground font-medium">
                        Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, allSubscriptionsData.pagination.totalCount)} of {allSubscriptionsData.pagination.totalCount} subscriptions
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="hover:bg-gray-100"
                        >
                          ← Previous
                        </Button>
                        <div className="px-3 py-2 text-sm font-medium">
                          Page {page} of {allSubscriptionsData.pagination.totalPages}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(p => Math.min(allSubscriptionsData.pagination.totalPages, p + 1))}
                          disabled={page === allSubscriptionsData.pagination.totalPages}
                          className="hover:bg-gray-100"
                        >
                          Next →
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  No subscriptions found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* EXPIRING SOON TAB */}
        <TabsContent value="expiring" className="space-y-6">
          {/* Filter Controls */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-2xl">Subscriptions Expiring Soon</CardTitle>
              <CardDescription>Manage subscriptions ending soon</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Label htmlFor="expiring-days" className="font-semibold">Show subscriptions expiring within:</Label>
                <Input
                  id="expiring-days"
                  type="number"
                  min="1"
                  max="90"
                  value={expiringDays}
                  onChange={(e) => setExpiringDays(parseInt(e.target.value) || 7)}
                  className="w-24 bg-white"
                  data-testid="input-expiring-days"
                />
                <span className="text-sm text-muted-foreground">days</span>
              </div>
            </CardContent>
          </Card>

          {/* Expiring Subscriptions Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Expiring Subscriptions
              </CardTitle>
              <CardDescription>
                {isLoadingExpiring ? "Loading..." : expiringSubscriptions?.subscriptions.length || 0} subscriptions expiring in the next {expiringDays} days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingExpiring ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  Loading...
                </div>
              ) : expiringSubscriptions?.subscriptions && expiringSubscriptions.subscriptions.length > 0 ? (
                <div className="overflow-x-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-amber-50">
                        <TableHead className="font-semibold">User</TableHead>
                        <TableHead className="font-semibold">Email</TableHead>
                        <TableHead className="font-semibold">Plan</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Expiring In</TableHead>
                        <TableHead className="font-semibold">Expiry Date</TableHead>
                        <TableHead className="text-right font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expiringSubscriptions.subscriptions.map((item, index) => {
                        const daysLeft = getDaysUntilExpiry(item.subscription.currentPeriodEnd);
                        return (
                          <TableRow key={item.subscription.id} data-testid={`expiring-sub-${index}`} className="hover:bg-amber-50">
                            <TableCell className="font-medium">
                              {item.user.firstName} {item.user.lastName}
                            </TableCell>
                            <TableCell className="text-sm">{item.user.email}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {item.subscription.planType.replace(/_/g, ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(item.subscription.status)}>
                                {item.subscription.status.charAt(0).toUpperCase() + item.subscription.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-amber-600" />
                                <span className={`font-semibold ${daysLeft <= 3 ? 'text-red-600' : 'text-amber-600'}`}>
                                  {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm font-medium">
                              {formatDate(item.subscription.currentPeriodEnd)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="hover:bg-blue-50"
                                  onClick={() => setExtendTrialDialog({
                                    open: true,
                                    userId: item.user.id,
                                    email: item.user.email
                                  })}
                                  data-testid={`btn-extend-${index}`}
                                >
                                  <Calendar className="h-4 w-4 mr-1" />
                                  Extend
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="hover:bg-red-600"
                                  onClick={() => setCancelDialog({
                                    open: true,
                                    subscriptionId: item.subscription.id,
                                    userEmail: item.user.email
                                  })}
                                  data-testid={`btn-cancel-${index}`}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Cancel
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center space-y-3 max-w-md">
                    <div className="flex justify-center">
                      <div className="bg-green-50 rounded-full p-4">
                        <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">All Subscriptions Are Active! 🎉</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        No subscriptions expiring in the next {expiringDays} days. Your customers are all set!
                      </p>
                    </div>
                    <div className="pt-2">
                      <button
                        onClick={() => setExpiringDays(30)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Check for 30 days →
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Extend Trial Dialog */}
      <Dialog open={extendTrialDialog.open} onOpenChange={(open) => setExtendTrialDialog({ open })}>
        <DialogContent data-testid="dialog-extend-trial" className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Extend Subscription
            </DialogTitle>
            <DialogDescription className="pt-2">
              Extend subscription for <span className="font-semibold text-gray-900">{extendTrialDialog.email}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-6">
            <div className="space-y-2">
              <Label htmlFor="trial-days" className="font-semibold">Number of Days to Add</Label>
              <Input
                id="trial-days"
                type="number"
                min="1"
                max="365"
                value={trialDays}
                onChange={(e) => setTrialDays(e.target.value)}
                placeholder="7"
                data-testid="input-trial-days"
                className="text-lg"
              />
              <p className="text-xs text-gray-500 mt-2">
                Add up to 365 days to the subscription period
              </p>
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setExtendTrialDialog({ open: false })}
              data-testid="btn-cancel-extend"
            >
              Cancel
            </Button>
            <Button
              onClick={handleExtendTrial}
              disabled={extendTrialMutation.isPending || !trialDays || parseInt(trialDays) < 1}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="btn-confirm-extend"
            >
              {extendTrialMutation.isPending ? "Extending..." : "Extend"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Subscription Dialog */}
      <Dialog open={cancelDialog.open} onOpenChange={(open) => setCancelDialog({ open })}>
        <DialogContent data-testid="dialog-cancel-subscription" className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Cancel Subscription
            </DialogTitle>
            <DialogDescription className="pt-2">
              Cancel subscription for <span className="font-semibold text-gray-900">{cancelDialog.userEmail}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-6">
            <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-800">
              ⚠️ This action cannot be undone. The user will lose access to their subscription.
            </div>
            <div className="space-y-2">
              <Label htmlFor="cancel-reason" className="font-semibold">Reason for Cancellation</Label>
              <Textarea
                id="cancel-reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Enter reason for cancellation (optional)..."
                rows={4}
                data-testid="textarea-cancel-reason"
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setCancelDialog({ open: false });
                setCancelReason("");
              }}
              data-testid="btn-cancel-cancel"
            >
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={cancelSubscriptionMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
              data-testid="btn-confirm-cancel"
            >
              {cancelSubscriptionMutation.isPending ? "Canceling..." : "Yes, Cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
