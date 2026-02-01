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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

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
            className="bg-emerald-500 dark:bg-emerald-600 hover:bg-emerald-600 dark:hover:bg-emerald-700 text-white border-0 text-[10px] px-2 py-0 h-5 whitespace-nowrap"
            data-testid="badge-status-active"
          >
            Active
          </Badge>
        );
      case "suspended":
        return (
          <Badge 
            className="bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700 text-white border-0 text-[10px] px-2 py-0 h-5 whitespace-nowrap"
            data-testid="badge-status-suspended"
          >
            Suspended
          </Badge>
        );
      case "pending":
        return (
          <Badge 
            className="bg-amber-500 dark:bg-amber-600 hover:bg-amber-600 dark:hover:bg-amber-700 text-white border-0 text-[10px] px-2 py-0 h-5 whitespace-nowrap"
            data-testid="badge-status-pending"
          >
            Pending
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px] px-2 py-0 h-5 whitespace-nowrap" data-testid="badge-status-default">
            {status}
          </Badge>
        );
    }
  };

  const getPlanTypeBadge = (planType: string | null) => {
    if (!planType)
      return (
        <Badge 
          variant="outline" 
          className="text-[10px] bg-muted/30 px-2 py-0 h-5 whitespace-nowrap"
          data-testid="badge-plan-none"
        >
          No Plan
        </Badge>
      );

    switch (planType) {
      case "free_trial":
        return (
          <Badge 
            className="bg-sky-500 dark:bg-sky-600 hover:bg-sky-600 dark:hover:bg-sky-700 text-white border-0 text-[10px] px-2 py-0 h-5 whitespace-nowrap"
            data-testid="badge-plan-trial"
          >
            Free Trial
          </Badge>
        );
      case "monthly":
        return (
          <Badge
            className="bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 text-white border-0 text-[10px] px-2 py-0 h-5 whitespace-nowrap"
            data-testid="badge-plan-monthly"
          >
            Monthly
          </Badge>
        );
      case "yearly":
        return (
          <Badge
            className="bg-violet-500 dark:bg-violet-600 hover:bg-violet-600 dark:hover:bg-violet-700 text-white border-0 text-[10px] px-2 py-0 h-5 whitespace-nowrap"
            data-testid="badge-plan-yearly"
          >
            Yearly
          </Badge>
        );
      case "three_year":
        return (
          <Badge
            className="bg-purple-500 dark:bg-purple-600 hover:bg-purple-600 dark:hover:bg-purple-700 text-white border-0 text-[10px] px-2 py-0 h-5 whitespace-nowrap"
            data-testid="badge-plan-three-year"
          >
            3-Year
          </Badge>
        );
      default:
        return (
          <Badge 
            variant="outline" 
            className="text-[10px] px-2 py-0 h-5 whitespace-nowrap"
            data-testid="badge-plan-default"
          >
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

          {/* Users Count */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {users.length} {users.length === 1 ? 'user' : 'users'} found
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
            <div className="space-y-4">
              <div className="rounded-lg border bg-card shadow-sm">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-muted/50 backdrop-blur z-10">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="font-semibold">User</TableHead>
                        <TableHead className="font-semibold">Email</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Plan</TableHead>
                        <TableHead className="font-semibold">AI Provider</TableHead>
                        <TableHead className="font-semibold text-center">Sessions</TableHead>
                        <TableHead className="font-semibold text-center">Minutes</TableHead>
                        <TableHead className="font-semibold">Joined</TableHead>
                        <TableHead className="font-semibold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((user: any) => (
                        <TableRow 
                          key={user.id} 
                          data-testid={`row-user-${user.id}`}
                          className="hover:bg-muted/30 transition-all duration-150 border-b last:border-0"
                        >
                          <TableCell className="font-medium py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border-2 border-primary/20">
                                <span className="text-sm font-bold text-primary">
                                  {user.first_name?.[0]?.toUpperCase() || 'U'}{user.last_name?.[0]?.toUpperCase() || ''}
                                </span>
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <span
                                  className="font-semibold text-sm leading-tight"
                                  data-testid={`text-user-name-${user.id}`}
                                >
                                  {user.first_name} {user.last_name}
                                </span>
                                <span
                                  className="text-xs text-muted-foreground leading-tight"
                                  data-testid={`text-username-${user.id}`}
                                >
                                  @{user.username}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <span className="text-sm font-mono text-muted-foreground" data-testid={`text-email-${user.id}`}>
                              {user.email}
                            </span>
                          </TableCell>
                          <TableCell className="py-4">{getStatusBadge(user.status)}</TableCell>
                          <TableCell className="py-4">{getPlanTypeBadge(user.plan_type)}</TableCell>
                          <TableCell className="py-4">
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
                          <TableCell data-testid={`text-sessions-${user.id}`} className="py-4 text-center">
                            <span className="font-bold text-base tabular-nums">
                              {user.total_sessions || 0}
                            </span>
                          </TableCell>
                          <TableCell data-testid={`text-minutes-${user.id}`} className="py-4 text-center">
                            <span className="font-bold text-base tabular-nums">
                              {user.total_minutes_remaining || 0}
                            </span>
                          </TableCell>
                          <TableCell data-testid={`text-joined-${user.id}`} className="py-4">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {format(new Date(user.created_at), "MMM d, yyyy")}
                            </span>
                          </TableCell>
                          <TableCell className="text-right py-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-primary/10"
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
              </div>

              {/* Pagination */}
              {users.length > itemsPerPage && (
                <div className="flex items-center justify-between px-2">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, users.length)} of {users.length} users
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.ceil(users.length / itemsPerPage) }, (_, i) => i + 1)
                        .filter(page => {
                          const totalPages = Math.ceil(users.length / itemsPerPage);
                          return page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1);
                        })
                        .map((page, idx, arr) => (
                          <div key={page} className="flex items-center gap-1">
                            {idx > 0 && arr[idx - 1] !== page - 1 && (
                              <span className="px-2 text-muted-foreground">...</span>
                            )}
                            <Button
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              className="w-8 h-8 p-0"
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </Button>
                          </div>
                        ))
                      }
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(Math.ceil(users.length / itemsPerPage), p + 1))}
                      disabled={currentPage >= Math.ceil(users.length / itemsPerPage)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
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
