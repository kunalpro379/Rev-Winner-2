import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, Mail, CreditCard, Brain, Globe, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

// Email Configuration Schema
const emailConfigSchema = z.object({
  smtpHost: z.string().min(1, "SMTP host is required"),
  smtpPort: z.string().min(1, "SMTP port is required"),
  smtpUser: z.string().email("Valid email required"),
  smtpPassword: z.string().min(1, "Password is required"),
  fromEmail: z.string().email("Valid email required"),
  fromName: z.string().min(1, "From name is required"),
  enableEmailNotifications: z.boolean(),
});

// Payment Gateway Schema
const paymentConfigSchema = z.object({
  defaultGateway: z.enum(["razorpay", "stripe", "cashfree"]),
  razorpayKeyId: z.string().optional(),
  razorpayKeySecret: z.string().optional(),
  stripePublishableKey: z.string().optional(),
  stripeSecretKey: z.string().optional(),
  cashfreeAppId: z.string().optional(),
  cashfreeSecretKey: z.string().optional(),
  enableTestMode: z.boolean(),
});

// AI Model Schema
const aiConfigSchema = z.object({
  defaultProvider: z.enum(["openai", "anthropic", "google"]),
  openaiApiKey: z.string().optional(),
  anthropicApiKey: z.string().optional(),
  googleApiKey: z.string().optional(),
  defaultModel: z.string().min(1, "Model name required"),
  maxTokens: z.string().min(1, "Max tokens required"),
  temperature: z.string().min(1, "Temperature required"),
  enableAiFeatures: z.boolean(),
});

// System Preferences Schema
const systemConfigSchema = z.object({
  siteName: z.string().min(1, "Site name is required"),
  siteUrl: z.string().url("Valid URL required"),
  supportEmail: z.string().email("Valid email required"),
  companyAddress: z.string().optional(),
  gstNumber: z.string().optional(),
  invoiceTerms: z.string().optional(),
  maintenanceMode: z.boolean(),
  allowRegistration: z.boolean(),
  requireEmailVerification: z.boolean(),
  sessionTimeout: z.string().min(1, "Timeout required"),
  maxUploadSize: z.string().min(1, "Upload size required"),
});

type EmailConfig = z.infer<typeof emailConfigSchema>;
type PaymentConfig = z.infer<typeof paymentConfigSchema>;
type AiConfig = z.infer<typeof aiConfigSchema>;
type SystemConfig = z.infer<typeof systemConfigSchema>;

export function SystemConfiguration() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("email");

  // Fetch configurations
  const { data: configData, isLoading } = useQuery({
    queryKey: ["/api/admin/system-config"],
  });

  const config = configData as any;

  // Email Form
  const emailForm = useForm<EmailConfig>({
    resolver: zodResolver(emailConfigSchema),
    defaultValues: {
      smtpHost: config?.email?.smtpHost || "",
      smtpPort: config?.email?.smtpPort || "587",
      smtpUser: config?.email?.smtpUser || "",
      smtpPassword: "",
      fromEmail: config?.email?.fromEmail || "",
      fromName: config?.email?.fromName || "Rev Winner",
      enableEmailNotifications: config?.email?.enableEmailNotifications ?? true,
    },
  });

  // Payment Form
  const paymentForm = useForm<PaymentConfig>({
    resolver: zodResolver(paymentConfigSchema),
    defaultValues: {
      defaultGateway: config?.payment?.defaultGateway || "razorpay",
      razorpayKeyId: config?.payment?.razorpayKeyId || "",
      razorpayKeySecret: "",
      stripePublishableKey: config?.payment?.stripePublishableKey || "",
      stripeSecretKey: "",
      cashfreeAppId: config?.payment?.cashfreeAppId || "",
      cashfreeSecretKey: "",
      enableTestMode: config?.payment?.enableTestMode ?? true,
    },
  });

  // AI Form
  const aiForm = useForm<AiConfig>({
    resolver: zodResolver(aiConfigSchema),
    defaultValues: {
      defaultProvider: config?.ai?.defaultProvider || "openai",
      openaiApiKey: "",
      anthropicApiKey: "",
      googleApiKey: "",
      defaultModel: config?.ai?.defaultModel || "gpt-4",
      maxTokens: config?.ai?.maxTokens || "2000",
      temperature: config?.ai?.temperature || "0.7",
      enableAiFeatures: config?.ai?.enableAiFeatures ?? true,
    },
  });

  // System Form
  const systemForm = useForm<SystemConfig>({
    resolver: zodResolver(systemConfigSchema),
    defaultValues: {
      siteName: config?.system?.siteName || "",
      siteUrl: config?.system?.siteUrl || "",
      supportEmail: config?.system?.supportEmail || "",
      companyAddress: config?.system?.companyAddress || "",
      gstNumber: config?.system?.gstNumber || "",
      invoiceTerms: config?.system?.invoiceTerms || "",
      maintenanceMode: config?.system?.maintenanceMode ?? false,
      allowRegistration: config?.system?.allowRegistration ?? true,
      requireEmailVerification: config?.system?.requireEmailVerification ?? false,
      sessionTimeout: config?.system?.sessionTimeout || "3600",
      maxUploadSize: config?.system?.maxUploadSize || "10",
    },
  });

  // Update Configuration Mutation
  const updateConfigMutation = useMutation({
    mutationFn: async ({ section, data }: { section: string; data: any }) => {
      return await apiRequest("PUT", `/api/admin/system-config/${section}`, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system-config"] });
      toast({
        title: "Configuration updated",
        description: `${variables.section} settings have been saved successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update configuration",
        variant: "destructive",
      });
    },
  });

  const onEmailSubmit = (data: EmailConfig) => {
    updateConfigMutation.mutate({ section: "email", data });
  };

  const onPaymentSubmit = (data: PaymentConfig) => {
    updateConfigMutation.mutate({ section: "payment", data });
  };

  const onAiSubmit = (data: AiConfig) => {
    updateConfigMutation.mutate({ section: "ai", data });
  };

  const onSystemSubmit = (data: SystemConfig) => {
    updateConfigMutation.mutate({ section: "system", data });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="email">
            <Mail className="h-4 w-4 mr-2" />
            Email
          </TabsTrigger>
          <TabsTrigger value="payment">
            <CreditCard className="h-4 w-4 mr-2" />
            Payment
          </TabsTrigger>
          <TabsTrigger value="ai">
            <Brain className="h-4 w-4 mr-2" />
            AI Models
          </TabsTrigger>
          <TabsTrigger value="system">
            <Globe className="h-4 w-4 mr-2" />
            System
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Email Configuration */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>Configure SMTP settings and email notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...emailForm}>
                <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={emailForm.control}
                      name="smtpHost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SMTP Host</FormLabel>
                          <FormControl>
                            <Input placeholder="smtp.gmail.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={emailForm.control}
                      name="smtpPort"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SMTP Port</FormLabel>
                          <FormControl>
                            <Input placeholder="587" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={emailForm.control}
                      name="smtpUser"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SMTP Username</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="your-email@gmail.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={emailForm.control}
                      name="smtpPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SMTP Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormDescription>Leave blank to keep existing</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={emailForm.control}
                      name="fromEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>From Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="noreply@revwinner.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={emailForm.control}
                      name="fromName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>From Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Rev Winner" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={emailForm.control}
                    name="enableEmailNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Enable Email Notifications</FormLabel>
                          <FormDescription>
                            Send email notifications to users for important events
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={updateConfigMutation.isPending}>
                    {updateConfigMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <Save className="h-4 w-4 mr-2" />
                    Save Email Settings
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Configuration */}
        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle>Payment Gateway Configuration</CardTitle>
              <CardDescription>Configure payment processing settings</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...paymentForm}>
                <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)} className="space-y-4">
                  <FormField
                    control={paymentForm.control}
                    name="defaultGateway"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Payment Gateway</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gateway" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="razorpay">Razorpay</SelectItem>
                            <SelectItem value="stripe">Stripe</SelectItem>
                            <SelectItem value="cashfree">Cashfree</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Razorpay Settings */}
                  <div className="space-y-4 p-4 border rounded-lg">
                    <h3 className="font-semibold">Razorpay Settings</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={paymentForm.control}
                        name="razorpayKeyId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Key ID</FormLabel>
                            <FormControl>
                              <Input placeholder="rzp_test_..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={paymentForm.control}
                        name="razorpayKeySecret"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Key Secret</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormDescription>Leave blank to keep existing</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Stripe Settings */}
                  <div className="space-y-4 p-4 border rounded-lg">
                    <h3 className="font-semibold">Stripe Settings</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={paymentForm.control}
                        name="stripePublishableKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Publishable Key</FormLabel>
                            <FormControl>
                              <Input placeholder="pk_test_..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={paymentForm.control}
                        name="stripeSecretKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Secret Key</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormDescription>Leave blank to keep existing</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <FormField
                    control={paymentForm.control}
                    name="enableTestMode"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Enable Test Mode</FormLabel>
                          <FormDescription>
                            Use test API keys for development and testing
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={updateConfigMutation.isPending}>
                    {updateConfigMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <Save className="h-4 w-4 mr-2" />
                    Save Payment Settings
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Configuration */}
        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle>AI Model Configuration</CardTitle>
              <CardDescription>Configure AI providers and model settings</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...aiForm}>
                <form onSubmit={aiForm.handleSubmit(onAiSubmit)} className="space-y-4">
                  <FormField
                    control={aiForm.control}
                    name="defaultProvider"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default AI Provider</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select provider" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="openai">OpenAI</SelectItem>
                            <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                            <SelectItem value="google">Google (Gemini)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={aiForm.control}
                    name="openaiApiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>OpenAI API Key</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="sk-..." {...field} />
                        </FormControl>
                        <FormDescription>Leave blank to keep existing</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={aiForm.control}
                      name="defaultModel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Model</FormLabel>
                          <FormControl>
                            <Input placeholder="gpt-4" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={aiForm.control}
                      name="maxTokens"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Tokens</FormLabel>
                          <FormControl>
                            <Input placeholder="2000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={aiForm.control}
                      name="temperature"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Temperature</FormLabel>
                          <FormControl>
                            <Input placeholder="0.7" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={aiForm.control}
                    name="enableAiFeatures"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Enable AI Features</FormLabel>
                          <FormDescription>
                            Enable AI-powered features across the platform
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={updateConfigMutation.isPending}>
                    {updateConfigMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <Save className="h-4 w-4 mr-2" />
                    Save AI Settings
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Configuration */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>System Preferences</CardTitle>
              <CardDescription>Configure general system settings</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...systemForm}>
                <form onSubmit={systemForm.handleSubmit(onSystemSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={systemForm.control}
                      name="siteName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Site Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Rev Winner" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={systemForm.control}
                      name="siteUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Site URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://revwinner.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={systemForm.control}
                    name="supportEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Support Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="support@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={systemForm.control}
                    name="companyAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice: Company Address (optional)</FormLabel>
                        <FormControl>
                          <textarea
                            className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            placeholder="Address line 1&#10;Address line 2"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>Shown on PDF invoice. One line per line.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={systemForm.control}
                    name="gstNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice: GST Number (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="GSTIN or leave blank" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={systemForm.control}
                    name="invoiceTerms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice: Terms &amp; Conditions (optional)</FormLabel>
                        <FormControl>
                          <textarea
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            placeholder="One line per paragraph"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>One line per term. Leave empty for default terms.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={systemForm.control}
                      name="sessionTimeout"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Session Timeout (seconds)</FormLabel>
                          <FormControl>
                            <Input placeholder="3600" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={systemForm.control}
                      name="maxUploadSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Upload Size (MB)</FormLabel>
                          <FormControl>
                            <Input placeholder="10" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={systemForm.control}
                    name="maintenanceMode"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Maintenance Mode</FormLabel>
                          <FormDescription>
                            Temporarily disable access for maintenance
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={systemForm.control}
                    name="allowRegistration"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Allow Registration</FormLabel>
                          <FormDescription>
                            Allow new users to register accounts
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={systemForm.control}
                    name="requireEmailVerification"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Require Email Verification</FormLabel>
                          <FormDescription>
                            Users must verify email before accessing features
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={updateConfigMutation.isPending}>
                    {updateConfigMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <Save className="h-4 w-4 mr-2" />
                    Save System Settings
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Configuration */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Configure security and authentication settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <Shield className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Security Settings</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Advanced security settings coming soon
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
