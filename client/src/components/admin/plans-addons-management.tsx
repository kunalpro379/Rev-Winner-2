import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertSubscriptionPlanSchema, insertAddonSchema, type SubscriptionPlan, type Addon } from "@shared/schema";

// Subscription Plan form schema
const planFormSchema = insertSubscriptionPlanSchema.extend({
  features: z.string().transform((val) => {
    try {
      return JSON.parse(val);
    } catch {
      return [];
    }
  }),
  requiredAddons: z.string().optional().transform((val) => {
    if (!val || val.trim() === "") return [];
    try {
      return JSON.parse(val);
    } catch {
      return [];
    }
  }),
});

type PlanFormValues = z.infer<typeof planFormSchema>;

// Add-on form schema with pricing tiers support
const addonFormSchema = insertAddonSchema.extend({
  pricingTiers: z.string().optional().transform((val) => {
    if (!val || val.trim() === "") return null;
    try {
      return JSON.parse(val);
    } catch {
      return null;
    }
  }),
  metadata: z.string().optional().transform((val) => {
    if (!val || val.trim() === "") return {};
    try {
      return JSON.parse(val);
    } catch {
      return {};
    }
  }),
});

type AddonFormValues = z.infer<typeof addonFormSchema>;

export function PlansAddonsManagement() {
  const { toast } = useToast();
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [addonDialogOpen, setAddonDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [editingAddon, setEditingAddon] = useState<Addon | null>(null);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);
  const [deletingAddonId, setDeletingAddonId] = useState<string | null>(null);

  // Fetch subscription plans
  const { data: plansData, isLoading: plansLoading, refetch: refetchPlans } = useQuery({
    queryKey: ["/api/admin/subscription-plans"],
    refetchOnWindowFocus: true,
    staleTime: 0,
    gcTime: 0,
  });

  // Fetch add-ons
  const { data: addonsData, isLoading: addonsLoading, refetch: refetchAddons } = useQuery({
    queryKey: ["/api/admin/addons"],
    refetchOnWindowFocus: true,
    staleTime: 0,
    gcTime: 0,
  });

  const plans = (plansData as any)?.plans || [];
  const addons = (addonsData as any)?.addons || [];

  // Plan form
  const planForm = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      name: "",
      price: "",
      listedPrice: undefined,
      currency: "INR",
      billingInterval: "monthly",
      features: "[]",
      requiredAddons: "[]",
      isActive: true,
      publishedOnWebsite: false,
      availableUntil: undefined,
      razorpayPlanId: undefined,
    },
  });

  // Addon form
  const addonForm = useForm<AddonFormValues>({
    resolver: zodResolver(addonFormSchema),
    defaultValues: {
      slug: "",
      displayName: "",
      type: "service",
      flatPrice: undefined,
      currency: "INR",
      isActive: true,
      publishedOnWebsite: false,
      pricingTiers: undefined,
      metadata: "{}",
    },
  });

  // Create/Update Plan Mutation
  const planMutation = useMutation({
    mutationFn: async (data: PlanFormValues) => {
      const url = editingPlan
        ? `/api/admin/subscription-plans/${editingPlan.id}`
        : "/api/admin/subscription-plans";
      const method = editingPlan ? "PATCH" : "POST";

      return await apiRequest(method, url, data);
    },
    onSuccess: (data) => {
      console.log("Plan mutation successful:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-plans"] });
      refetchPlans();
      toast({
        title: editingPlan ? "Plan updated" : "Plan created",
        description: editingPlan
          ? "Subscription plan has been updated successfully."
          : "New subscription plan has been created successfully.",
      });
      setPlanDialogOpen(false);
      setEditingPlan(null);
      planForm.reset();
    },
    onError: (error: any) => {
      console.error("Plan mutation error:", error);
      console.error("Error details:", error.message, error.stack);
      toast({
        title: "Error",
        description: error.message || "Failed to save subscription plan",
        variant: "destructive",
      });
    },
  });

  // Create/Update Addon Mutation
  const addonMutation = useMutation({
    mutationFn: async (data: AddonFormValues) => {
      const url = editingAddon
        ? `/api/admin/addons/${editingAddon.id}`
        : "/api/admin/addons";
      const method = editingAddon ? "PATCH" : "POST";

      return await apiRequest(method, url, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/addons"] });
      refetchAddons();
      toast({
        title: editingAddon ? "Add-on updated" : "Add-on created",
        description: editingAddon
          ? "Add-on has been updated successfully."
          : "New add-on has been created successfully.",
      });
      setAddonDialogOpen(false);
      setEditingAddon(null);
      addonForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save add-on",
        variant: "destructive",
      });
    },
  });

  // Delete Plan Mutation
  const deletePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      return await apiRequest("DELETE", `/api/admin/subscription-plans/${planId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-plans"] });
      refetchPlans();
      toast({
        title: "Plan deleted",
        description: "Subscription plan has been deleted successfully.",
      });
      setDeletingPlanId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete subscription plan",
        variant: "destructive",
      });
      setDeletingPlanId(null);
    },
  });

  // Delete Addon Mutation
  const deleteAddonMutation = useMutation({
    mutationFn: async (addonId: string) => {
      return await apiRequest("DELETE", `/api/admin/addons/${addonId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/addons"] });
      refetchAddons();
      toast({
        title: "Add-on deleted",
        description: "Add-on has been deleted successfully.",
      });
      setDeletingAddonId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete add-on",
        variant: "destructive",
      });
      setDeletingAddonId(null);
    },
  });

  // Handle plan edit
  const handleEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    planForm.reset({
      name: plan.name,
      price: plan.price,
      listedPrice: plan.listedPrice || undefined,
      currency: plan.currency,
      billingInterval: plan.billingInterval,
      features: JSON.stringify(plan.features || []),
      requiredAddons: JSON.stringify(plan.requiredAddons || []),
      isActive: plan.isActive ?? true,
      publishedOnWebsite: plan.publishedOnWebsite ?? false,
      availableUntil: plan.availableUntil,
      razorpayPlanId: plan.razorpayPlanId || undefined,
    });
    setPlanDialogOpen(true);
  };

  // Handle addon edit
  const handleEditAddon = (addon: Addon) => {
    setEditingAddon(addon);
    addonForm.reset({
      slug: addon.slug,
      displayName: addon.displayName,
      type: addon.type,
      flatPrice: addon.flatPrice || undefined,
      currency: addon.currency,
      isActive: addon.isActive ?? true,
      publishedOnWebsite: addon.publishedOnWebsite ?? false,
      pricingTiers: addon.pricingTiers ? JSON.stringify(addon.pricingTiers) : undefined,
      metadata: addon.metadata ? JSON.stringify(addon.metadata) : "{}",
    });
    setAddonDialogOpen(true);
  };

  // Handle plan form submit
  const onPlanSubmit = (data: PlanFormValues) => {
    console.log("Submitting plan data:", data);
    console.log("Form errors:", planForm.formState.errors);
    planMutation.mutate(data);
  };

  // Handle addon form submit
  const onAddonSubmit = (data: AddonFormValues) => {
    addonMutation.mutate(data);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Subscription Plans Section */}
      <Card data-testid="card-subscription-plans">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Subscription Plans</CardTitle>
            <CardDescription>Manage subscription plans for users</CardDescription>
          </div>
          <Dialog open={planDialogOpen} onOpenChange={(open) => {
            setPlanDialogOpen(open);
            if (!open) {
              setEditingPlan(null);
              planForm.reset();
            }
          }}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-plan">
                <Plus className="h-4 w-4 mr-2" />
                Create Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle data-testid="dialog-title-plan">
                  {editingPlan ? "Edit Subscription Plan" : "Create Subscription Plan"}
                </DialogTitle>
                <DialogDescription>
                  {editingPlan
                    ? "Update the subscription plan details below."
                    : "Add a new subscription plan to the system."}
                </DialogDescription>
              </DialogHeader>
              <Form {...planForm}>
                <form onSubmit={planForm.handleSubmit(onPlanSubmit)} className="space-y-4">
                  <FormField
                    control={planForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plan Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Professional Plan" {...field} data-testid="input-plan-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={planForm.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price</FormLabel>
                          <FormControl>
                            <Input placeholder="29.99" {...field} data-testid="input-plan-price" />
                          </FormControl>
                          <FormDescription>Current price (USD)</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={planForm.control}
                      name="listedPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Listed Price (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="49.99" {...field} value={field.value || ""} data-testid="input-plan-listed-price" />
                          </FormControl>
                          <FormDescription>Original price for strikethrough</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={planForm.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-plan-currency">
                                <SelectValue placeholder="Select currency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="INR">USD</SelectItem>
                              <SelectItem value="EUR">EUR</SelectItem>
                              <SelectItem value="GBP">GBP</SelectItem>
                              <SelectItem value="INR">INR</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={planForm.control}
                      name="billingInterval"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Billing Interval</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-plan-billing-interval">
                                <SelectValue placeholder="Select interval" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="yearly">Yearly</SelectItem>
                              <SelectItem value="3-years">3 Years</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={planForm.control}
                    name="features"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Features (JSON Array)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder='["Feature 1", "Feature 2", "Feature 3"]'
                            {...field}
                            data-testid="textarea-plan-features"
                            className="font-mono text-sm"
                          />
                        </FormControl>
                        <FormDescription>Enter features as a JSON array</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={planForm.control}
                    name="requiredAddons"
                    render={({ field}) => (
                      <FormItem>
                        <FormLabel>Required Add-ons (JSON Array - Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder='["addon-id-1", "addon-id-2"]'
                            {...field}
                            data-testid="textarea-plan-required-addons"
                            className="font-mono text-sm"
                          />
                        </FormControl>
                        <FormDescription>Enter addon IDs as a JSON array</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={planForm.control}
                    name="razorpayPlanId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Gateway Plan ID (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="plan_xxxxxxxxxxxxx" {...field} value={field.value || ""} data-testid="input-plan-gateway-id" />
                        </FormControl>
                        <FormDescription>Link to Razorpay plan ID for subscription billing</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={planForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Active</FormLabel>
                          <FormDescription>
                            Make this plan available for purchase
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value ?? true}
                            onCheckedChange={field.onChange}
                            data-testid="switch-plan-active"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={planForm.control}
                    name="publishedOnWebsite"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Published on Website</FormLabel>
                          <FormDescription>
                            Show this item on the packages page
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value ?? false}
                            onCheckedChange={field.onChange}
                            data-testid="switch-plan-published"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setPlanDialogOpen(false);
                        setEditingPlan(null);
                        planForm.reset();
                      }}
                      data-testid="button-cancel-plan"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={planMutation.isPending}
                      data-testid="button-save-plan"
                    >
                      {planMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      {editingPlan ? "Update Plan" : "Create Plan"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {plansLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No subscription plans found. Create one to get started.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Interval</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead>Features</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan: SubscriptionPlan) => (
                    <TableRow key={plan.id} data-testid={`row-plan-${plan.id}`}>
                      <TableCell className="font-medium">{plan.name}</TableCell>
                      <TableCell>
                        ${plan.price} {plan.currency}
                        {plan.listedPrice && (
                          <span className="ml-2 text-muted-foreground line-through text-sm">
                            ${plan.listedPrice}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="capitalize">{plan.billingInterval}</TableCell>
                      <TableCell>
                        <Badge variant={plan.isActive ? "default" : "secondary"} data-testid={`badge-plan-status-${plan.id}`}>
                          {plan.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={plan.publishedOnWebsite ? "default" : "outline"} data-testid={`badge-plan-published-${plan.id}`}>
                          {plan.publishedOnWebsite ? "Published" : "Hidden"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {Array.isArray(plan.features) ? plan.features.length : 0} features
                        </span>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditPlan(plan)}
                          data-testid={`button-edit-plan-${plan.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingPlanId(plan.id)}
                          data-testid={`button-delete-plan-${plan.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Visual Separator */}
      <div className="my-8 border-t-2 border-primary/20" />
      
      {/* Add-ons Section */}
      <Card data-testid="card-addons" className="border-2 border-primary/30">
        <CardHeader className="flex flex-row items-center justify-between bg-primary/5">
          <div>
            <CardTitle className="text-2xl">Add-ons Management</CardTitle>
            <CardDescription className="text-base">Create and manage add-on products and services</CardDescription>
          </div>
          <Dialog open={addonDialogOpen} onOpenChange={(open) => {
            setAddonDialogOpen(open);
            if (!open) {
              setEditingAddon(null);
              addonForm.reset();
            }
          }}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-addon">
                <Plus className="h-4 w-4 mr-2" />
                Create Add-on
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle data-testid="dialog-title-addon">
                  {editingAddon ? "Edit Add-on" : "Create Add-on"}
                </DialogTitle>
                <DialogDescription>
                  {editingAddon
                    ? "Update the add-on details below."
                    : "Add a new add-on product or service."}
                </DialogDescription>
              </DialogHeader>
              <Form {...addonForm}>
                <form onSubmit={addonForm.handleSubmit(onAddonSubmit)} className="space-y-4">
                  <FormField
                    control={addonForm.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. premium-support" {...field} data-testid="input-addon-slug" />
                        </FormControl>
                        <FormDescription>Unique identifier (no spaces)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={addonForm.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Premium Support" {...field} data-testid="input-addon-display-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={addonForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Add-on Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-addon-type">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="service">Service (Flat Price)</SelectItem>
                            <SelectItem value="usage_bundle">Usage Bundle (Tiered Pricing)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Service: flat price. Usage Bundle: tiered pricing based on quantity.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {addonForm.watch("type") === "service" && (
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={addonForm.control}
                        name="flatPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Flat Price</FormLabel>
                            <FormControl>
                              <Input placeholder="99.99" {...field} value={field.value || ""} data-testid="input-addon-flat-price" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={addonForm.control}
                        name="currency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Currency</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-addon-currency">
                                  <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="INR">USD</SelectItem>
                                <SelectItem value="EUR">EUR</SelectItem>
                                <SelectItem value="GBP">GBP</SelectItem>
                                <SelectItem value="INR">INR</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {addonForm.watch("type") === "usage_bundle" && (
                    <FormField
                      control={addonForm.control}
                      name="pricingTiers"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pricing Tiers (JSON)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder='[{"threshold": 100, "pricePerUnit": 0.99}, {"threshold": 500, "pricePerUnit": 0.79}]'
                              {...field}
                              data-testid="textarea-addon-pricing-tiers"
                              className="font-mono text-sm"
                              rows={4}
                            />
                          </FormControl>
                          <FormDescription>
                            Define pricing tiers with threshold and pricePerUnit
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={addonForm.control}
                    name="metadata"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Metadata (JSON - Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder='{"description": "Additional information"}'
                            {...field}
                            data-testid="textarea-addon-metadata"
                            className="font-mono text-sm"
                          />
                        </FormControl>
                        <FormDescription>Additional metadata as JSON object</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={addonForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Active</FormLabel>
                          <FormDescription>
                            Make this add-on available for purchase
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value ?? true}
                            onCheckedChange={field.onChange}
                            data-testid="switch-addon-active"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={addonForm.control}
                    name="publishedOnWebsite"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Published on Website</FormLabel>
                          <FormDescription>
                            Show this item on the packages page
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value ?? false}
                            onCheckedChange={field.onChange}
                            data-testid="switch-addon-published"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setAddonDialogOpen(false);
                        setEditingAddon(null);
                        addonForm.reset();
                      }}
                      data-testid="button-cancel-addon"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={addonMutation.isPending}
                      data-testid="button-save-addon"
                    >
                      {addonMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      {editingAddon ? "Update Add-on" : "Create Add-on"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {addonsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : addons.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No add-ons found. Create one to get started.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {addons.map((addon: Addon) => (
                    <TableRow key={addon.id} data-testid={`row-addon-${addon.id}`}>
                      <TableCell className="font-medium">{addon.displayName}</TableCell>
                      <TableCell className="font-mono text-sm">{addon.slug}</TableCell>
                      <TableCell className="capitalize">{addon.type.replace("_", " ")}</TableCell>
                      <TableCell>
                        {addon.type === "service" && addon.flatPrice ? (
                          <span>${addon.flatPrice} {addon.currency}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Tiered</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={addon.isActive ? "default" : "secondary"} data-testid={`badge-addon-status-${addon.id}`}>
                          {addon.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={addon.publishedOnWebsite ? "default" : "outline"} data-testid={`badge-addon-published-${addon.id}`}>
                          {addon.publishedOnWebsite ? "Published" : "Hidden"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditAddon(addon)}
                          data-testid={`button-edit-addon-${addon.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingAddonId(addon.id)}
                          data-testid={`button-delete-addon-${addon.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Plan Confirmation Dialog */}
      <AlertDialog open={!!deletingPlanId} onOpenChange={(open) => !open && setDeletingPlanId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subscription Plan?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the subscription plan.
              {" "}If the plan has active subscriptions, deletion will be prevented.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-plan">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingPlanId && deletePlanMutation.mutate(deletingPlanId)}
              disabled={deletePlanMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-plan"
            >
              {deletePlanMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete Plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Addon Confirmation Dialog */}
      <AlertDialog open={!!deletingAddonId} onOpenChange={(open) => !open && setDeletingAddonId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Add-on?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the add-on.
              {" "}If the add-on is referenced by any subscription plans, deletion will be prevented.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-addon">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingAddonId && deleteAddonMutation.mutate(deletingAddonId)}
              disabled={deleteAddonMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-addon"
            >
              {deleteAddonMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete Add-on
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
