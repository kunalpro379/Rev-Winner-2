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

  const getDaysUntilExpiry = (expiryDate: string) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diff = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
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
            <CardHeader>
              <CardTitle>All Subscriptions</CardTitle>
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
                    className="pl-10"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                  <SelectTrigger>
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
                  <SelectTrigger>
                    <SelectValue placeholder="All Plans" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Plans</SelectItem>
                    <SelectItem value="free_trial">Free Trial</SelectItem>
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
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Minutes Used</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allSubscriptionsData.users.map((user, index) => {
                        const sub = user.subscription;
                        return (
                          <TableRow key={user.id} data-testid={`sub-row-${index}`}>
                            <TableCell className="font-medium">
                              {user.firstName} {user.lastName}
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell className="capitalize">
                              {sub?.planType || "No Subscription"}
                            </TableCell>
                            <TableCell>
                              {sub?.status ? getStatusBadge(sub.status) : <Badge variant="outline">None</Badge>}
                            </TableCell>
                            <TableCell>{formatDate(sub?.currentPeriodStart)}</TableCell>
                            <TableCell>{formatDate(sub?.currentPeriodEnd)}</TableCell>
                            <TableCell>
                              {sub ? `${sub.minutesUsed}${sub.minutesLimit ? ` / ${sub.minutesLimit}` : ''}` : "N/A"}
                            </TableCell>
                            <TableCell className="text-right">
                              {sub && (
                                <div className="flex justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
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
                  
                  {/* Pagination */}
                  {allSubscriptionsData.pagination && allSubscriptionsData.pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-muted-foreground">
                        Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, allSubscriptionsData.pagination.totalCount)} of {allSubscriptionsData.pagination.totalCount} subscriptions
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={page === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(p => Math.min(allSubscriptionsData.pagination.totalPages, p + 1))}
                          disabled={page === allSubscriptionsData.pagination.totalPages}
                        >
                          Next
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
            <CardHeader>
              <CardTitle>Expiring Subscriptions</CardTitle>
              <CardDescription>Manage subscriptions expiring soon</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Label htmlFor="expiring-days">Show subscriptions expiring within:</Label>
                <Input
                  id="expiring-days"
                  type="number"
                  min="1"
                  max="90"
                  value={expiringDays}
                  onChange={(e) => setExpiringDays(parseInt(e.target.value) || 7)}
                  className="w-24"
                  data-testid="input-expiring-days"
                />
                <span className="text-sm text-muted-foreground">days</span>
              </div>
            </CardContent>
          </Card>

          {/* Expiring Subscriptions Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Subscriptions Expiring Soon
              </CardTitle>
              <CardDescription>
                {expiringSubscriptions?.subscriptions.length || 0} subscriptions expiring in the next {expiringDays} days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingExpiring ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  Loading...
                </div>
              ) : expiringSubscriptions?.subscriptions && expiringSubscriptions.subscriptions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Expires In</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expiringSubscriptions.subscriptions.map((item, index) => {
                      const daysLeft = getDaysUntilExpiry(item.subscription.currentPeriodEnd);
                      return (
                        <TableRow key={item.subscription.id} data-testid={`expiring-sub-${index}`}>
                          <TableCell className="font-medium">
                            {item.user.firstName} {item.user.lastName}
                          </TableCell>
                          <TableCell>{item.user.email}</TableCell>
                          <TableCell className="capitalize">{item.subscription.planType}</TableCell>
                          <TableCell>{getStatusBadge(item.subscription.status)}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
                            </span>
                          </TableCell>
                          <TableCell>{formatDate(item.subscription.currentPeriodEnd)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
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
              ) : (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  No subscriptions expiring in the next {expiringDays} days
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Extend Trial Dialog */}
      <Dialog open={extendTrialDialog.open} onOpenChange={(open) => setExtendTrialDialog({ open })}>
        <DialogContent data-testid="dialog-extend-trial">
          <DialogHeader>
            <DialogTitle>Extend Trial Period</DialogTitle>
            <DialogDescription>
              Extend trial period for {extendTrialDialog.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="trial-days">Number of Days</Label>
              <Input
                id="trial-days"
                type="number"
                min="1"
                max="90"
                value={trialDays}
                onChange={(e) => setTrialDays(e.target.value)}
                placeholder="7"
                data-testid="input-trial-days"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setExtendTrialDialog({ open: false })}
              data-testid="btn-cancel-extend"
            >
              Cancel
            </Button>
            <Button
              onClick={handleExtendTrial}
              disabled={extendTrialMutation.isPending}
              data-testid="btn-confirm-extend"
            >
              {extendTrialMutation.isPending ? "Extending..." : "Extend Trial"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Subscription Dialog */}
      <Dialog open={cancelDialog.open} onOpenChange={(open) => setCancelDialog({ open })}>
        <DialogContent data-testid="dialog-cancel-subscription">
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Cancel subscription for {cancelDialog.userEmail}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cancel-reason">Reason for Cancellation</Label>
              <Textarea
                id="cancel-reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Enter reason for cancellation..."
                rows={4}
                data-testid="textarea-cancel-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCancelDialog({ open: false });
                setCancelReason("");
              }}
              data-testid="btn-cancel-cancel"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={cancelSubscriptionMutation.isPending}
              data-testid="btn-confirm-cancel"
            >
              {cancelSubscriptionMutation.isPending ? "Canceling..." : "Cancel Subscription"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
