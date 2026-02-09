import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  User, 
  Clock, 
  DollarSign, 
  Activity,
  Ban,
  CheckCircle,
  RefreshCw,
  Loader2,
  Download
} from "lucide-react";
import { format } from "date-fns";

export default function AdminUserDetail() {
  const [, params] = useRoute("/admin/users/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const userId = params?.id;
  
  // Dialog states
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isTimeExtensionDialogOpen, setIsTimeExtensionDialogOpen] = useState(false);
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  
  // Form states
  const [newStatus, setNewStatus] = useState("");
  const [statusReason, setStatusReason] = useState("");
  const [extensionType, setExtensionType] = useState("trial_extension");
  const [extensionValue, setExtensionValue] = useState("");
  const [extensionReason, setExtensionReason] = useState("");
  const [refundPaymentId, setRefundPaymentId] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  
  // Fetch comprehensive user profile
  const { data: profileData, isLoading, refetch: refetchProfile } = useQuery({
    queryKey: ["/api/admin/users", userId, "detailed"],
    enabled: !!userId,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/users/${userId}/detailed`);
      return res.json();
    },
    refetchOnWindowFocus: true,
    staleTime: 0,
    gcTime: 0,
  });
  
  // Fetch session history
  const { data: sessionData, refetch: refetchSessions } = useQuery({
    queryKey: ["/api/admin/users", userId, "session-history"],
    enabled: !!userId,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/users/${userId}/session-history`);
      return res.json();
    },
    refetchOnWindowFocus: true,
    staleTime: 0,
    gcTime: 0,
  });
  
  // Fetch time extensions
  const { data: extensionsData, refetch: refetchExtensions } = useQuery({
    queryKey: ["/api/admin/users", userId, "time-extensions"],
    enabled: !!userId,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/users/${userId}/time-extensions`);
      return res.json();
    },
    refetchOnWindowFocus: true,
    staleTime: 0,
    gcTime: 0,
  });
  
  // Fetch refunds
  const { data: refundsData, refetch: refetchRefunds } = useQuery({
    queryKey: ["/api/admin/users", userId, "refunds"],
    enabled: !!userId,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/users/${userId}/refunds`);
      return res.json();
    },
    refetchOnWindowFocus: true,
    staleTime: 0,
    gcTime: 0,
  });

  const { data: basicUserData } = useQuery({
    queryKey: ["/api/admin/users", userId],
    enabled: !!userId,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/users/${userId}`);
      return res.json();
    },
    refetchOnWindowFocus: true,
    staleTime: 0,
    gcTime: 0,
  });
  
  // Update user status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (data: { status: string; reason?: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}/status`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", userId, "detailed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users/detailed"] });
      refetchProfile();
      toast({
        title: "Success",
        description: "User status updated successfully",
      });
      setIsStatusDialogOpen(false);
      setStatusReason("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user status",
        variant: "destructive",
      });
    },
  });
  
  // Grant time extension mutation
  const grantExtensionMutation = useMutation({
    mutationFn: async (data: { extensionType: string; extensionValue: string; reason: string }) => {
      const res = await apiRequest("POST", `/api/admin/users/${userId}/time-extension`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", userId, "detailed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", userId, "time-extensions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users/detailed"] });
      refetchProfile();
      refetchExtensions();
      toast({
        title: "Success",
        description: "Time extension granted successfully",
      });
      setIsTimeExtensionDialogOpen(false);
      setExtensionValue("");
      setExtensionReason("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to grant time extension",
        variant: "destructive",
      });
    },
  });
  
  // Issue refund mutation
  const issueRefundMutation = useMutation({
    mutationFn: async (data: { paymentId: string; userId: string; amount: string; currency: string; reason: string }) => {
      const res = await apiRequest("POST", "/api/admin/refunds", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", userId, "detailed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", userId, "refunds"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users/detailed"] });
      refetchProfile();
      refetchRefunds();
      toast({
        title: "Success",
        description: "Refund issued successfully",
      });
      setIsRefundDialogOpen(false);
      setRefundPaymentId("");
      setRefundAmount("");
      setRefundReason("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to issue refund",
        variant: "destructive",
      });
    },
  });
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen" data-testid="loading-user-detail">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!profileData) {
    return (
      <div className="text-center py-12" data-testid="user-not-found">
        <p className="text-muted-foreground">User not found</p>
        <Button onClick={() => setLocation("/admin")} className="mt-4" data-testid="btn-back-to-admin">
          Back to Admin
        </Button>
      </div>
    );
  }
  
  // Extract data from API response - user object contains all fields from database query
  const user = (profileData as any)?.user;
  const sessionStats = (profileData as any)?.sessionStats || {};
  const payments = (profileData as any)?.recentPayments || [];
  const fallbackPayments = (basicUserData as any)?.payments || [];
  const paymentList = payments.length ? payments : fallbackPayments;
  const activeExtensions = (profileData as any)?.activeExtensions || [];
  const userRefunds = (profileData as any)?.refunds || [];
  const sessions = (sessionData as any)?.sessions || [];
  const extensions = (extensionsData as any)?.extensions || [];
  const allRefunds = (refundsData as any)?.refunds || [];
  
  // Log user data for debugging (remove in production)
  console.log('Admin User Detail - User Data:', {
    userId: user?.id,
    email: user?.email,
    plan_type: user?.plan_type,
    subscription_status: user?.subscription_status,
    sessions_used: user?.sessions_used,
    sessions_limit: user?.sessions_limit,
    minutes_used: user?.minutes_used,
    minutes_limit: user?.minutes_limit,
    subscription_id: user?.subscription_id,
  });
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500 dark:bg-green-600" data-testid="badge-user-status">Active</Badge>;
      case "suspended":
        return <Badge variant="destructive" data-testid="badge-user-status">Suspended</Badge>;
      case "pending":
        return <Badge variant="secondary" data-testid="badge-user-status">Pending</Badge>;
      default:
        return <Badge variant="outline" data-testid="badge-user-status">{status}</Badge>;
    }
  };
  
  const handleUpdateStatus = () => {
    setNewStatus(user.status);
    setIsStatusDialogOpen(true);
  };
  
  const handleGrantExtension = () => {
    setIsTimeExtensionDialogOpen(true);
  };

  const handleRefreshData = () => {
    refetchProfile();
    refetchSessions();
    refetchExtensions();
    refetchRefunds();
  };
  
  const handleIssueRefund = (payment: any) => {
    setRefundPaymentId(payment.id);
    setRefundAmount(payment.amount);
    setIsRefundDialogOpen(true);
  };
  
  const submitStatusUpdate = () => {
    updateStatusMutation.mutate({
      status: newStatus,
      reason: statusReason || undefined,
    });
  };
  
  const submitTimeExtension = () => {
    grantExtensionMutation.mutate({
      extensionType,
      extensionValue,
      reason: extensionReason,
    });
  };
  
  const submitRefund = () => {
    if (!userId) return;
    issueRefundMutation.mutate({
      paymentId: refundPaymentId,
      userId,
      amount: refundAmount,
      currency: "INR",
      reason: refundReason,
    });
  };
  
  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="admin-user-detail">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setLocation("/admin")} data-testid="btn-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-user-name">
              {user.first_name} {user.last_name}
            </h1>
            <p className="text-muted-foreground" data-testid="text-user-email">{user.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefreshData} data-testid="btn-refresh-user">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleUpdateStatus} data-testid="btn-change-status">
            {user.status === "active" ? (
              <>
                <Ban className="mr-2 h-4 w-4" />
                Suspend
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Activate
              </>
            )}
          </Button>
          <Button onClick={handleGrantExtension} data-testid="btn-grant-extension">
            <Clock className="mr-2 h-4 w-4" />
            Grant Extension
          </Button>
        </div>
      </div>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {getStatusBadge(user.status)}
              <Badge variant="outline" data-testid="badge-user-role">{user.role}</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" data-testid="text-total-sessions">{sessionStats.totalSessions}</p>
            <p className="text-xs text-muted-foreground">{sessionStats.totalDurationMinutes} minutes used</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Minutes Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" data-testid="text-minutes-remaining">{user.total_minutes_remaining || 0}</p>
            <p className="text-xs text-muted-foreground">Available minutes</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" data-testid="text-total-payments">{user.total_payments || 0}</p>
            <p className="text-xs text-muted-foreground">Successful payments</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Detailed Information Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="sessions" data-testid="tab-sessions">Sessions</TabsTrigger>
          <TabsTrigger value="payments" data-testid="tab-payments">Payments</TabsTrigger>
          <TabsTrigger value="extensions" data-testid="tab-extensions">Extensions</TabsTrigger>
          <TabsTrigger value="refunds" data-testid="tab-refunds">Refunds</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Username</Label>
                <p className="font-medium" data-testid="text-overview-username">@{user.username}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Mobile</Label>
                <p className="font-medium" data-testid="text-overview-mobile">{user.mobile || "Not provided"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Organization</Label>
                <p className="font-medium" data-testid="text-overview-org">{user.organization || "Not provided"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">AI Provider</Label>
                <p className="font-medium" data-testid="text-overview-ai">
                  {user.ai_engine || "Not configured"}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Member Since</Label>
                <p className="font-medium" data-testid="text-overview-joined">
                  {format(new Date(user.created_at), "MMMM d, yyyy")}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Email Verified</Label>
                <p className="font-medium" data-testid="text-overview-verified">
                  {user.email_verified ? "Yes" : "No"}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Subscription Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Plan Type</Label>
                <p className="font-medium" data-testid="text-plan-type">{user.plan_type || "No active plan"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Subscription Status</Label>
                <p className="font-medium" data-testid="text-sub-status">{user.subscription_status || "N/A"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Sessions Used</Label>
                <p className="font-medium" data-testid="text-sessions-used">
                  {user.sessions_used || 0} / {user.sessions_limit || "Unlimited"}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Minutes Used</Label>
                <p className="font-medium" data-testid="text-minutes-used">
                  {user.minutes_used || 0} / {user.minutes_limit || "Unlimited"}
                </p>
              </div>
              {user.current_period_end && (
                <div>
                  <Label className="text-muted-foreground">Subscription Ends</Label>
                  <p className="font-medium" data-testid="text-period-end">
                    {format(new Date(user.current_period_end), "MMMM d, yyyy")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {activeExtensions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Active Time Extensions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {activeExtensions.map((ext: any) => (
                    <div key={ext.id} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <p className="font-medium">{ext.extensionType.replace("_", " ")}</p>
                        <p className="text-sm text-muted-foreground">{ext.reason}</p>
                      </div>
                      <Badge>{ext.extensionValue} {ext.extensionType === "minutes_addition" ? "min" : "days"}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Sessions Tab */}
        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>Session History</CardTitle>
              <CardDescription>Recent session usage for this user</CardDescription>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8" data-testid="no-sessions">No sessions found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Session ID</TableHead>
                      <TableHead>Start Time</TableHead>
                      <TableHead>End Time</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((session: any) => {
                      const startTime = new Date(session.startTime);
                      const endTime = session.endTime ? new Date(session.endTime) : null;
                      const isActive = session.status === "active";
                      
                      // Calculate duration
                      let durationText = "-";
                      if (session.durationSeconds) {
                        const minutes = Math.floor(Number(session.durationSeconds) / 60);
                        const seconds = Number(session.durationSeconds) % 60;
                        durationText = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
                      } else if (isActive) {
                        // For active sessions, calculate current duration
                        const now = new Date();
                        const durationMs = now.getTime() - startTime.getTime();
                        const minutes = Math.floor(durationMs / 60000);
                        durationText = `${minutes}m (ongoing)`;
                      }
                      
                      // Format times in IST (Indian Standard Time)
                      const formatIST = (date: Date) => {
                        return date.toLocaleString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        });
                      };
                      
                      return (
                        <TableRow key={session.id}>
                          <TableCell className="font-mono text-sm">{session.sessionId.substring(0, 12)}...</TableCell>
                          <TableCell>{formatIST(startTime)}</TableCell>
                          <TableCell>
                            {endTime ? formatIST(endTime) : (
                              <span className="text-muted-foreground italic">Not ended</span>
                            )}
                          </TableCell>
                          <TableCell>{durationText}</TableCell>
                          <TableCell>
                            <Badge variant={isActive ? "default" : "secondary"}>
                              {session.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Payments Tab */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>All payment transactions for this user</CardDescription>
            </CardHeader>
            <CardContent>
              {paymentList.length === 0 ? (
                <p className="text-center text-muted-foreground py-8" data-testid="no-payments">No payments found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentList.map((payment: any) => (
                      <TableRow key={payment.id}>
                        <TableCell>{format(new Date(payment.createdAt), "MMM d, yyyy")}</TableCell>
                        <TableCell className="font-medium">
                          {(payment.currency || "INR") === "INR" ? "₹" : "$"}{payment.amount}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={payment.status === "succeeded" ? "default" : payment.status === "refunded" ? "secondary" : "destructive"}
                          >
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{payment.paymentMethod || "Card"}</TableCell>
                        <TableCell>
                          {payment.status === "succeeded" && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleIssueRefund(payment)}
                              data-testid={`btn-refund-${payment.id}`}
                            >
                              <DollarSign className="h-4 w-4 mr-2" />
                              Refund
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Extensions Tab */}
        <TabsContent value="extensions">
          <Card>
            <CardHeader>
              <CardTitle>Time Extensions History</CardTitle>
              <CardDescription>All time extensions granted to this user</CardDescription>
            </CardHeader>
            <CardContent>
              {extensions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8" data-testid="no-extensions">No extensions found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Granted By</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {extensions.map((ext: any) => (
                      <TableRow key={ext.id}>
                        <TableCell className="font-medium">{ext.extension_type?.replace("_", " ")}</TableCell>
                        <TableCell>{ext.extension_value}</TableCell>
                        <TableCell>{ext.reason}</TableCell>
                        <TableCell>{ext.granted_by_name}</TableCell>
                        <TableCell>{format(new Date(ext.created_at), "MMM d, yyyy")}</TableCell>
                        <TableCell>
                          <Badge variant={ext.status === "active" ? "default" : "secondary"}>
                            {ext.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Refunds Tab */}
        <TabsContent value="refunds">
          <Card>
            <CardHeader>
              <CardTitle>Refund History</CardTitle>
              <CardDescription>All refunds issued to this user</CardDescription>
            </CardHeader>
            <CardContent>
              {allRefunds.length === 0 ? (
                <p className="text-center text-muted-foreground py-8" data-testid="no-refunds">No refunds found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Processed By</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allRefunds.map((refund: any) => (
                      <TableRow key={refund.id}>
                        <TableCell>{format(new Date(refund.created_at), "MMM d, yyyy")}</TableCell>
                        <TableCell className="font-medium">₹{refund.amount}</TableCell>
                        <TableCell>{refund.reason}</TableCell>
                        <TableCell>{refund.processed_by_name || "System"}</TableCell>
                        <TableCell>
                          <Badge variant={refund.status === "processed" ? "default" : "secondary"}>
                            {refund.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Update Status Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent data-testid="dialog-update-status">
          <DialogHeader>
            <DialogTitle>Update User Status</DialogTitle>
            <DialogDescription>
              Update the status for {user.first_name} {user.last_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-status">New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger id="new-status" data-testid="select-new-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status-reason">Reason (Optional)</Label>
              <Textarea
                id="status-reason"
                placeholder="Why is this status being changed?"
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                data-testid="textarea-status-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)} data-testid="btn-cancel-status">
              Cancel
            </Button>
            <Button 
              onClick={submitStatusUpdate} 
              disabled={updateStatusMutation.isPending}
              data-testid="btn-submit-status"
            >
              {updateStatusMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Status"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Grant Time Extension Dialog */}
      <Dialog open={isTimeExtensionDialogOpen} onOpenChange={setIsTimeExtensionDialogOpen}>
        <DialogContent data-testid="dialog-time-extension">
          <DialogHeader>
            <DialogTitle>Grant Time Extension</DialogTitle>
            <DialogDescription>
              Grant a time extension to {user.first_name} {user.last_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="extension-type">Extension Type</Label>
              <Select value={extensionType} onValueChange={setExtensionType}>
                <SelectTrigger id="extension-type" data-testid="select-extension-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial_extension">Trial Extension (Days)</SelectItem>
                  <SelectItem value="minutes_addition">Minutes Addition</SelectItem>
                  <SelectItem value="subscription_extension">Subscription Extension (Days)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="extension-value">
                {extensionType === "minutes_addition" ? "Minutes" : "Days"}
              </Label>
              <Input
                id="extension-value"
                type="number"
                placeholder={extensionType === "minutes_addition" ? "e.g., 60" : "e.g., 7"}
                value={extensionValue}
                onChange={(e) => setExtensionValue(e.target.value)}
                data-testid="input-extension-value"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="extension-reason">Reason</Label>
              <Textarea
                id="extension-reason"
                placeholder="Why are you granting this extension?"
                value={extensionReason}
                onChange={(e) => setExtensionReason(e.target.value)}
                data-testid="textarea-extension-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTimeExtensionDialogOpen(false)} data-testid="btn-cancel-extension">
              Cancel
            </Button>
            <Button 
              onClick={submitTimeExtension} 
              disabled={grantExtensionMutation.isPending || !extensionValue || !extensionReason}
              data-testid="btn-submit-extension"
            >
              {grantExtensionMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Granting...
                </>
              ) : (
                "Grant Extension"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Issue Refund Dialog */}
      <Dialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
        <DialogContent data-testid="dialog-refund">
          <DialogHeader>
            <DialogTitle>Issue Refund</DialogTitle>
            <DialogDescription>
              Issue a refund for {user.first_name} {user.last_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="refund-amount">Refund Amount (₹)</Label>
              <Input
                id="refund-amount"
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                data-testid="input-refund-amount"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="refund-reason">Reason</Label>
              <Textarea
                id="refund-reason"
                placeholder="Why is this refund being issued?"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                data-testid="textarea-refund-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRefundDialogOpen(false)} data-testid="btn-cancel-refund">
              Cancel
            </Button>
            <Button 
              onClick={submitRefund} 
              disabled={issueRefundMutation.isPending || !refundAmount || !refundReason}
              data-testid="btn-submit-refund"
            >
              {issueRefundMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Issue Refund"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
