import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Key, Plus, Copy, Eye, EyeOff, Trash2, RotateCcw, Clock, Shield, Activity, Loader2, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

const createApiKeySchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  rateLimit: z.coerce.number().min(1).max(100000).default(1000),
  rateLimitWindow: z.enum(["minute", "hour", "day"]).default("hour"),
  expiresAt: z.string().optional(),
  ipWhitelist: z.string().optional(),
});

type CreateApiKeyForm = z.infer<typeof createApiKeySchema>;

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  createdBy: string;
  organizationId: string | null;
  scopes: string[];
  rateLimit: number;
  rateLimitWindow: string;
  status: string;
  lastUsedAt: string | null;
  usageCount: number;
  expiresAt: string | null;
  ipWhitelist: string[] | null;
  createdAt: string;
  revokedAt: string | null;
  creatorEmail: string;
  creatorFirstName: string;
  creatorLastName: string;
}

interface UsageLog {
  id: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

interface UsageStats {
  totalRequests: number;
  avgResponseTime: number;
  successCount: number;
  errorCount: number;
}

export function ApiKeysManagement() {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [showKeyValue, setShowKeyValue] = useState(false);
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);
  const [revokeKeyId, setRevokeKeyId] = useState<string | null>(null);
  const [deleteKeyId, setDeleteKeyId] = useState<string | null>(null);

  const form = useForm<CreateApiKeyForm>({
    resolver: zodResolver(createApiKeySchema),
    defaultValues: {
      name: "",
      rateLimit: 1000,
      rateLimitWindow: "hour",
      expiresAt: "",
      ipWhitelist: "",
    },
  });

  const { data: apiKeys, isLoading } = useQuery<ApiKey[]>({
    queryKey: ["/api/api-keys"],
  });

  const { data: usageData, isLoading: usageLoading } = useQuery<{ logs: UsageLog[]; stats: UsageStats }>({
    queryKey: ["/api/api-keys", selectedKeyId, "usage"],
    enabled: !!selectedKeyId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateApiKeyForm) => {
      const payload: any = {
        name: data.name,
        rateLimit: data.rateLimit,
        rateLimitWindow: data.rateLimitWindow,
        scopes: ["read", "write"],
      };
      if (data.expiresAt) payload.expiresAt = data.expiresAt;
      if (data.ipWhitelist) {
        payload.ipWhitelist = data.ipWhitelist.split(",").map((ip: string) => ip.trim()).filter(Boolean);
      }
      const res = await apiRequest("POST", "/api/api-keys", payload);
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: (data) => {
      setNewApiKey(data.apiKey);
      setShowKeyValue(true);
      toast({ title: "API Key Created", description: "Store the key securely - it won't be shown again." });
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
      form.reset();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/api-keys/${id}/revoke`);
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "API Key Revoked", description: "The API key has been revoked." });
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
      setRevokeKeyId(null);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/api-keys/${id}/reactivate`);
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "API Key Reactivated", description: "The API key is now active." });
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/api-keys/${id}`);
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "API Key Deleted", description: "The API key has been permanently deleted." });
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
      setDeleteKeyId(null);
      if (selectedKeyId === deleteKeyId) setSelectedKeyId(null);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "API key copied to clipboard" });
  };

  const onSubmit = (data: CreateApiKeyForm) => {
    createMutation.mutate(data);
  };

  const getStatusBadge = (key: ApiKey) => {
    if (key.status === "revoked") {
      return <Badge variant="destructive" data-testid={`status-revoked-${key.id}`}>Revoked</Badge>;
    }
    if (key.expiresAt && new Date(key.expiresAt) < new Date()) {
      return <Badge variant="secondary" data-testid={`status-expired-${key.id}`}>Expired</Badge>;
    }
    return <Badge variant="default" className="bg-green-600" data-testid={`status-active-${key.id}`}>Active</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">API Keys</h2>
          <p className="text-muted-foreground">Generate and manage API keys for client integrations</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-api-key">
          <Plus className="h-4 w-4 mr-2" />
          Generate New Key
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Keys</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-keys">{apiKeys?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Keys</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-active-keys">
              {apiKeys?.filter(k => k.status === "active" && (!k.expiresAt || new Date(k.expiresAt) > new Date())).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total API Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-calls">
              {apiKeys?.reduce((sum, k) => sum + (k.usageCount || 0), 0) || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="keys" className="space-y-4">
        <TabsList>
          <TabsTrigger value="keys" data-testid="tab-keys">
            <Key className="h-4 w-4 mr-2" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="usage" disabled={!selectedKeyId} data-testid="tab-usage">
            <Activity className="h-4 w-4 mr-2" />
            Usage Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="keys">
          <Card>
            <CardHeader>
              <CardTitle>All API Keys</CardTitle>
              <CardDescription>Click on a key to view usage details</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : apiKeys && apiKeys.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Key Prefix</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Rate Limit</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Last Used</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiKeys.map((key) => (
                      <TableRow
                        key={key.id}
                        className={`cursor-pointer ${selectedKeyId === key.id ? "bg-muted" : ""}`}
                        onClick={() => setSelectedKeyId(key.id)}
                        data-testid={`row-api-key-${key.id}`}
                      >
                        <TableCell className="font-medium" data-testid={`text-key-name-${key.id}`}>{key.name}</TableCell>
                        <TableCell>
                          <code className="text-sm bg-muted px-2 py-1 rounded" data-testid={`text-key-prefix-${key.id}`}>
                            {key.keyPrefix}...
                          </code>
                        </TableCell>
                        <TableCell>{getStatusBadge(key)}</TableCell>
                        <TableCell data-testid={`text-rate-limit-${key.id}`}>
                          {key.rateLimit}/{key.rateLimitWindow}
                        </TableCell>
                        <TableCell data-testid={`text-usage-count-${key.id}`}>{key.usageCount || 0} calls</TableCell>
                        <TableCell data-testid={`text-last-used-${key.id}`}>
                          {key.lastUsedAt ? format(new Date(key.lastUsedAt), "MMM d, yyyy HH:mm") : "Never"}
                        </TableCell>
                        <TableCell data-testid={`text-created-at-${key.id}`}>
                          {format(new Date(key.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {key.status === "active" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); setRevokeKeyId(key.id); }}
                                data-testid={`button-revoke-${key.id}`}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            ) : key.status === "revoked" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); reactivateMutation.mutate(key.id); }}
                                data-testid={`button-reactivate-${key.id}`}
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            ) : null}
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); setDeleteKeyId(key.id); }}
                              data-testid={`button-delete-${key.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No API keys yet</p>
                  <p className="text-sm">Create your first API key to enable client integrations</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage">
          {selectedKeyId && (
            <Card>
              <CardHeader>
                <CardTitle>Usage Logs</CardTitle>
                <CardDescription>
                  Recent API calls for {apiKeys?.find(k => k.id === selectedKeyId)?.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {usageLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : usageData ? (
                  <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-4">
                      <Card>
                        <CardContent className="pt-4">
                          <div className="text-sm text-muted-foreground">Total Requests</div>
                          <div className="text-2xl font-bold">{usageData.stats?.totalRequests || 0}</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4">
                          <div className="text-sm text-muted-foreground">Avg Response Time</div>
                          <div className="text-2xl font-bold">{Math.round(usageData.stats?.avgResponseTime || 0)}ms</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4">
                          <div className="text-sm text-muted-foreground">Success Rate</div>
                          <div className="text-2xl font-bold text-green-600">
                            {usageData.stats?.totalRequests
                              ? Math.round((Number(usageData.stats.successCount) / Number(usageData.stats.totalRequests)) * 100)
                              : 0}%
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4">
                          <div className="text-sm text-muted-foreground">Errors</div>
                          <div className="text-2xl font-bold text-red-600">{usageData.stats?.errorCount || 0}</div>
                        </CardContent>
                      </Card>
                    </div>

                    {usageData.logs && usageData.logs.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Endpoint</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Response Time</TableHead>
                            <TableHead>IP Address</TableHead>
                            <TableHead>Time</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {usageData.logs.map((log) => (
                            <TableRow key={log.id}>
                              <TableCell className="font-mono text-sm">{log.endpoint}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{log.method}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={log.statusCode < 400 ? "default" : "destructive"}>
                                  {log.statusCode}
                                </Badge>
                              </TableCell>
                              <TableCell>{log.responseTime}ms</TableCell>
                              <TableCell className="font-mono text-sm">{log.ipAddress}</TableCell>
                              <TableCell>{format(new Date(log.createdAt), "MMM d, HH:mm:ss")}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No usage logs yet</p>
                      </div>
                    )}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Generate New API Key</DialogTitle>
            <DialogDescription>
              Create a new API key for client integration. Store the key securely after creation.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Key Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Production API Key" {...field} data-testid="input-key-name" />
                    </FormControl>
                    <FormDescription>A descriptive name to identify this key</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="rateLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rate Limit</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} data-testid="input-rate-limit" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rateLimitWindow"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Per</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-rate-window">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="minute">Minute</SelectItem>
                          <SelectItem value="hour">Hour</SelectItem>
                          <SelectItem value="day">Day</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="expiresAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiration Date (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-expires-at" />
                    </FormControl>
                    <FormDescription>Leave empty for no expiration</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ipWhitelist"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IP Whitelist (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="192.168.1.1, 10.0.0.1"
                        {...field}
                        data-testid="input-ip-whitelist"
                      />
                    </FormControl>
                    <FormDescription>Comma-separated list of allowed IP addresses</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-create">
                  {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Generate Key
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!newApiKey} onOpenChange={() => { setNewApiKey(null); setShowKeyValue(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              API Key Generated
            </DialogTitle>
            <DialogDescription>
              Copy this key now. For security, it will not be shown again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                type={showKeyValue ? "text" : "password"}
                value={newApiKey || ""}
                readOnly
                className="font-mono"
                data-testid="input-new-api-key"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowKeyValue(!showKeyValue)}
                data-testid="button-toggle-key-visibility"
              >
                {showKeyValue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(newApiKey || "")}
                data-testid="button-copy-key"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Shield className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800 dark:text-amber-200">
                  <p className="font-medium">Security Warning</p>
                  <p>Store this API key securely. Anyone with this key can access the Rev Winner API on behalf of your organization.</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => { setNewApiKey(null); setShowKeyValue(false); setShowCreateDialog(false); }} data-testid="button-close-key-dialog">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!revokeKeyId} onOpenChange={() => setRevokeKeyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately disable the API key. Any applications using this key will lose access. You can reactivate it later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => revokeKeyId && revokeMutation.mutate(revokeKeyId)}
              className="bg-orange-600 hover:bg-orange-700"
              data-testid="button-confirm-revoke"
            >
              Revoke Key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteKeyId} onOpenChange={() => setDeleteKeyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the API key and all its usage history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteKeyId && deleteMutation.mutate(deleteKeyId)}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-delete"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
