import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Tag, TrendingUp, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

interface PromoCode {
  id: string;
  code: string;
  category?: string;
  allowedPlanTypes?: string[];
  discountType: string;
  discountValue: string;
  usesCount: string;
  maxUses: string | null;
  isActive: boolean;
  expiresAt: Date | null;
  createdAt: Date;
}

interface PromoCodeAnalytics {
  id: string;
  code: string;
  discountType: string;
  discountValue: string;
  usesCount: string;
  maxUses: string | null;
  usageRate: string;
  isActive: boolean;
  
}

interface UsageHistory {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  usedAt: Date;
  amount: string;
}

const createPromoSchema = z.object({
  code: z.string().min(3).max(50),
  category: z.enum(['platform_subscription', 'session_minutes', 'train_me', 'dai']).optional(),
  allowedPlanTypes: z.array(z.string()).optional(),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.string().min(1),
  maxUses: z.string().optional(),
  expiresAt: z.string().optional(),
});

export function PromoCodeManagement() {
  const { toast } = useToast();
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState<{ open: boolean; code?: PromoCode }>({ open: false });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id?: string; code?: string }>({ open: false });
  const [usageDialog, setUsageDialog] = useState<{ open: boolean; codeId?: string; codeName?: string }>({ open: false });
  const [selectedPlanTypes, setSelectedPlanTypes] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('platform_subscription');

  // Category-specific plan types
  const CATEGORY_PLAN_TYPES: Record<string, { value: string; label: string }[]> = {
    platform_subscription: [
      { value: 'yearly', label: '1-Year Plan' },
      { value: 'three_year', label: '3-Year Plan' },
      { value: 'monthly', label: 'Monthly Plan' },
      { value: 'six_month', label: '6-Month Plan' },
    ],
    session_minutes: [
      { value: '500', label: '500 Minutes' },
      { value: '1000', label: '1000 Minutes' },
      { value: '1500', label: '1500 Minutes' },
      { value: '2000', label: '2000 Minutes' },
    ],
    train_me: [
      { value: 'train_me_30_days', label: 'Train Me (30 Days)' },
    ],
    dai: [
      { value: 'dai_basic', label: 'DAI Basic' },
      { value: 'dai_premium', label: 'DAI Premium' },
    ],
  };

  // Get display name for plan type based on category
  const getPlanTypeDisplay = (category: string | undefined, planType: string): string => {
    if (!category) return planType;
    
    const categoryPlans = CATEGORY_PLAN_TYPES[category];
    if (!categoryPlans) return planType;
    
    const plan = categoryPlans.find(p => p.value === planType);
    return plan ? plan.label : planType;
  };

  const createForm = useForm<z.infer<typeof createPromoSchema>>({
    resolver: zodResolver(createPromoSchema),
    defaultValues: {
      code: "",
      category: "platform_subscription",
      allowedPlanTypes: [],
      discountType: "percentage",
      discountValue: "",
      maxUses: "",
      expiresAt: "",
    },
  });

  // Watch category changes to reset plan types
  const watchCategory = createForm.watch('category');
  
  // Reset selected plan types when category changes
  const handleCategoryChange = (newCategory: string) => {
    setSelectedCategory(newCategory);
    setSelectedPlanTypes([]);
    createForm.setValue('allowedPlanTypes', []);
    createForm.setValue('category', newCategory as any);
  };

  const { data: promoCodes, isLoading } = useQuery<{ codes: PromoCode[] }>({
    queryKey: ["/api/admin/promo-codes"],
  });

  const { data: analytics } = useQuery<{ analytics: PromoCodeAnalytics[] }>({
    queryKey: ["/api/admin/promo-codes/analytics"],
  });

  const { data: usageHistory } = useQuery<{ history: UsageHistory[] }>({
    queryKey: ["/api/admin/promo-codes", usageDialog.codeId, "usage-history"],
    enabled: !!usageDialog.codeId,
    queryFn: async () => {
      const response = await fetch(`/api/admin/promo-codes/${usageDialog.codeId}/usage-history`);
      if (!response.ok) throw new Error("Failed to fetch usage history");
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createPromoSchema>) => {
      const response = await apiRequest("POST", "/api/admin/promo-codes", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create promo code");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Promo Code Created", description: "Promo code has been created successfully." });
      setCreateDialog(false);
      createForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-codes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-codes/analytics"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PATCH", `/api/admin/promo-codes/${id}`, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update promo code");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Promo Code Updated", description: "Promo code has been updated successfully." });
      setEditDialog({ open: false });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-codes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-codes/analytics"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/admin/promo-codes/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete promo code");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Promo Code Deleted", description: "Promo code has been deleted successfully." });
      setDeleteDialog({ open: false });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-codes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-codes/analytics"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleCreate = createForm.handleSubmit((values) => {
    createMutation.mutate(values);
  });

  const handleToggleActive = (id: string, currentState: boolean) => {
    updateMutation.mutate({
      id,
      data: { isActive: !currentState }
    });
  };

  const formatDate = (dateStr: string | Date | null) => {
    if (!dateStr) return "Never";
    return format(new Date(dateStr), 'MMM d, yyyy');
  };

  const getDiscountDisplay = (type: string, value: string) => {
    return type === 'percentage' ? `${value}%` : `₹${value}`;
  };

  return (
    <div className="space-y-6" data-testid="promo-code-management">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Promo Code Management</h2>
          <p className="text-muted-foreground">Create and manage promotional discount codes</p>
        </div>
        <Button onClick={() => setCreateDialog(true)} data-testid="btn-create-promo">
          <Plus className="h-4 w-4 mr-2" />
          Create Promo Code
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all-codes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all-codes" data-testid="tab-all-codes">All Codes</TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="all-codes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Promo Codes</CardTitle>
              <CardDescription>All promotional codes and their current status</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">Loading...</div>
              ) : promoCodes?.codes && promoCodes.codes.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Allowed Plans</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Uses</TableHead>
                      <TableHead>Max Uses</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {promoCodes.codes.map((code, index) => (
                      <TableRow key={code.id} data-testid={`promo-code-${index}`}>
                        <TableCell className="font-mono font-semibold">{code.code}</TableCell>
                        <TableCell>
                          {code.category ? (
                            <Badge variant="outline" className="text-xs">
                              {code.category.replace('_', ' ')}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">All</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {code.allowedPlanTypes && code.allowedPlanTypes.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {code.allowedPlanTypes.map((planType) => (
                                <Badge key={planType} variant="secondary" className="text-xs">
                                  {getPlanTypeDisplay(code.category, planType)}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">All Plans</span>
                          )}
                        </TableCell>
                        <TableCell>{getDiscountDisplay(code.discountType, code.discountValue)}</TableCell>
                        <TableCell>{code.usesCount}</TableCell>
                        <TableCell>{code.maxUses || "Unlimited"}</TableCell>
                        <TableCell>{formatDate(code.expiresAt)}</TableCell>
                        <TableCell>
                          <Badge variant={code.isActive ? "default" : "secondary"}>
                            {code.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleActive(code.id, code.isActive)}
                              data-testid={`btn-toggle-${index}`}
                            >
                              {code.isActive ? "Deactivate" : "Activate"}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setUsageDialog({ open: true, codeId: code.id, codeName: code.code })}
                              data-testid={`btn-history-${index}`}
                            >
                              <History className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeleteDialog({ open: true, id: code.id, code: code.code })}
                              data-testid={`btn-delete-${index}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  No promo codes found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Promo Code Analytics
              </CardTitle>
              <CardDescription>Performance metrics for all promo codes</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.analytics && analytics.analytics.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Total Uses</TableHead>
                      <TableHead>Max Uses</TableHead>
                      <TableHead>Usage Rate</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.analytics.map((item, index) => (
                      <TableRow key={item.id} data-testid={`analytics-${index}`}>
                        <TableCell className="font-mono font-semibold">{item.code}</TableCell>
                        <TableCell>{getDiscountDisplay(item.discountType, item.discountValue)}</TableCell>
                        <TableCell className="font-semibold">{item.usesCount}</TableCell>
                        <TableCell>{item.maxUses || "Unlimited"}</TableCell>
                        <TableCell>
                          <Badge variant={item.usageRate === "Unlimited" ? "outline" : "secondary"}>
                            {item.usageRate}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.isActive ? "default" : "secondary"}>
                            {item.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  No analytics data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Promo Code Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent data-testid="dialog-create-promo">
          <DialogHeader>
            <DialogTitle>Create Promo Code</DialogTitle>
            <DialogDescription>Create a new promotional discount code</DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={handleCreate} className="space-y-4">
              <FormField
                control={createForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Promo Code</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="SAVE20" data-testid="input-code" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={handleCategoryChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="platform_subscription">Platform Subscription</SelectItem>
                        <SelectItem value="session_minutes">Session Minutes Add-on</SelectItem>
                        <SelectItem value="train_me">Train Me Add-on</SelectItem>
                        <SelectItem value="dai">DAI Add-on</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="allowedPlanTypes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Allowed Plans (Optional)</FormLabel>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Leave empty to allow all plans in this category. Select specific plans to restrict usage.
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {CATEGORY_PLAN_TYPES[selectedCategory]?.map((planType) => (
                          <div key={planType.value} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`plan-${planType.value}`}
                              checked={selectedPlanTypes.includes(planType.value)}
                              onChange={(e) => {
                                const newTypes = e.target.checked
                                  ? [...selectedPlanTypes, planType.value]
                                  : selectedPlanTypes.filter(t => t !== planType.value);
                                setSelectedPlanTypes(newTypes);
                                field.onChange(newTypes.length > 0 ? newTypes : undefined);
                              }}
                              className="h-4 w-4 rounded border-gray-300"
                              data-testid={`checkbox-plan-${planType.value}`}
                            />
                            <label
                              htmlFor={`plan-${planType.value}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {planType.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="discountType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-discount-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="discountValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount Value</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" placeholder="20" data-testid="input-discount-value" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="maxUses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Uses (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" placeholder="100" data-testid="input-max-uses" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="expiresAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry Date (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" data-testid="input-expires-at" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateDialog(false)}
                  data-testid="btn-cancel-create"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  data-testid="btn-confirm-create"
                >
                  {createMutation.isPending ? "Creating..." : "Create Promo Code"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open })}>
        <DialogContent data-testid="dialog-delete-promo">
          <DialogHeader>
            <DialogTitle>Delete Promo Code</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the promo code "{deleteDialog.code}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false })}
              data-testid="btn-cancel-delete"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteDialog.id && deleteMutation.mutate(deleteDialog.id)}
              disabled={deleteMutation.isPending}
              data-testid="btn-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Usage History Dialog */}
      <Dialog open={usageDialog.open} onOpenChange={(open) => setUsageDialog({ open })}>
        <DialogContent className="max-w-3xl" data-testid="dialog-usage-history">
          <DialogHeader>
            <DialogTitle>Usage History - {usageDialog.codeName}</DialogTitle>
            <DialogDescription>Detailed usage history for this promo code</DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {usageHistory?.history && usageHistory.history.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Used On</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usageHistory.history.map((item, index) => (
                    <TableRow key={`${item.userId}-${index}`} data-testid={`usage-${index}`}>
                      <TableCell>
                        {item.firstName} {item.lastName}
                      </TableCell>
                      <TableCell>{item.email}</TableCell>
                      <TableCell className="font-semibold">₹{item.amount}</TableCell>
                      <TableCell>{formatDate(item.usedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                No usage history available
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
