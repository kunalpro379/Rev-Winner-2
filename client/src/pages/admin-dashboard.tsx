import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Settings,
  LogOut,
  Shield,
  Mail,
  Calendar,
  CheckCircle,
  Loader2,
  UserPlus,
  Pencil,
  Trash2,
  Search,
  CreditCard,
  BarChart3,
  Clock,
  Tag,
  Zap,
  DollarSign,
  Layers,
  Globe,
  Cpu,
  FileText,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { clearAllSessionData } from "@/lib/session";
import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard";
import { AnalyticsDashboardEnhanced } from "@/components/admin/analytics-dashboard-enhanced";
import { SubscriptionManagement } from "@/components/admin/subscription-management";
import { PlansAddonsManagement } from "@/components/admin/plans-addons-management";
import { PromoCodeManagement } from "@/components/admin/promo-code-management";
import UserManagement from "@/components/admin/user-management";
import { AdminBillingPortal } from "@/components/admin-billing-portal";
import { TrafficAnalytics } from "@/components/admin/traffic-analytics";
import { AccountsManagement } from "@/components/admin/accounts-management";
import { AITokenUsage } from "@/components/admin/ai-token-usage";
import { SalesIntelligence } from "@/components/admin/SalesIntelligence";
import { ApiKeysManagement } from "@/components/admin/api-keys-management";
import { TermsManagement } from "@/components/admin/terms-management";
import {
  MobileNavSheet,
  type NavItem,
} from "@/components/admin/mobile-nav-sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { Brain, Key } from "lucide-react";
import logoPath from "@assets/rev-winner-logo.png";
import { useSEO } from "@/hooks/use-seo";
import { Building2 } from "lucide-react";

const adminNavItems: NavItem[] = [
  {
    value: "analytics",
    label: "Analytics",
    icon: <BarChart3 className="h-4 w-4" />,
    testId: "analytics",
  },
  {
    value: "subscriptions",
    label: "Subscriptions",
    icon: <Zap className="h-4 w-4" />,
    testId: "subscriptions",
  },
  {
    value: "accounts",
    label: "Accounts",
    icon: <Building2 className="h-4 w-4" />,
    testId: "accounts",
  },
  {
    value: "plans-addons",
    label: "Plans & Add-ons",
    icon: <Layers className="h-4 w-4" />,
    testId: "plans-addons",
  },
  {
    value: "promo-codes",
    label: "Promo Codes",
    icon: <Tag className="h-4 w-4" />,
    testId: "promo-codes",
  },
  {
    value: "users",
    label: "Users",
    icon: <Users className="h-4 w-4" />,
    testId: "users",
  },
  {
    value: "billing",
    label: "Billing",
    icon: <DollarSign className="h-4 w-4" />,
    testId: "billing",
  },
  {
    value: "api-keys",
    label: "API Keys",
    icon: <Key className="h-4 w-4" />,
    testId: "api-keys",
  },
  {
    value: "ai-tokens",
    label: "AI Tokens",
    icon: <Cpu className="h-4 w-4" />,
    testId: "ai-tokens",
  },
  {
    value: "sales-intelligence",
    label: "Sales Intel",
    icon: <Brain className="h-4 w-4" />,
    testId: "sales-intelligence",
  },
  {
    value: "configuration",
    label: "Config",
    icon: <Settings className="h-4 w-4" />,
    testId: "configuration",
  },
  {
    value: "traffic",
    label: "Traffic",
    icon: <Globe className="h-4 w-4" />,
    testId: "traffic",
  },
  {
    value: "terms",
    label: "Terms & Conditions",
    icon: <FileText className="h-4 w-4" />,
    testId: "terms",
  },
];

const createAdminSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[@$!%*?&#]/,
      "Password must contain at least one special character",
    ),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

const editUserSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  mobile: z.string().optional(),
  organization: z.string().optional(),
  role: z.enum(["user", "license_manager", "admin", "super_admin"]),
  status: z.enum(["active", "suspended", "deleted"]),
});

interface SessionHistoryItem {
  sessionId: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  mobile?: string;
  organization?: string;
  role: string;
  status: string;
  emailVerified: boolean;
  createdAt: string;
  subscription: {
    status: string;
    plan: string;
    currentPeriodEnd: string;
    sessionsUsed?: string;
    sessionsLimit?: string;
    minutesUsed?: string;
    minutesLimit?: string;
    sessionHistory?: SessionHistoryItem[];
  } | null;
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const {
    isAuthenticated,
    isAdmin,
    isLoading: authLoading,
    user: currentUser,
  } = useAdminAuth();
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("analytics");

  useSEO({
    title: "Admin Dashboard - Rev Winner | User & System Management",
    description:
      "Rev Winner admin dashboard. Manage users, subscriptions, system settings, and payment configurations. Administrative access only.",
  });

  console.log("AdminDashboard render:", {
    isAuthenticated,
    isAdmin,
    authLoading,
    hasCurrentUser: !!currentUser,
  });

  const createAdminForm = useForm<z.infer<typeof createAdminSchema>>({
    resolver: zodResolver(createAdminSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    },
  });

  const editUserForm = useForm<z.infer<typeof editUserSchema>>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      mobile: "",
      organization: "",
      role: "user",
      status: "active",
    },
  });

  const createAdminMutation = useMutation({
    mutationFn: async (values: z.infer<typeof createAdminSchema>) => {
      const response = await apiRequest(
        "POST",
        "/api/admin/create-admin",
        values,
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create admin");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Admin Created",
        description: `Admin user ${data.admin.email} has been created successfully.`,
      });
      createAdminForm.reset();
      setShowCreateAdmin(false);
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

  const editUserMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: z.infer<typeof editUserSchema>;
    }) => {
      const response = await apiRequest(
        "PATCH",
        `/api/admin/users/${id}`,
        data,
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update user");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "User Updated",
        description: "User information has been updated successfully.",
      });
      setEditingUser(null);
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

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/users/${userId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete user");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "User Deleted",
        description: "User has been deleted successfully.",
      });
      setDeletingUserId(null);
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

  // Fetch users - only if authenticated and is admin
  const {
    data: usersData,
    isLoading: usersLoading,
    error: usersError,
  } = useQuery<{ users: AdminUser[] }>({
    queryKey: ["/api/admin/users"],
    enabled: isAuthenticated && isAdmin,
    retry: false,
  });

  // Handle authorization errors
  if (usersError) {
    const errorResponse = usersError as any;
    if (
      errorResponse?.message?.includes("403") ||
      errorResponse?.message?.includes("Admin")
    ) {
      // Use shared cleanup helper
      clearAllSessionData({ clearCache: () => queryClient.clear() });

      toast({
        title: "Access Denied",
        description: "Admin credentials required.",
        variant: "destructive",
      });

      setLocation("/admin/login");
      return null;
    }
  }

  const handleLogout = async () => {
    try {
      // Attempt to call backend to invalidate session (best effort)
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      toast({
        title: "Logged Out",
        description: "You have been logged out successfully.",
      });
    } catch (error) {
      console.error("Logout error (backend unreachable):", error);
      // Still show success message since local cleanup will happen
      toast({
        title: "Logged Out",
        description: "You have been logged out successfully.",
      });
    } finally {
      // GUARANTEED: Clear session data regardless of backend success/failure
      clearAllSessionData({ clearCache: () => queryClient.clear() });
      setLocation("/admin/login");
    }
  };

  const handleEditUser = (user: AdminUser) => {
    setEditingUser(user);
    editUserForm.reset({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      mobile: user.mobile || "",
      organization: user.organization || "",
      role: user.role as "user" | "admin",
      status: user.status as "active" | "suspended" | "deleted",
    });
  };

  const handleDeleteUser = (userId: string) => {
    setDeletingUserId(userId);
  };

  // Filter users based on search query
  const filteredUsers =
    usersData?.users.filter((user) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        user.firstName.toLowerCase().includes(query) ||
        user.lastName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.username.toLowerCase().includes(query) ||
        (user.organization && user.organization.toLowerCase().includes(query))
      );
    }) || [];

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">
            Verifying credentials...
          </p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated or not admin (useAdminAuth will redirect)
  if (!isAuthenticated || !isAdmin || !currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={logoPath}
                alt="Rev Winner Logo"
                className="h-12 w-auto object-contain"
                data-testid="img-logo"
              />
              <div className="p-2 bg-gradient-to-br from-purple-600 to-blue-900 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-900 bg-clip-text text-transparent">
                  Admin Portal
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Rev Winner Administrationn
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {currentUser.firstName} {currentUser.lastName}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {currentUser.email}
                </p>
              </div>
              <Button
                data-testid="button-logout"
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          {/* Navigation Menu Button */}
          <div>
            <MobileNavSheet
              items={adminNavItems}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              title="Admin Portal"
            />
          </div>

          {/* Analytics Dashboard Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <AnalyticsDashboardEnhanced />
          </TabsContent>

          {/* Subscription Management Tab */}
          <TabsContent value="subscriptions" className="space-y-4">
            <SubscriptionManagement />
          </TabsContent>

          {/* Accounts Management Tab */}
          <TabsContent value="accounts" className="space-y-4">
            <AccountsManagement />
          </TabsContent>

          {/* Plans & Add-ons Management Tab */}
          <TabsContent value="plans-addons" className="space-y-4">
            <PlansAddonsManagement />
          </TabsContent>

          {/* Promo Code Management Tab */}
          <TabsContent value="promo-codes" className="space-y-4">
            <PromoCodeManagement />
          </TabsContent>

          {/* Users Management Tab */}
          <TabsContent value="users" className="space-y-4">
            <UserManagement />
          </TabsContent>

          {/* Edit Configuration Tab */}
          <TabsContent value="configuration" className="space-y-4">
            {/* Create Admin User Card */}
            <Card data-testid="card-create-admin">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Create Admin User
                </CardTitle>
                <CardDescription>
                  Add new administrators to the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!showCreateAdmin ? (
                  <Button
                    data-testid="button-show-create-admin"
                    onClick={() => setShowCreateAdmin(true)}
                    className="gap-2 bg-gradient-to-r from-purple-600 to-blue-900 hover:from-purple-700 hover:to-blue-950"
                  >
                    <UserPlus className="h-4 w-4" />
                    Create New Admin
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <Form {...createAdminForm}>
                      <form
                        onSubmit={createAdminForm.handleSubmit((values) =>
                          createAdminMutation.mutate(values),
                        )}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={createAdminForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                  <Input
                                    data-testid="input-admin-first-name"
                                    placeholder="John"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={createAdminForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                  <Input
                                    data-testid="input-admin-last-name"
                                    placeholder="Doe"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={createAdminForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input
                                  data-testid="input-admin-email"
                                  type="email"
                                  placeholder="admin@company.com"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Email will be auto-verified for admin accounts
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={createAdminForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input
                                  data-testid="input-admin-password"
                                  type="password"
                                  placeholder="••••••••"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Must be at least 8 characters with uppercase,
                                lowercase, number, and special character
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex gap-3 pt-2">
                          <Button
                            data-testid="button-create-admin-submit"
                            type="submit"
                            disabled={createAdminMutation.isPending}
                            className="bg-gradient-to-r from-purple-600 to-blue-900 hover:from-purple-700 hover:to-blue-950"
                          >
                            {createAdminMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              <>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Create Admin
                              </>
                            )}
                          </Button>
                          <Button
                            data-testid="button-create-admin-cancel"
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setShowCreateAdmin(false);
                              createAdminForm.reset();
                            }}
                            disabled={createAdminMutation.isPending}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* System Configuration Card */}
            <Card data-testid="card-configuration">
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
                <CardDescription>
                  Manage application settings and configurations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Placeholder for configuration settings */}
                  <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center">
                    <Settings className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      Configuration Settings
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                      System configuration panel coming soon
                    </p>
                    <p className="text-xs text-slate-500">
                      This section will allow you to configure:
                      <br />
                      • Email templates and settings
                      <br />
                      • Payment gateway configuration
                      <br />
                      • Subscription plans and pricing
                      <br />
                      • AI model settings
                      <br />• System-wide preferences
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Portal Tab */}
          <TabsContent value="billing" className="space-y-4">
            <AdminBillingPortal />
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="api-keys" className="space-y-4">
            <ApiKeysManagement />
          </TabsContent>

          {/* AI Token Usage Tab */}
          <TabsContent value="ai-tokens" className="space-y-4">
            <AITokenUsage />
          </TabsContent>

          {/* Sales Intelligence Tab */}
          <TabsContent value="sales-intelligence" className="space-y-4">
            <SalesIntelligence />
          </TabsContent>

          {/* Traffic Analytics Tab */}
          <TabsContent value="traffic" className="space-y-4">
            <TrafficAnalytics />
          </TabsContent>

          {/* Terms & Conditions Management Tab */}
          <TabsContent value="terms" className="space-y-4">
            <TermsManagement />
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit User Dialog */}
      <Dialog
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
      >
        <DialogContent className="max-w-2xl" data-testid="dialog-edit-user">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and permissions
            </DialogDescription>
          </DialogHeader>
          <Form {...editUserForm}>
            <form
              onSubmit={editUserForm.handleSubmit((values) =>
                editUserMutation.mutate({ id: editingUser!.id, data: values }),
              )}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editUserForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input data-testid="input-edit-firstname" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editUserForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input data-testid="input-edit-lastname" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editUserForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="input-edit-email"
                        type="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editUserForm.control}
                  name="mobile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile (Optional)</FormLabel>
                      <FormControl>
                        <Input data-testid="input-edit-mobile" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editUserForm.control}
                  name="organization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-edit-organization"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editUserForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={editingUser?.id === currentUser?.id}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-role">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="license_manager">
                            License Manager
                          </SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="super_admin">
                            Super Admin
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {editingUser?.id === currentUser?.id && (
                        <FormDescription className="text-xs text-amber-600 dark:text-amber-400">
                          Cannot change your own role
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editUserForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={editingUser?.id === currentUser?.id}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                          <SelectItem value="deleted">Deleted</SelectItem>
                        </SelectContent>
                      </Select>
                      {editingUser?.id === currentUser?.id && (
                        <FormDescription className="text-xs text-amber-600 dark:text-amber-400">
                          Cannot change your own status
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  data-testid="button-edit-cancel"
                  type="button"
                  variant="outline"
                  onClick={() => setEditingUser(null)}
                  disabled={editUserMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  data-testid="button-edit-submit"
                  type="submit"
                  disabled={editUserMutation.isPending}
                  className="bg-gradient-to-r from-purple-600 to-blue-900 hover:from-purple-700 hover:to-blue-950"
                >
                  {editUserMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update User"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog
        open={!!deletingUserId}
        onOpenChange={(open) => !open && setDeletingUserId(null)}
      >
        <AlertDialogContent data-testid="dialog-delete-user">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action will mark
              the user as deleted and they will no longer be able to access the
              system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-testid="button-delete-cancel"
              disabled={deleteUserMutation.isPending}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-testid="button-delete-confirm"
              onClick={() =>
                deletingUserId && deleteUserMutation.mutate(deletingUserId)
              }
              disabled={deleteUserMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteUserMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete User"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
