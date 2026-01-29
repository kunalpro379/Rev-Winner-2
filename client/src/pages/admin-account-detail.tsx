import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Building2, 
  Users, 
  Package,
  Calendar,
  Mail,
  UserCircle,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
  Plus,
  UserPlus,
  UserMinus,
  AlertTriangle,
  CreditCard,
  Layers
} from "lucide-react";
import { format } from "date-fns";
import type { 
  AdminOrganizationDetailDTO,
  OrganizationUserDTO,
  EnhancedAddonDTO
} from "@shared/schema";

interface OrganizationDetailResponse {
  success: boolean;
  organization: AdminOrganizationDetailDTO;
}

export default function AdminAccountDetail() {
  const [, params] = useRoute("/admin/accounts/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const orgId = params?.id;
  
  const [activeTab, setActiveTab] = useState("overview");
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false);
  const [isAddSeatsDialogOpen, setIsAddSeatsDialogOpen] = useState(false);
  const [isAssignLicenseDialogOpen, setIsAssignLicenseDialogOpen] = useState(false);
  const [isRevokeLicenseDialogOpen, setIsRevokeLicenseDialogOpen] = useState(false);
  const [isChangeManagerDialogOpen, setIsChangeManagerDialogOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [seatsToAdd, setSeatsToAdd] = useState(1);
  const [seatReason, setSeatReason] = useState("");
  const [assignEmail, setAssignEmail] = useState("");
  const [assignNotes, setAssignNotes] = useState("");
  const [revokeUserId, setRevokeUserId] = useState("");
  const [revokeReason, setRevokeReason] = useState("");
  const [newManagerEmail, setNewManagerEmail] = useState("");
  const [changeManagerReason, setChangeManagerReason] = useState("");
  
  const { data, isLoading, error } = useQuery<OrganizationDetailResponse>({
    queryKey: ["/api/admin/organizations", orgId],
    enabled: !!orgId,
  });
  
  const suspendMutation = useMutation({
    mutationFn: async (updateData: { status: string; reason: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/organizations/${orgId}`, updateData);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update organization status");
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations", orgId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      toast({
        title: "Success",
        description: data.message || "Organization status updated successfully",
      });
      setIsSuspendDialogOpen(false);
      setSuspendReason("");
    },
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: err.message || "Failed to update organization status",
        variant: "destructive",
      });
    },
  });

  const addSeatsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/admin/organizations/${orgId}/seats`, {
        seats: seatsToAdd,
        reason: seatReason || undefined,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to add seats");
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations", orgId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      toast({
        title: "Success",
        description: data.message || "Seats added successfully",
      });
      setIsAddSeatsDialogOpen(false);
      setSeatsToAdd(1);
      setSeatReason("");
    },
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: err.message || "Failed to add seats",
        variant: "destructive",
      });
    },
  });

  const assignLicenseMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/admin/organizations/${orgId}/assign-license`, {
        userEmail: assignEmail,
        notes: assignNotes || undefined,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to assign license");
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations", orgId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      toast({
        title: "Success",
        description: data.message || "License assigned successfully",
      });
      setIsAssignLicenseDialogOpen(false);
      setAssignEmail("");
      setAssignNotes("");
    },
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: err.message || "Failed to assign license",
        variant: "destructive",
      });
    },
  });

  const revokeLicenseMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/admin/organizations/${orgId}/revoke-license`, {
        userId: revokeUserId,
        reason: revokeReason || undefined,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to revoke license");
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations", orgId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      toast({
        title: "Success",
        description: data.message || "License revoked successfully",
      });
      setIsRevokeLicenseDialogOpen(false);
      setRevokeUserId("");
      setRevokeReason("");
    },
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: err.message || "Failed to revoke license",
        variant: "destructive",
      });
    },
  });

  const changeManagerMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/admin/organizations/${orgId}/change-manager`, {
        newManagerEmail,
        reason: changeManagerReason || undefined,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to change License Manager");
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations", orgId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      toast({
        title: "Success",
        description: data.message || "License Manager changed successfully",
      });
      setIsChangeManagerDialogOpen(false);
      setNewManagerEmail("");
      setChangeManagerReason("");
    },
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: err.message || "Failed to change License Manager",
        variant: "destructive",
      });
    },
  });

  const handleRevokeLicense = (userId: string) => {
    setRevokeUserId(userId);
    setIsRevokeLicenseDialogOpen(true);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen" data-testid="loading-org-detail">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }
  
  if (error || !data?.organization) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12" data-testid="org-not-found">
            <AlertTriangle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Organization Not Found</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              The organization you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button onClick={() => setLocation("/admin")} data-testid="btn-back-to-admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  const orgData = data.organization;
  const org = orgData.organization;
  const licenseManager = orgData.licenseManager;
  const licensePackage = orgData.licensePackage;
  const users = orgData.users || [];
  const addons = orgData.addons || [];
  const billingHistory = orgData.billingHistory || [];
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500 dark:bg-green-600" data-testid="badge-status-active">Active</Badge>;
      case "suspended":
        return <Badge variant="destructive" data-testid="badge-status-suspended">Suspended</Badge>;
      case "deleted":
        return <Badge variant="secondary" data-testid="badge-status-deleted">Deleted</Badge>;
      default:
        return <Badge variant="outline" data-testid="badge-status-default">{status}</Badge>;
    }
  };
  
  const getLicenseStatusBadge = (status: string) => {
    switch (status) {
      case "assigned":
        return <Badge className="bg-green-500 dark:bg-green-600" data-testid="badge-license-assigned">Assigned</Badge>;
      case "revoked":
        return <Badge variant="destructive" data-testid="badge-license-revoked">Revoked</Badge>;
      default:
        return <Badge variant="outline" data-testid="badge-license-none">None</Badge>;
    }
  };
  
  const getAddonStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500 dark:bg-green-600" data-testid="badge-addon-active">Active</Badge>;
      case "expired":
        return <Badge variant="destructive" data-testid="badge-addon-expired">Expired</Badge>;
      default:
        return <Badge variant="outline" data-testid="badge-addon-default">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/admin")}
            data-testid="btn-back-to-admin"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Button>
        </div>
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3" data-testid="org-name">
              <Building2 className="h-7 w-7 text-purple-600" />
              {org.companyName}
            </h1>
            <div className="flex items-center gap-3 mt-2 text-slate-600 dark:text-slate-400">
              <Mail className="h-4 w-4" />
              <span data-testid="org-email">{org.billingEmail}</span>
              <span className="mx-2">•</span>
              {getStatusBadge(org.status)}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline"
              onClick={() => setIsAddSeatsDialogOpen(true)}
              data-testid="btn-add-seats"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Seats
            </Button>
            {org.status === "active" ? (
              <Button 
                variant="destructive" 
                onClick={() => setIsSuspendDialogOpen(true)}
                data-testid="btn-suspend-org"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Suspend Organization
              </Button>
            ) : org.status === "suspended" ? (
              <Button 
                variant="default"
                onClick={() => suspendMutation.mutate({ status: "active", reason: "Reactivated by admin" })}
                disabled={suspendMutation.isPending}
                data-testid="btn-activate-org"
              >
                {suspendMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Activate Organization
              </Button>
            ) : null}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card data-testid="card-seats-summary">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Seats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                <span className="text-2xl font-bold" data-testid="text-assigned-seats">
                  {orgData.assignedSeats}
                </span>
                <span className="text-slate-400">/</span>
                <span className="text-xl" data-testid="text-total-seats">
                  {orgData.totalSeats}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                {orgData.availableSeats} available
              </p>
            </CardContent>
          </Card>
          
          <Card data-testid="card-package-summary">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Package
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-purple-600" />
                <span className="text-lg font-semibold" data-testid="text-package-type">
                  {licensePackage?.packageType || "No Package"}
                </span>
              </div>
              {licensePackage?.endDate && (
                <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Expires: {format(new Date(licensePackage.endDate), "MMM d, yyyy")}
                </p>
              )}
            </CardContent>
          </Card>
          
          <Card data-testid="card-renewal-summary">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Auto-Renewal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-purple-600" />
                <span className="text-lg font-semibold" data-testid="text-auto-renew">
                  {licensePackage?.autoRenew ? "Enabled" : "Disabled"}
                </span>
              </div>
              {licensePackage?.renewalDate && (
                <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Next: {format(new Date(licensePackage.renewalDate), "MMM d, yyyy")}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-white dark:bg-slate-800 border">
            <TabsTrigger value="overview" data-testid="tab-trigger-overview">Overview</TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-trigger-users">Users ({users.length})</TabsTrigger>
            <TabsTrigger value="addons" data-testid="tab-trigger-addons">Add-ons ({addons.length})</TabsTrigger>
            <TabsTrigger value="billing" data-testid="tab-trigger-billing">Billing</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6" data-testid="tab-content-overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card data-testid="card-org-details">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Organization Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Company Name</p>
                      <p className="font-medium" data-testid="detail-company-name">{org.companyName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Billing Email</p>
                      <p className="font-medium" data-testid="detail-billing-email">{org.billingEmail}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Status</p>
                      <div data-testid="detail-status">{getStatusBadge(org.status)}</div>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Created</p>
                      <p className="font-medium" data-testid="detail-created">
                        {org.createdAt ? format(new Date(org.createdAt), "MMM d, yyyy") : "-"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card data-testid="card-license-manager">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCircle className="h-5 w-5" />
                    License Manager
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {licenseManager ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Name</p>
                          <p className="font-medium" data-testid="lm-name">
                            {licenseManager.firstName} {licenseManager.lastName}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Email</p>
                          <p className="font-medium" data-testid="lm-email">{licenseManager.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Mobile</p>
                          <p className="font-medium" data-testid="lm-mobile">
                            {licenseManager.mobile || "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Status</p>
                          <div data-testid="lm-status">{getStatusBadge(licenseManager.status)}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setLocation(`/admin/users/${licenseManager.id}`)}
                          data-testid="btn-view-lm"
                        >
                          View Full Profile
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setIsChangeManagerDialogOpen(true)}
                          data-testid="btn-change-manager"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Change Manager
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-500">
                      <UserCircle className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p data-testid="text-no-lm">No license manager assigned</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <Card data-testid="card-license-package">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  License Package
                </CardTitle>
              </CardHeader>
              <CardContent>
                {licensePackage ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Package Type</p>
                      <p className="font-medium" data-testid="pkg-type">{licensePackage.packageType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Seats</p>
                      <p className="font-medium" data-testid="pkg-seats">
                        {licensePackage.assignedSeats} / {licensePackage.totalSeats}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Start Date</p>
                      <p className="font-medium" data-testid="pkg-start">
                        {licensePackage.startDate 
                          ? format(new Date(licensePackage.startDate), "MMM d, yyyy") 
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">End Date</p>
                      <p className="font-medium" data-testid="pkg-end">
                        {licensePackage.endDate 
                          ? format(new Date(licensePackage.endDate), "MMM d, yyyy") 
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Status</p>
                      <div data-testid="pkg-status">{getStatusBadge(licensePackage.status)}</div>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Price Per Seat</p>
                      <p className="font-medium" data-testid="pkg-price">
                        {licensePackage.pricePerSeat 
                          ? `${licensePackage.currency} ${licensePackage.pricePerSeat}` 
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Auto-Renew</p>
                      <Badge 
                        variant={licensePackage.autoRenew ? "default" : "secondary"}
                        data-testid="pkg-auto-renew"
                      >
                        {licensePackage.autoRenew ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Next Renewal</p>
                      <p className="font-medium" data-testid="pkg-renewal">
                        {licensePackage.renewalDate 
                          ? format(new Date(licensePackage.renewalDate), "MMM d, yyyy") 
                          : "-"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-500">
                    <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p data-testid="text-no-package">No license package associated</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="users" className="space-y-4" data-testid="tab-content-users">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Organization Users
                  </CardTitle>
                  <CardDescription>
                    Manage users and license assignments for this organization
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setIsAssignLicenseDialogOpen(true)}
                  data-testid="btn-assign-license"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign License
                </Button>
              </CardHeader>
              <CardContent>
                {users.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p data-testid="text-no-users">No users in this organization</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>License Status</TableHead>
                          <TableHead>Train Me</TableHead>
                          <TableHead>DAI</TableHead>
                          <TableHead>Assigned</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user: OrganizationUserDTO) => (
                          <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                            <TableCell>
                              <div>
                                <p className="font-medium" data-testid={`user-name-${user.id}`}>
                                  {user.firstName} {user.lastName}
                                </p>
                                <p className="text-sm text-slate-500" data-testid={`user-email-${user.id}`}>
                                  {user.email}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" data-testid={`user-role-${user.id}`}>{user.role}</Badge>
                            </TableCell>
                            <TableCell data-testid={`user-license-status-${user.id}`}>
                              {getLicenseStatusBadge(user.licenseStatus)}
                            </TableCell>
                            <TableCell data-testid={`user-trainme-${user.id}`}>
                              {user.trainMeEnabled ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-slate-300" />
                              )}
                            </TableCell>
                            <TableCell data-testid={`user-dai-${user.id}`}>
                              {user.daiEnabled ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-slate-300" />
                              )}
                            </TableCell>
                            <TableCell data-testid={`user-assigned-${user.id}`}>
                              {user.assignedAt 
                                ? format(new Date(user.assignedAt), "MMM d, yyyy")
                                : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setLocation(`/admin/users/${user.id}`)}
                                  data-testid={`btn-view-user-${user.id}`}
                                >
                                  View
                                </Button>
                                {user.licenseStatus === "assigned" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRevokeLicense(user.id)}
                                    className="text-red-600 hover:text-red-700"
                                    data-testid={`btn-revoke-${user.id}`}
                                  >
                                    <UserMinus className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="addons" className="space-y-4" data-testid="tab-content-addons">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Add-ons
                </CardTitle>
                <CardDescription>
                  Active add-ons and usage for this organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                {addons.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <Layers className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p data-testid="text-no-addons">No add-ons purchased</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Add-on</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Usage</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Start Date</TableHead>
                          <TableHead>Renewal Date</TableHead>
                          <TableHead>Auto-Renew</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {addons.map((addon: EnhancedAddonDTO) => (
                          <TableRow key={addon.id} data-testid={`row-addon-${addon.id}`}>
                            <TableCell>
                              <p className="font-medium" data-testid={`addon-name-${addon.id}`}>
                                {addon.displayName}
                              </p>
                              <p className="text-sm text-slate-500">{addon.slug}</p>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" data-testid={`addon-type-${addon.id}`}>{addon.type}</Badge>
                            </TableCell>
                            <TableCell data-testid={`addon-usage-${addon.id}`}>
                              <div className="flex items-center gap-1">
                                <span className="font-medium">{addon.usedUnits}</span>
                                <span className="text-slate-400">/</span>
                                <span>{addon.totalUnits}</span>
                              </div>
                            </TableCell>
                            <TableCell data-testid={`addon-status-${addon.id}`}>
                              {getAddonStatusBadge(addon.status)}
                            </TableCell>
                            <TableCell data-testid={`addon-start-${addon.id}`}>
                              {addon.startDate 
                                ? format(new Date(addon.startDate), "MMM d, yyyy")
                                : "-"}
                            </TableCell>
                            <TableCell data-testid={`addon-renewal-${addon.id}`}>
                              {addon.renewalDate 
                                ? format(new Date(addon.renewalDate), "MMM d, yyyy")
                                : "-"}
                            </TableCell>
                            <TableCell data-testid={`addon-autorenew-${addon.id}`}>
                              <Badge variant={addon.autoRenew ? "default" : "secondary"}>
                                {addon.autoRenew ? "Yes" : "No"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="billing" className="space-y-4" data-testid="tab-content-billing">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Billing History
                </CardTitle>
                <CardDescription>
                  Recent transactions and payments for this organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                {billingHistory.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <CreditCard className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p data-testid="text-no-billing">No billing history available</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {billingHistory.map((item) => (
                          <TableRow key={item.id} data-testid={`row-billing-${item.id}`}>
                            <TableCell data-testid={`billing-desc-${item.id}`}>{item.description}</TableCell>
                            <TableCell data-testid={`billing-amount-${item.id}`}>
                              {item.currency} {item.amount}
                            </TableCell>
                            <TableCell data-testid={`billing-status-${item.id}`}>
                              <Badge 
                                variant={item.status === "succeeded" ? "default" : "secondary"}
                              >
                                {item.status}
                              </Badge>
                            </TableCell>
                            <TableCell data-testid={`billing-date-${item.id}`}>
                              {item.createdAt 
                                ? format(new Date(item.createdAt), "MMM d, yyyy")
                                : "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <Dialog open={isSuspendDialogOpen} onOpenChange={setIsSuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Organization</DialogTitle>
            <DialogDescription>
              This will suspend the organization and all its users will lose access.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="suspend-reason">Reason for suspension</Label>
              <Textarea
                id="suspend-reason"
                placeholder="Enter the reason for suspending this organization..."
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                data-testid="input-suspend-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsSuspendDialogOpen(false)}
              data-testid="btn-cancel-suspend"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => suspendMutation.mutate({ status: "suspended", reason: suspendReason })}
              disabled={!suspendReason || suspendMutation.isPending}
              data-testid="btn-confirm-suspend"
            >
              {suspendMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Suspend Organization
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddSeatsDialogOpen} onOpenChange={setIsAddSeatsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Seats</DialogTitle>
            <DialogDescription>
              Add additional seats to this organization's license package.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="seats-count">Number of Seats</Label>
              <Input
                id="seats-count"
                type="number"
                min={1}
                value={seatsToAdd}
                onChange={(e) => setSeatsToAdd(parseInt(e.target.value) || 1)}
                data-testid="input-seats-count"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seat-reason">Reason (optional)</Label>
              <Textarea
                id="seat-reason"
                placeholder="Enter the reason for adding seats..."
                value={seatReason}
                onChange={(e) => setSeatReason(e.target.value)}
                data-testid="input-seat-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsAddSeatsDialogOpen(false)}
              data-testid="btn-cancel-add-seats"
            >
              Cancel
            </Button>
            <Button
              onClick={() => addSeatsMutation.mutate()}
              disabled={seatsToAdd < 1 || addSeatsMutation.isPending}
              data-testid="btn-confirm-add-seats"
            >
              {addSeatsMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Plus className="h-4 w-4 mr-2" />
              Add {seatsToAdd} Seat{seatsToAdd > 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAssignLicenseDialogOpen} onOpenChange={setIsAssignLicenseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign License</DialogTitle>
            <DialogDescription>
              Assign a license to a user in this organization. The user must have an existing account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="assign-email">User Email</Label>
              <Input
                id="assign-email"
                type="email"
                placeholder="user@example.com"
                value={assignEmail}
                onChange={(e) => setAssignEmail(e.target.value)}
                data-testid="input-assign-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assign-notes">Notes (optional)</Label>
              <Textarea
                id="assign-notes"
                placeholder="Enter any notes about this assignment..."
                value={assignNotes}
                onChange={(e) => setAssignNotes(e.target.value)}
                data-testid="input-assign-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsAssignLicenseDialogOpen(false)}
              data-testid="btn-cancel-assign-license"
            >
              Cancel
            </Button>
            <Button
              onClick={() => assignLicenseMutation.mutate()}
              disabled={!assignEmail || assignLicenseMutation.isPending}
              data-testid="btn-confirm-assign-license"
            >
              {assignLicenseMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <UserPlus className="h-4 w-4 mr-2" />
              Assign License
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRevokeLicenseDialogOpen} onOpenChange={setIsRevokeLicenseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke License</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke this user's license? This action will remove their access.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="revoke-reason">Reason (optional)</Label>
              <Textarea
                id="revoke-reason"
                placeholder="Enter the reason for revoking this license..."
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                data-testid="input-revoke-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsRevokeLicenseDialogOpen(false);
                setRevokeUserId("");
                setRevokeReason("");
              }}
              data-testid="btn-cancel-revoke-license"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => revokeLicenseMutation.mutate()}
              disabled={revokeLicenseMutation.isPending}
              data-testid="btn-confirm-revoke-license"
            >
              {revokeLicenseMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <UserMinus className="h-4 w-4 mr-2" />
              Revoke License
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isChangeManagerDialogOpen} onOpenChange={setIsChangeManagerDialogOpen}>
        <DialogContent data-testid="dialog-change-manager">
          <DialogHeader>
            <DialogTitle>Change License Manager</DialogTitle>
            <DialogDescription>
              Transfer the License Manager role to a different user. The new manager will have full control over license assignments.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-manager-email">New Manager Email *</Label>
              <Input
                id="new-manager-email"
                type="email"
                placeholder="Enter the new License Manager's email..."
                value={newManagerEmail}
                onChange={(e) => setNewManagerEmail(e.target.value)}
                data-testid="input-new-manager-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="change-manager-reason">Reason (optional)</Label>
              <Textarea
                id="change-manager-reason"
                placeholder="Enter the reason for changing the License Manager..."
                value={changeManagerReason}
                onChange={(e) => setChangeManagerReason(e.target.value)}
                data-testid="input-change-manager-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsChangeManagerDialogOpen(false);
                setNewManagerEmail("");
                setChangeManagerReason("");
              }}
              data-testid="btn-cancel-change-manager"
            >
              Cancel
            </Button>
            <Button
              onClick={() => changeManagerMutation.mutate()}
              disabled={!newManagerEmail || changeManagerMutation.isPending}
              data-testid="btn-confirm-change-manager"
            >
              {changeManagerMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <RefreshCw className="h-4 w-4 mr-2" />
              Change Manager
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
