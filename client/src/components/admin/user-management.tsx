import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Search,
  MoreVertical,
  Eye,
  Ban,
  CheckCircle,
  Clock,
  DollarSign,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";

export default function UserManagement() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [planTypeFilter, setPlanTypeFilter] = useState<string>("all");

  // Dialog states
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isTimeExtensionDialogOpen, setIsTimeExtensionDialogOpen] =
    useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Form states
  const [newStatus, setNewStatus] = useState("");
  const [statusReason, setStatusReason] = useState("");
  const [extensionType, setExtensionType] = useState("trial_extension");
  const [extensionValue, setExtensionValue] = useState("");
  const [extensionReason, setExtensionReason] = useState("");

  // Fetch users with filters
  const { data, isLoading } = useQuery({
    queryKey: [
      "/api/admin/users/detailed",
      searchQuery,
      statusFilter,
      roleFilter,
      planTypeFilter,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (roleFilter !== "all") params.append("role", roleFilter);
      if (planTypeFilter !== "all") params.append("planType", planTypeFilter);

      const url = `/api/admin/users/detailed${params.toString() ? `?${params.toString()}` : ""}`;
      const accessToken = localStorage.getItem("accessToken");

      const res = await fetch(url, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        credentials: "include",
      });

      if (!res.ok) {
        let errorMessage = res.statusText;
        try {
          const json = await res.json();
          errorMessage = json.message || json.error || errorMessage;
        } catch (e) {
          try {
            const text = await res.text();
            errorMessage = text || errorMessage;
          } catch (textError) {
            // Use statusText as fallback
          }
        }
        throw new Error(`${res.status}: ${errorMessage}`);
      }

      return res.json();
    },
  });

  const users = (data as { users?: any[] })?.users || [];

  // Update user status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (data: {
      userId: string;
      status: string;
      reason?: string;
    }) => {
      const res = await apiRequest(
        "PATCH",
        `/api/admin/users/${data.userId}/status`,
        { status: data.status, reason: data.reason }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/users/detailed"],
      });
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
    mutationFn: async (data: {
      userId: string;
      extensionType: string;
      extensionValue: string;
      reason: string;
    }) => {
      const res = await apiRequest(
        "POST",
        `/api/admin/users/${data.userId}/time-extension`,
        {
          extensionType: data.extensionType,
          extensionValue: data.extensionValue,
          reason: data.reason,
        }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/users/detailed"],
      });
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge
            className="bg-green-500 dark:bg-green-600"
            data-testid="badge-status-active"
          >
            Active
          </Badge>
        );
      case "suspended":
        return (
          <Badge variant="destructive" data-testid="badge-status-suspended">
            Suspended
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary" data-testid="badge-status-pending">
            Pending
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" data-testid="badge-status-default">
            {status}
          </Badge>
        );
    }
  };

  const getPlanTypeBadge = (planType: string | null) => {
    if (!planType)
      return (
        <Badge variant="outline" data-testid="badge-plan-none">
          No Plan
        </Badge>
      );

    switch (planType) {
      case "free_trial":
        return (
          <Badge variant="secondary" data-testid="badge-plan-trial">
            Free Trial
          </Badge>
        );
      case "yearly":
        return (
          <Badge
            className="bg-blue-500 dark:bg-blue-600"
            data-testid="badge-plan-yearly"
          >
            Yearly
          </Badge>
        );
      case "three_year":
        return (
          <Badge
            className="bg-purple-500 dark:bg-purple-600"
            data-testid="badge-plan-three-year"
          >
            3-Year
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" data-testid="badge-plan-default">
            {planType}
          </Badge>
        );
    }
  };

  const handleViewUser = (userId: string) => {
    setLocation(`/admin/users/${userId}`);
  };

  const handleUpdateStatus = (user: any) => {
    setSelectedUser(user);
    setNewStatus(user.status);
    setIsStatusDialogOpen(true);
  };

  const handleGrantExtension = (user: any) => {
    setSelectedUser(user);
    setIsTimeExtensionDialogOpen(true);
  };

  const submitStatusUpdate = () => {
    if (!selectedUser) return;
    updateStatusMutation.mutate({
      userId: selectedUser.id,
      status: newStatus,
      reason: statusReason || undefined,
    });
  };

  const submitTimeExtension = () => {
    if (!selectedUser) return;
    grantExtensionMutation.mutate({
      userId: selectedUser.id,
      extensionType,
      extensionValue,
      reason: extensionReason,
    });
  };

  return (
    <div className="space-y-6" data-testid="user-management">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Manage users, grant time extensions, update statuses, and provide
            support
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Email, name, username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                  data-testid="input-search-users"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger
                  id="status-filter"
                  data-testid="select-status-filter"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role-filter">Role</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger
                  id="role-filter"
                  data-testid="select-role-filter"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="license_manager">
                    License Manager
                  </SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan-filter">Plan Type</Label>
              <Select value={planTypeFilter} onValueChange={setPlanTypeFilter}>
                <SelectTrigger
                  id="plan-filter"
                  data-testid="select-plan-filter"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="free_trial">Free Trial</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="three_year">3-Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Users Table */}
          {isLoading ? (
            <div
              className="flex justify-center items-center py-12"
              data-testid="loading-users"
            >
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : users.length === 0 ? (
            <div
              className="text-center py-12 text-muted-foreground"
              data-testid="no-users"
            >
              No users found
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">User</TableHead>
                    <TableHead className="w-[220px]">Email</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[120px]">Plan</TableHead>
                    <TableHead className="w-[100px]">AI Provider</TableHead>
                    <TableHead className="w-[120px]">Sessions</TableHead>
                    <TableHead className="w-[100px]">Minutes</TableHead>
                    <TableHead className="w-[120px]">Joined</TableHead>
                    <TableHead className="w-[80px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user: any) => (
                    <TableRow 
                      key={user.id} 
                      data-testid={`row-user-${user.id}`}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <TableCell className="font-medium">
                        <div className="flex flex-col gap-1">
                          <span
                            className="font-semibold text-sm"
                            data-testid={`text-user-name-${user.id}`}
                          >
                            {user.first_name} {user.last_name}
                          </span>
                          <span
                            className="text-xs text-muted-foreground"
                            data-testid={`text-username-${user.id}`}
                          >
                            @{user.username}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm" data-testid={`text-email-${user.id}`}>
                          {user.email}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>{getPlanTypeBadge(user.plan_type)}</TableCell>
                      <TableCell>
                        {user.ai_engine ? (
                          <Badge
                            variant="outline"
                            className="text-xs"
                            data-testid={`badge-ai-${user.id}`}
                          >
                            {user.ai_engine}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            Not set
                          </span>
                        )}
                      </TableCell>
                      <TableCell data-testid={`text-sessions-${user.id}`}>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-sm">
                            {user.total_sessions || 0}
                          </span>
                          {user.active_sessions > 0 ? (
                            <Badge 
                              variant="outline" 
                              className="text-xs bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 w-fit"
                            >
                              {user.active_sessions} active
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {user.total_sessions > 0 ? 'all ended' : 'no sessions'}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell data-testid={`text-minutes-${user.id}`}>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-sm">
                            {user.total_minutes_remaining || 0}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            remaining
                          </span>
                        </div>
                      </TableCell>
                      <TableCell data-testid={`text-joined-${user.id}`}>
                        <span className="text-sm">
                          {format(new Date(user.created_at), "MMM d, yyyy")}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              data-testid={`btn-actions-${user.id}`}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => handleViewUser(user.id)}
                              data-testid={`action-view-${user.id}`}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(user)}
                              data-testid={`action-status-${user.id}`}
                            >
                              {user.status === "active" ? (
                                <>
                                  <Ban className="mr-2 h-4 w-4" />
                                  Suspend User
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Activate User
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleGrantExtension(user)}
                              data-testid={`action-extend-${user.id}`}
                            >
                              <Clock className="mr-2 h-4 w-4" />
                              Grant Extension
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Update Status Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent data-testid="dialog-update-status">
          <DialogHeader>
            <DialogTitle>Update User Status</DialogTitle>
            <DialogDescription>
              Update the status for {selectedUser?.first_name}{" "}
              {selectedUser?.last_name}
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
            <Button
              variant="outline"
              onClick={() => setIsStatusDialogOpen(false)}
              data-testid="btn-cancel-status"
            >
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
      <Dialog
        open={isTimeExtensionDialogOpen}
        onOpenChange={setIsTimeExtensionDialogOpen}
      >
        <DialogContent data-testid="dialog-time-extension">
          <DialogHeader>
            <DialogTitle>Grant Time Extension</DialogTitle>
            <DialogDescription>
              Grant a time extension to {selectedUser?.first_name}{" "}
              {selectedUser?.last_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="extension-type">Extension Type</Label>
              <Select value={extensionType} onValueChange={setExtensionType}>
                <SelectTrigger
                  id="extension-type"
                  data-testid="select-extension-type"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial_extension">
                    Trial Extension (Days)
                  </SelectItem>
                  <SelectItem value="minutes_addition">
                    Minutes Addition
                  </SelectItem>
                  <SelectItem value="subscription_extension">
                    Subscription Extension (Days)
                  </SelectItem>
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
                placeholder={
                  extensionType === "minutes_addition" ? "e.g., 60" : "e.g., 7"
                }
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
            <Button
              variant="outline"
              onClick={() => setIsTimeExtensionDialogOpen(false)}
              data-testid="btn-cancel-extension"
            >
              Cancel
            </Button>
            <Button
              onClick={submitTimeExtension}
              disabled={
                grantExtensionMutation.isPending ||
                !extensionValue ||
                !extensionReason
              }
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
    </div>
  );
}
