import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Building2, Users, Ticket, Plus, UserPlus, ArrowRightLeft, UserMinus, CreditCard, AlertCircle, LogOut, Home, Package, Calendar, RefreshCw, Mail } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { clearAllSessionData } from "@/lib/session";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MobileNavSheet, type NavItem } from "@/components/admin/mobile-nav-sheet";
import type { OrganizationOverviewDTO, LicenseAssignmentDTO } from "@shared/schema";

interface AuthUser {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  superUser?: boolean; // Flag for unlimited access users
}

interface AuthResponse {
  user: AuthUser;
  subscription: any;
}

export default function LicenseManager() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [addSeatsDialogOpen, setAddSeatsDialogOpen] = useState(false);
  const [assignEmail, setAssignEmail] = useState("");
  const [assignFirstName, setAssignFirstName] = useState("");
  const [assignLastName, setAssignLastName] = useState("");
  const [assignPhone, setAssignPhone] = useState("");
  const [assignNotes, setAssignNotes] = useState("");
  const [selectedAssignment, setSelectedAssignment] = useState<LicenseAssignmentDTO | null>(null);
  const [reassignEmail, setReassignEmail] = useState("");
  const [reassignNotes, setReassignNotes] = useState("");
  const [additionalSeats, setAdditionalSeats] = useState("");
  const [activeTab, setActiveTab] = useState("assignments");

  // Check authentication first - API returns { user, subscription }
  const { data: authResponse, isLoading: userLoading, error: userError } = useQuery<AuthResponse>({
    queryKey: ["/api/auth/me"],
    retry: false
  });
  
  const user = authResponse?.user;

  // Fetch organization overview only if authenticated
  const { data: overview, isLoading, error, refetch } = useQuery<OrganizationOverviewDTO>({
    queryKey: ["/api/enterprise/overview"],
    retry: false,
    enabled: !!user
  });

  // ALL MUTATIONS MUST BE DECLARED BEFORE ANY CONDITIONAL RETURNS (React Rules of Hooks)
  // Assign license mutation
  const assignMutation = useMutation({
    mutationFn: async (data: { userEmail: string; firstName: string; lastName: string; phone: string; notes?: string }) => {
      return await apiRequest("POST", "/api/enterprise/assign", data);
    },
    onSuccess: () => {
      toast({
        title: "License Assigned",
        description: "License has been successfully assigned to the user."
      });
      setAssignDialogOpen(false);
      setAssignEmail("");
      setAssignFirstName("");
      setAssignLastName("");
      setAssignPhone("");
      setAssignNotes("");
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Assignment Failed",
        description: error.message || "Failed to assign license",
        variant: "destructive"
      });
    }
  });

  // Reassign license mutation
  const reassignMutation = useMutation({
    mutationFn: async (data: { assignmentId: string; newUserEmail: string; notes?: string }) => {
      return await apiRequest("POST", "/api/enterprise/reassign", data);
    },
    onSuccess: () => {
      toast({
        title: "License Reassigned",
        description: "License has been successfully reassigned."
      });
      setReassignDialogOpen(false);
      setSelectedAssignment(null);
      setReassignEmail("");
      setReassignNotes("");
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Reassignment Failed",
        description: error.message || "Failed to reassign license",
        variant: "destructive"
      });
    }
  });

  // Unassign license mutation
  const unassignMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      return await apiRequest("POST", "/api/enterprise/unassign", { assignmentId });
    },
    onSuccess: () => {
      toast({
        title: "License Unassigned",
        description: "License has been successfully unassigned."
      });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Unassignment Failed",
        description: error.message || "Failed to unassign license",
        variant: "destructive"
      });
    }
  });

  // Resend email mutation
  const resendEmailMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      return await apiRequest("POST", "/api/enterprise/resend-email", { assignmentId });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Email Sent",
        description: data.message || "Access email has been resent. Please check spam folder."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Email Failed",
        description: error.message || "Failed to send email. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("DELETE", `/api/enterprise/users/${userId}`);
    },
    onSuccess: () => {
      toast({
        title: "User Deleted",
        description: "User has been successfully removed from the organization."
      });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete user",
        variant: "destructive"
      });
    }
  });

  // Add seats mutation (creates Razorpay order)
  const addSeatsMutation = useMutation({
    mutationFn: async (seats: number) => {
      return await apiRequest("POST", "/api/enterprise/add-seats", { additionalSeats: seats });
    },
    onSuccess: async (data: any) => {
      // Check if Razorpay SDK is available
      if (!(window as any).Razorpay) {
        toast({
          title: "Payment Gateway Loading",
          description: "Please wait while we load the payment gateway...",
          variant: "destructive",
        });
        return;
      }

      const options = {
        key: data.razorpayKeyId,
        amount: Math.round(data.amount * 100),
        currency: data.currency || "INR",
        name: "Rev Winner",
        description: `Add ${data.additionalSeats} seats to license package`,
        order_id: data.razorpayOrderId,
        prefill: {
          name: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '',
          email: user?.email || '',
        },
        theme: {
          color: "#7c3aed",
        },
        handler: async function (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) {
          try {
            await apiRequest("POST", "/api/enterprise/verify-add-seats", {
              orderId: data.orderId,
              additionalSeats: data.additionalSeats,
              licensePackageId: overview?.activePackage?.id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            toast({
              title: "Seats Added Successfully",
              description: `${data.additionalSeats} seats have been added to your license package.`
            });
            setAddSeatsDialogOpen(false);
            setAdditionalSeats("");
            refetch();
          } catch (error: any) {
            toast({
              title: "Verification Failed",
              description: error.message || "Failed to verify payment",
              variant: "destructive"
            });
          }
        },
        modal: {
          ondismiss: function () {
            toast({
              title: "Payment Cancelled",
              description: "You cancelled the payment process.",
            });
          }
        }
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.on('payment.failed', function (response: any) {
        toast({
          title: "Payment Failed",
          description: response.error?.description || "Payment was not completed.",
          variant: "destructive",
        });
      });
      razorpay.open();
    },
    onError: (error: any) => {
      toast({
        title: "Order Creation Failed",
        description: error.message || "Failed to create order",
        variant: "destructive"
      });
    }
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      // Clear all session data including localStorage tokens
      clearAllSessionData({ clearCache: () => queryClient.clear() });
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out."
      });
      setLocation("/login");
    },
    onError: () => {
      // Clear all session data even on error to prevent stale sessions
      clearAllSessionData({ clearCache: () => queryClient.clear() });
      setLocation("/login");
    }
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!userLoading && (userError || !user)) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access the License Manager.",
        variant: "destructive"
      });
      setLocation("/login");
    }
  }, [user, userLoading, userError, setLocation, toast]);

  // Show error if user doesn't have license_manager role AND is not a super user
  if (user && user.role !== 'license_manager' && !user.superUser && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 dark:from-background dark:to-muted/10 p-4">
        <div className="container mx-auto max-w-2xl py-12">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription className="mt-2">
              You don't have permission to access the License Manager. This area is only available to users with the License Manager role.
              <br /><br />
              To get started with enterprise licensing:
              <ul className="list-disc list-inside mt-2 ml-2">
                <li>Visit the <a href="/enterprise-purchase" className="underline font-medium">Enterprise Purchase</a> page to buy bulk licenses</li>
                <li>After completing your purchase, you'll automatically become a License Manager</li>
              </ul>
            </AlertDescription>
          </Alert>
          <div className="mt-6 flex gap-4">
            <Button onClick={() => setLocation("/enterprise-purchase")} data-testid="button-goto-purchase">
              Purchase Enterprise Licenses
            </Button>
            <Button variant="outline" onClick={() => setLocation("/")} data-testid="button-goto-home">
              Go Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (userLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 dark:from-background dark:to-muted/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading License Manager...</p>
        </div>
      </div>
    );
  }

  // Show error if organization fetch failed
  if (error && !overview) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 dark:from-background dark:to-muted/10 p-4">
        <div className="container mx-auto max-w-2xl py-12">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Organization Found</AlertTitle>
            <AlertDescription className="mt-2">
              You have the License Manager role, but no organization is associated with your account.
              <br /><br />
              This usually means:
              <ul className="list-disc list-inside mt-2 ml-2">
                <li>You need to complete an enterprise purchase first</li>
                <li>Or there may be an issue with your account setup</li>
              </ul>
            </AlertDescription>
          </Alert>
          <div className="mt-6 flex gap-4">
            <Button onClick={() => setLocation("/enterprise-purchase")} data-testid="button-goto-purchase">
              Purchase Enterprise Licenses
            </Button>
            <Button variant="outline" onClick={() => setLocation("/")} data-testid="button-goto-home">
              Go Home
            </Button>
          </div>
        </div>
      </div>
    );
  }


  const handleAssignLicense = () => {
    if (!assignEmail) {
      toast({
        title: "Email Required",
        description: "Please enter a user email address",
        variant: "destructive"
      });
      return;
    }
    if (!assignFirstName || assignFirstName.trim().length === 0) {
      toast({
        title: "First Name Required",
        description: "Please enter the user's first name",
        variant: "destructive"
      });
      return;
    }
    if (!assignLastName || assignLastName.trim().length === 0) {
      toast({
        title: "Last Name Required",
        description: "Please enter the user's last name",
        variant: "destructive"
      });
      return;
    }
    if (!assignPhone || assignPhone.trim().length < 10) {
      toast({
        title: "Phone Number Required",
        description: "Please enter a valid phone number (minimum 10 digits)",
        variant: "destructive"
      });
      return;
    }

    assignMutation.mutate({
      userEmail: assignEmail,
      firstName: assignFirstName.trim(),
      lastName: assignLastName.trim(),
      phone: assignPhone.trim(),
      notes: assignNotes || undefined
    });
  };

  const handleReassignLicense = () => {
    if (!selectedAssignment || !reassignEmail) {
      toast({
        title: "Information Required",
        description: "Please select an assignment and enter a new user email",
        variant: "destructive"
      });
      return;
    }

    reassignMutation.mutate({
      assignmentId: selectedAssignment.id,
      newUserEmail: reassignEmail,
      notes: reassignNotes || undefined
    });
  };

  const handleUnassignLicense = (assignmentId: string) => {
    if (confirm("Are you sure you want to unassign this license?")) {
      unassignMutation.mutate(assignmentId);
    }
  };

  const handleAddSeats = () => {
    const seats = parseInt(additionalSeats, 10);
    if (isNaN(seats) || seats < 1) {
      toast({
        title: "Invalid Number",
        description: "Please enter a valid number of seats",
        variant: "destructive"
      });
      return;
    }

    addSeatsMutation.mutate(seats);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No Organization Found</CardTitle>
            <CardDescription>
              You don't have access to any enterprise organization.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header with navigation and user menu */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                License Manager
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="hidden sm:flex items-center gap-2"
              data-testid="button-goto-home"
            >
              <Home className="w-4 h-4" />
              Home
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full" data-testid="button-user-menu">
                  <Avatar className="h-9 w-9 border-2 border-purple-500/50">
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm font-semibold">
                      {user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {user?.firstName && (
                      <p className="font-medium text-sm" data-testid="text-user-name">
                        {user.firstName} {user.lastName || ""}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground" data-testid="text-user-email">
                      {user?.email}
                    </p>
                    <Badge variant="outline" className="w-fit mt-1 text-xs" data-testid="badge-user-role">
                      {user?.role}
                    </Badge>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setLocation("/")}
                  className="sm:hidden"
                  data-testid="menu-item-home"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                  data-testid="menu-item-logout"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            License Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your organization's enterprise licenses
          </p>
        </div>

        {/* Expiry Warning Banner */}
        {overview.activePackage && (() => {
          const endDate = new Date(overview.activePackage.endDate);
          const today = new Date();
          const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysRemaining <= 14 && daysRemaining > 0) {
            const isUrgent = daysRemaining <= 3;
            return (
              <Alert 
                variant={isUrgent ? "destructive" : "default"}
                className={`mb-6 ${isUrgent ? 'border-red-500 bg-red-50 dark:bg-red-950/30' : 'border-amber-500 bg-amber-50 dark:bg-amber-950/30'}`}
                data-testid="alert-expiry-warning"
              >
                <AlertCircle className={`h-4 w-4 ${isUrgent ? 'text-red-600' : 'text-amber-600'}`} />
                <AlertTitle className={isUrgent ? 'text-red-800 dark:text-red-200' : 'text-amber-800 dark:text-amber-200'}>
                  {isUrgent ? '⚠️ License Expires Soon!' : 'License Renewal Reminder'}
                </AlertTitle>
                <AlertDescription className={isUrgent ? 'text-red-700 dark:text-red-300' : 'text-amber-700 dark:text-amber-300'}>
                  Your license package expires in <strong>{daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</strong> 
                  (on {endDate.toLocaleDateString('en-US', { dateStyle: 'long' })}).
                  {isUrgent 
                    ? ' Please renew immediately to avoid service interruption.'
                    : ' Renew soon to ensure uninterrupted access for your team.'}
                </AlertDescription>
              </Alert>
            );
          } else if (daysRemaining <= 0) {
            return (
              <Alert 
                variant="destructive"
                className="mb-6 border-red-600 bg-red-100 dark:bg-red-950/50"
                data-testid="alert-license-expired"
              >
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertTitle className="text-red-800 dark:text-red-200">License Expired</AlertTitle>
                <AlertDescription className="text-red-700 dark:text-red-300">
                  Your license package expired on {endDate.toLocaleDateString('en-US', { dateStyle: 'long' })}.
                  Please renew to restore access for your team.
                </AlertDescription>
              </Alert>
            );
          }
          return null;
        })()}

        {/* Overview Cards */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card data-testid="card-organization">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Organization</CardTitle>
              <Building2 className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-company-name">{overview.organization.companyName}</div>
              <p className="text-xs text-muted-foreground mt-1" data-testid="text-billing-email">
                {overview.organization.billingEmail}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-total-seats">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Seats</CardTitle>
              <Ticket className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-seats-count">{overview.totalSeats}</div>
              <p className="text-xs text-muted-foreground mt-1" data-testid="text-package-type">
                {overview.activePackage?.packageType || "No active package"}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-assigned-seats">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assigned</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-assigned-seats-count">{overview.assignedSeats}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Currently assigned licenses
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-available-seats">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available</CardTitle>
              <Plus className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-available-seats-count">{overview.availableSeats}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Seats ready to assign
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Subscription Overview */}
        <div className="grid gap-6 mb-8">
          {/* Platform Access Subscription */}
          {overview.subscription && overview.subscription.plan && (
            <Card data-testid="card-platform-subscription">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Platform Access Subscription</CardTitle>
                    <CardDescription>
                      Your current platform access plan
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Plan</p>
                    <p className="text-lg font-semibold" data-testid="text-plan-name">
                      {overview.subscription.plan.name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Billing</p>
                    <p className="text-lg font-semibold" data-testid="text-billing-interval">
                      {overview.subscription.plan.billingInterval || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                    <p className="text-lg font-semibold" data-testid="text-start-date">
                      {overview.subscription.createdAt ? 
                        new Date(overview.subscription.createdAt).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Renewal Date</p>
                    <p className="text-lg font-semibold" data-testid="text-renewal-date">
                      {overview.subscription.currentPeriodEnd ? 
                        new Date(overview.subscription.currentPeriodEnd).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <Badge variant={overview.subscription.status === "active" ? "default" : "secondary"} data-testid="badge-subscription-status">
                    {overview.subscription.status || "unknown"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* License Package Info */}
          {overview.activePackage && (
            <Card data-testid="card-license-package">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Active License Package</CardTitle>
                    <CardDescription>
                      Valid until {new Date(overview.activePackage.endDate).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Dialog open={addSeatsDialogOpen} onOpenChange={setAddSeatsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button data-testid="button-add-seats">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Add Seats
                      </Button>
                    </DialogTrigger>
                    <DialogContent data-testid="dialog-add-seats">
                      <DialogHeader>
                        <DialogTitle>Add Additional Seats</DialogTitle>
                        <DialogDescription>
                          Purchase additional seats for your license package
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="additionalSeats">Number of Seats</Label>
                          <Input
                            id="additionalSeats"
                            type="number"
                            min="1"
                            placeholder="Enter number of seats"
                            value={additionalSeats}
                            onChange={(e) => setAdditionalSeats(e.target.value)}
                            data-testid="input-additional-seats"
                          />
                        </div>
                        <div className="text-xs text-amber-600 dark:text-amber-400">
                          * Minimum transaction amount is $1.00 USD
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setAddSeatsDialogOpen(false)}
                          data-testid="button-cancel-add-seats"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleAddSeats}
                          disabled={addSeatsMutation.isPending}
                          data-testid="button-confirm-add-seats"
                        >
                          {addSeatsMutation.isPending ? "Processing..." : "Purchase Seats"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Badge variant="outline" data-testid="badge-package-status">{overview.activePackage.status}</Badge>
                  <span className="text-sm text-muted-foreground" data-testid="text-package-start-date">
                    Started {new Date(overview.activePackage.startDate).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Tabs for Assignments and Members */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          {/* Navigation Menu Button */}
          <div>
            <MobileNavSheet
              items={[
                { value: "assignments", label: `Assignments (${overview.assignments.length})`, icon: <Ticket className="h-4 w-4" />, testId: "assignments" },
                { value: "addons", label: `Add-ons (${overview.addons?.length || 0})`, icon: <Package className="h-4 w-4" />, testId: "addons" },
                { value: "members", label: `Members (${overview.members.length})`, icon: <Users className="h-4 w-4" />, testId: "members" },
              ]}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              title="License Manager"
            />
          </div>

          <TabsContent value="assignments" className="space-y-4">
            <Card data-testid="card-assignments-list">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>License Assignments</CardTitle>
                  <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                    <DialogTrigger asChild>
                      <Button data-testid="button-assign-license">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Assign License
                      </Button>
                    </DialogTrigger>
                    <DialogContent data-testid="dialog-assign-license">
                      <DialogHeader>
                        <DialogTitle>Assign License to User</DialogTitle>
                        <DialogDescription>
                          Enter the user's details to assign a license. All fields marked with * are required.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="assignFirstName">First Name *</Label>
                            <Input
                              id="assignFirstName"
                              placeholder="John"
                              value={assignFirstName}
                              onChange={(e) => setAssignFirstName(e.target.value)}
                              data-testid="input-assign-firstname"
                            />
                          </div>
                          <div>
                            <Label htmlFor="assignLastName">Last Name *</Label>
                            <Input
                              id="assignLastName"
                              placeholder="Doe"
                              value={assignLastName}
                              onChange={(e) => setAssignLastName(e.target.value)}
                              data-testid="input-assign-lastname"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="assignEmail">Email Address *</Label>
                          <Input
                            id="assignEmail"
                            type="email"
                            placeholder="user@example.com"
                            value={assignEmail}
                            onChange={(e) => setAssignEmail(e.target.value)}
                            data-testid="input-assign-email"
                          />
                        </div>
                        <div>
                          <Label htmlFor="assignPhone">Phone Number *</Label>
                          <Input
                            id="assignPhone"
                            type="tel"
                            placeholder="1234567890 (min 10 digits)"
                            value={assignPhone}
                            onChange={(e) => setAssignPhone(e.target.value)}
                            data-testid="input-assign-phone"
                          />
                        </div>
                        <div>
                          <Label htmlFor="assignNotes">Notes (Optional)</Label>
                          <Input
                            id="assignNotes"
                            placeholder="Add any notes about this assignment"
                            value={assignNotes}
                            onChange={(e) => setAssignNotes(e.target.value)}
                            data-testid="input-assign-notes"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setAssignDialogOpen(false)}
                          data-testid="button-cancel-assign"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleAssignLicense}
                          disabled={assignMutation.isPending}
                          data-testid="button-confirm-assign"
                        >
                          {assignMutation.isPending ? "Assigning..." : "Assign License"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {overview.assignments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8" data-testid="text-no-assignments">
                    No licenses assigned yet
                  </p>
                ) : (
                  <Table data-testid="table-assignments">
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Assigned Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overview.assignments.map((assignment) => (
                        <TableRow key={assignment.id} data-testid={`row-assignment-${assignment.id}`}>
                          <TableCell>
                            {assignment.user?.firstName} {assignment.user?.lastName}
                          </TableCell>
                          <TableCell>{assignment.user?.email}</TableCell>
                          <TableCell>
                            {assignment.assignedAt ? new Date(assignment.assignedAt).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={assignment.status === "active" ? "default" : "secondary"}>
                              {assignment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {assignment.status === "active" && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedAssignment(assignment);
                                    setReassignDialogOpen(true);
                                  }}
                                  data-testid={`button-reassign-${assignment.id}`}
                                >
                                  <ArrowRightLeft className="h-4 w-4 mr-1" />
                                  Reassign
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUnassignLicense(assignment.id)}
                                  data-testid={`button-unassign-${assignment.id}`}
                                >
                                  <UserMinus className="h-4 w-4 mr-1" />
                                  Unassign
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => resendEmailMutation.mutate(assignment.id)}
                                  disabled={resendEmailMutation.isPending}
                                  data-testid={`button-resend-email-${assignment.id}`}
                                >
                                  <Mail className="h-4 w-4 mr-1" />
                                  {resendEmailMutation.isPending ? "Sending..." : "Resend Email"}
                                </Button>
                                {assignment.userId !== user?.id && (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => {
                                      if (confirm(`Are you sure you want to delete ${assignment.user?.firstName || ''} ${assignment.user?.lastName || ''} from the organization? This will revoke their license and suspend their account.`)) {
                                        deleteUserMutation.mutate(assignment.userId);
                                      }
                                    }}
                                    disabled={deleteUserMutation.isPending}
                                    data-testid={`button-delete-assignment-${assignment.id}`}
                                  >
                                    <UserMinus className="h-4 w-4 mr-1" />
                                    {deleteUserMutation.isPending ? "Deleting..." : "Delete"}
                                  </Button>
                                )}
                              </div>
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

          <TabsContent value="addons" className="space-y-4">
            <Card data-testid="card-addons-list">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-purple-600" />
                  Add-ons & Extensions
                </CardTitle>
                <CardDescription>
                  Active add-ons for your organization with subscription details
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(!overview.addons || overview.addons.length === 0) ? (
                  <div className="text-center py-8" data-testid="text-no-addons">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">No add-ons purchased yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Add-ons can be purchased from the Packages page to extend your subscription features.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {overview.addons.map((addon) => (
                      <Card key={addon.id} className="border-2" data-testid={`card-addon-${addon.id}`}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-semibold">
                              {addon.displayName}
                            </CardTitle>
                            <Badge 
                              variant={addon.status === "active" ? "default" : "secondary"}
                              data-testid={`badge-addon-status-${addon.id}`}
                            >
                              {addon.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>Start Date</span>
                            </div>
                            <div className="font-medium text-right" data-testid={`text-addon-start-${addon.id}`}>
                              {addon.startDate 
                                ? new Date(addon.startDate).toLocaleDateString() 
                                : "N/A"}
                            </div>
                            
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <RefreshCw className="h-4 w-4" />
                              <span>Renewal Date</span>
                            </div>
                            <div className="font-medium text-right" data-testid={`text-addon-renewal-${addon.id}`}>
                              {addon.endDate 
                                ? new Date(addon.endDate).toLocaleDateString() 
                                : "N/A"}
                            </div>
                          </div>
                          
                          {addon.details && (
                            <div className="pt-2 border-t">
                              <p className="text-xs text-muted-foreground">
                                {typeof addon.details === 'object' && addon.details.description 
                                  ? addon.details.description 
                                  : JSON.stringify(addon.details)}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            <Card data-testid="card-members-list">
              <CardHeader>
                <CardTitle>Organization Members</CardTitle>
                <CardDescription>
                  Users who are part of your organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                {overview.members.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8" data-testid="text-no-members">
                    No members yet
                  </p>
                ) : (
                  <Table data-testid="table-members">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overview.members.map((member) => (
                        <TableRow key={member.id} data-testid={`row-member-${member.id}`}>
                          <TableCell>
                            {member.user?.firstName} {member.user?.lastName}
                          </TableCell>
                          <TableCell>{member.user?.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{member.role}</Badge>
                          </TableCell>
                          <TableCell>
                            {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={member.status === "active" ? "default" : "secondary"}>
                              {member.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {member.status === "active" && member.userId !== user?.id && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  if (confirm(`Are you sure you want to remove ${member.user?.firstName || ''} ${member.user?.lastName || ''} from the organization? This action cannot be undone.`)) {
                                    deleteUserMutation.mutate(member.userId);
                                  }
                                }}
                                disabled={deleteUserMutation.isPending}
                                data-testid={`button-delete-${member.id}`}
                              >
                                <UserMinus className="h-4 w-4 mr-1" />
                                {deleteUserMutation.isPending ? "Deleting..." : "Delete"}
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
        </Tabs>

        {/* Reassign Dialog */}
        <Dialog open={reassignDialogOpen} onOpenChange={setReassignDialogOpen}>
          <DialogContent data-testid="dialog-reassign-license">
            <DialogHeader>
              <DialogTitle>Reassign License</DialogTitle>
              <DialogDescription>
                Transfer this license to a different user
              </DialogDescription>
            </DialogHeader>
            {selectedAssignment && (
              <div className="space-y-4">
                <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-md" data-testid="text-current-assignment">
                  <p className="text-sm font-medium">Current User:</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedAssignment.user?.firstName} {selectedAssignment.user?.lastName} ({selectedAssignment.user?.email})
                  </p>
                </div>
                <div>
                  <Label htmlFor="reassignEmail">New User Email</Label>
                  <Input
                    id="reassignEmail"
                    type="email"
                    placeholder="newuser@example.com"
                    value={reassignEmail}
                    onChange={(e) => setReassignEmail(e.target.value)}
                    data-testid="input-reassign-email"
                  />
                </div>
                <div>
                  <Label htmlFor="reassignNotes">Notes (Optional)</Label>
                  <Input
                    id="reassignNotes"
                    placeholder="Reason for reassignment"
                    value={reassignNotes}
                    onChange={(e) => setReassignNotes(e.target.value)}
                    data-testid="input-reassign-notes"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setReassignDialogOpen(false);
                  setSelectedAssignment(null);
                  setReassignEmail("");
                  setReassignNotes("");
                }}
                data-testid="button-cancel-reassign"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReassignLicense}
                disabled={reassignMutation.isPending}
                data-testid="button-confirm-reassign"
              >
                {reassignMutation.isPending ? "Reassigning..." : "Reassign License"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
