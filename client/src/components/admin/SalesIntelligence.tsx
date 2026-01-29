import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Brain, Download, Plus, CheckCircle, TrendingUp, MessageSquare, Zap, FileText, Database, BarChart3 } from "lucide-react";
import { format } from "date-fns";

interface KnowledgeEntry {
  id: string;
  intentType: string;
  industry: string | null;
  persona: string | null;
  salesStage: string | null;
  suggestedResponse: string;
  followUpPrompt: string | null;
  usageCount: number;
  acceptanceCount: number;
  rejectionCount: number;
  performanceScore: number;
  isValidated: boolean;
  isActive: boolean;
  source: string;
  createdAt: string;
}

interface Analytics {
  totalSuggestions: number;
  acceptanceRate: number;
  topIntents: { intent: string; count: number }[];
  avgConfidence: number;
  avgLatency: number;
}

interface LearningLog {
  id: string;
  customerQuestion: string;
  detectedIntent: string;
  suggestedResponse: string;
  repUsedSuggestion: boolean | null;
  industry: string | null;
  persona: string | null;
  salesStage: string | null;
  canUseForMarketing: boolean;
  canUseForTraining: boolean;
  processingStatus: string;
  createdAt: string;
}

export function SalesIntelligence() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("analytics");
  const [showAddKnowledge, setShowAddKnowledge] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [knowledgeFilter, setKnowledgeFilter] = useState({ intentType: "", search: "" });
  const [exportForm, setExportForm] = useState({
    exportName: "",
    exportType: "knowledge" as "knowledge" | "suggestions" | "learning_logs" | "analytics",
    purpose: "",
    notes: ""
  });
  const [newKnowledge, setNewKnowledge] = useState({
    intentType: "",
    suggestedResponse: "",
    followUpPrompt: "",
    industry: "",
    persona: "",
    salesStage: "",
    triggerKeywords: "",
    notes: ""
  });

  const { data: intentTypes, error: intentTypesError } = useQuery<{ intentTypes: string[] }>({
    queryKey: ["/api/sales-intelligence/intent-types"],
    queryFn: async () => {
      const accessToken = localStorage.getItem("accessToken");
      const response = await fetch("/api/sales-intelligence/intent-types", {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch intent types");
      return response.json();
    },
  });

  const { data: analyticsData, isLoading: analyticsLoading, error: analyticsError } = useQuery<Analytics>({
    queryKey: ["/api/sales-intelligence/analytics"],
    queryFn: async () => {
      const accessToken = localStorage.getItem("accessToken");
      const response = await fetch("/api/sales-intelligence/analytics", {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch analytics");
      return response.json();
    },
  });

  const { data: knowledgeData, isLoading: knowledgeLoading, error: knowledgeError } = useQuery<{ knowledge: KnowledgeEntry[], intentTypes: string[] }>({
    queryKey: ["/api/sales-intelligence/knowledge", knowledgeFilter],
    queryFn: async () => {
      const accessToken = localStorage.getItem("accessToken");
      const params = new URLSearchParams();
      if (knowledgeFilter.intentType) params.append("intentType", knowledgeFilter.intentType);
      if (knowledgeFilter.search) params.append("search", knowledgeFilter.search);
      
      const response = await fetch(`/api/sales-intelligence/knowledge?${params.toString()}`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch knowledge store");
      return response.json();
    },
  });

  const { data: learningLogsData, isLoading: logsLoading, error: logsError } = useQuery<{ logs: LearningLog[], total: number }>({
    queryKey: ["/api/sales-intelligence/learning-logs"],
    queryFn: async () => {
      const accessToken = localStorage.getItem("accessToken");
      const response = await fetch("/api/sales-intelligence/learning-logs", {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch learning logs");
      return response.json();
    },
  });

  const { data: exportsData, error: exportsError } = useQuery<{ exports: any[] }>({
    queryKey: ["/api/sales-intelligence/exports"],
    queryFn: async () => {
      const accessToken = localStorage.getItem("accessToken");
      const response = await fetch("/api/sales-intelligence/exports", {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch exports");
      return response.json();
    },
  });

  const addKnowledgeMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/sales-intelligence/knowledge", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Knowledge entry added successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/sales-intelligence/knowledge"] });
      setShowAddKnowledge(false);
      setNewKnowledge({
        intentType: "",
        suggestedResponse: "",
        followUpPrompt: "",
        industry: "",
        persona: "",
        salesStage: "",
        triggerKeywords: "",
        notes: ""
      });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to add knowledge", variant: "destructive" });
    }
  });

  const validateKnowledgeMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/sales-intelligence/knowledge/${id}/validate`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Knowledge entry validated" });
      queryClient.invalidateQueries({ queryKey: ["/api/sales-intelligence/knowledge"] });
    }
  });

  const exportMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/sales-intelligence/export", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "Export Complete", description: `Exported ${data.recordCount} records` });
      queryClient.invalidateQueries({ queryKey: ["/api/sales-intelligence/exports"] });
      setShowExportDialog(false);
      
      const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${exportForm.exportName.replace(/\s+/g, "_")}_${format(new Date(), "yyyyMMdd")}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
    onError: (error: any) => {
      toast({ title: "Export Failed", description: error.message, variant: "destructive" });
    }
  });

  const handleAddKnowledge = () => {
    const keywords = newKnowledge.triggerKeywords.split(",").map(k => k.trim()).filter(k => k);
    addKnowledgeMutation.mutate({
      ...newKnowledge,
      triggerKeywords: keywords,
      industry: newKnowledge.industry || undefined,
      persona: newKnowledge.persona || undefined,
      salesStage: newKnowledge.salesStage || undefined,
      followUpPrompt: newKnowledge.followUpPrompt || undefined,
      notes: newKnowledge.notes || undefined
    });
  };

  const handleExport = () => {
    exportMutation.mutate(exportForm);
  };

  const formatIntentType = (intent: string) => {
    return intent.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {(analyticsError || knowledgeError || logsError || exportsError || intentTypesError) && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-200">
            <strong>Error loading data:</strong> {
              (analyticsError as Error)?.message || 
              (knowledgeError as Error)?.message || 
              (logsError as Error)?.message || 
              (exportsError as Error)?.message ||
              (intentTypesError as Error)?.message
            }
          </p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-600" />
            Sales Intelligence Agent
          </h2>
          <p className="text-muted-foreground">Manage knowledge store, view analytics, and export data for research</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2" data-testid="button-export-data">
                <Download className="h-4 w-4" />
                Export Data
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Export Intelligence Data</DialogTitle>
                <DialogDescription>Export data for research, marketing, or training purposes</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Export Name</Label>
                  <Input
                    value={exportForm.exportName}
                    onChange={(e) => setExportForm(f => ({ ...f, exportName: e.target.value }))}
                    placeholder="e.g., Q4 2024 Marketing Data"
                    data-testid="input-export-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Export Type</Label>
                  <Select value={exportForm.exportType} onValueChange={(v: any) => setExportForm(f => ({ ...f, exportType: v }))}>
                    <SelectTrigger data-testid="select-export-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="knowledge">Knowledge Store</SelectItem>
                      <SelectItem value="suggestions">Suggestions History</SelectItem>
                      <SelectItem value="learning_logs">Learning Logs</SelectItem>
                      <SelectItem value="analytics">Analytics Summary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Purpose</Label>
                  <Select value={exportForm.purpose} onValueChange={(v) => setExportForm(f => ({ ...f, purpose: v }))}>
                    <SelectTrigger data-testid="select-export-purpose">
                      <SelectValue placeholder="Select purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="research">Research & Analysis</SelectItem>
                      <SelectItem value="marketing">Marketing Insights</SelectItem>
                      <SelectItem value="training">AI Training Data</SelectItem>
                      <SelectItem value="analytics">Business Analytics</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Textarea
                    value={exportForm.notes}
                    onChange={(e) => setExportForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Additional notes about this export..."
                    data-testid="input-export-notes"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowExportDialog(false)}>Cancel</Button>
                <Button 
                  onClick={handleExport} 
                  disabled={!exportForm.exportName || !exportForm.purpose || exportMutation.isPending}
                  data-testid="button-confirm-export"
                >
                  {exportMutation.isPending ? "Exporting..." : "Export"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analytics" className="gap-2" data-testid="tab-analytics">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="gap-2" data-testid="tab-knowledge">
            <Database className="h-4 w-4" />
            Knowledge Store
          </TabsTrigger>
          <TabsTrigger value="learning" className="gap-2" data-testid="tab-learning">
            <Brain className="h-4 w-4" />
            Learning Logs
          </TabsTrigger>
          <TabsTrigger value="exports" className="gap-2" data-testid="tab-exports">
            <FileText className="h-4 w-4" />
            Export History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-4">
          {analyticsLoading ? (
            <div className="text-center py-8">Loading analytics...</div>
          ) : analyticsData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Suggestions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-purple-600" />
                    {analyticsData.totalSuggestions}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Acceptance Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    {analyticsData.acceptanceRate}%
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Avg Confidence</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-600" />
                    {analyticsData.avgConfidence}%
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Avg Latency</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analyticsData.avgLatency}ms</div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2 lg:col-span-4">
                <CardHeader>
                  <CardTitle>Top Intent Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analyticsData.topIntents.map((item, i) => (
                      <Badge key={i} variant="secondary" className="text-sm py-1 px-3">
                        {formatIntentType(item.intent)}: {item.count}
                      </Badge>
                    ))}
                    {analyticsData.topIntents.length === 0 && (
                      <p className="text-muted-foreground">No suggestions recorded yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No analytics data available</div>
          )}
        </TabsContent>

        <TabsContent value="knowledge" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-2 flex-1">
              <Select value={knowledgeFilter.intentType} onValueChange={(v) => setKnowledgeFilter(f => ({ ...f, intentType: v === "all" ? "" : v }))}>
                <SelectTrigger className="w-[200px]" data-testid="filter-intent-type">
                  <SelectValue placeholder="Filter by intent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Intents</SelectItem>
                  {(intentTypes?.intentTypes || []).map((type: string) => (
                    <SelectItem key={type} value={type}>{formatIntentType(type)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Search responses..."
                value={knowledgeFilter.search}
                onChange={(e) => setKnowledgeFilter(f => ({ ...f, search: e.target.value }))}
                className="max-w-xs"
                data-testid="search-knowledge"
              />
            </div>
            <Dialog open={showAddKnowledge} onOpenChange={setShowAddKnowledge}>
              <DialogTrigger asChild>
                <Button className="gap-2" data-testid="button-add-knowledge">
                  <Plus className="h-4 w-4" />
                  Add Knowledge
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add Knowledge Entry</DialogTitle>
                  <DialogDescription>Add a new validated response to the knowledge store</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Intent Type *</Label>
                      <Select value={newKnowledge.intentType} onValueChange={(v) => setNewKnowledge(k => ({ ...k, intentType: v }))}>
                        <SelectTrigger data-testid="input-intent-type">
                          <SelectValue placeholder="Select intent type" />
                        </SelectTrigger>
                        <SelectContent>
                          {(intentTypes?.intentTypes || []).map((type: string) => (
                            <SelectItem key={type} value={type}>{formatIntentType(type)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Industry (optional)</Label>
                      <Input
                        value={newKnowledge.industry}
                        onChange={(e) => setNewKnowledge(k => ({ ...k, industry: e.target.value }))}
                        placeholder="e.g., Healthcare, Finance"
                        data-testid="input-industry"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Persona (optional)</Label>
                      <Input
                        value={newKnowledge.persona}
                        onChange={(e) => setNewKnowledge(k => ({ ...k, persona: e.target.value }))}
                        placeholder="e.g., CTO, Sales Director"
                        data-testid="input-persona"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Sales Stage (optional)</Label>
                      <Input
                        value={newKnowledge.salesStage}
                        onChange={(e) => setNewKnowledge(k => ({ ...k, salesStage: e.target.value }))}
                        placeholder="e.g., Discovery, Negotiation"
                        data-testid="input-sales-stage"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Suggested Response *</Label>
                    <Textarea
                      value={newKnowledge.suggestedResponse}
                      onChange={(e) => setNewKnowledge(k => ({ ...k, suggestedResponse: e.target.value }))}
                      placeholder="The response that will be suggested to sales reps..."
                      rows={3}
                      data-testid="input-suggested-response"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Follow-up Prompt (optional)</Label>
                    <Input
                      value={newKnowledge.followUpPrompt}
                      onChange={(e) => setNewKnowledge(k => ({ ...k, followUpPrompt: e.target.value }))}
                      placeholder="Optional follow-up question to advance the conversation"
                      data-testid="input-followup-prompt"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Trigger Keywords (comma-separated)</Label>
                    <Input
                      value={newKnowledge.triggerKeywords}
                      onChange={(e) => setNewKnowledge(k => ({ ...k, triggerKeywords: e.target.value }))}
                      placeholder="e.g., price, cost, budget, discount"
                      data-testid="input-trigger-keywords"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Notes (optional)</Label>
                    <Textarea
                      value={newKnowledge.notes}
                      onChange={(e) => setNewKnowledge(k => ({ ...k, notes: e.target.value }))}
                      placeholder="Internal notes about this response..."
                      rows={2}
                      data-testid="input-notes"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddKnowledge(false)}>Cancel</Button>
                  <Button 
                    onClick={handleAddKnowledge}
                    disabled={!newKnowledge.intentType || !newKnowledge.suggestedResponse || addKnowledgeMutation.isPending}
                    data-testid="button-save-knowledge"
                  >
                    {addKnowledgeMutation.isPending ? "Saving..." : "Save Knowledge"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {knowledgeLoading ? (
            <div className="text-center py-8">Loading knowledge store...</div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Intent</TableHead>
                      <TableHead>Response</TableHead>
                      <TableHead>Context</TableHead>
                      <TableHead>Performance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(knowledgeData?.knowledge || []).map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <Badge variant="outline">{formatIntentType(entry.intentType)}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate" title={entry.suggestedResponse}>
                          {entry.suggestedResponse.substring(0, 80)}...
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-muted-foreground space-y-1">
                            {entry.industry && <div>Industry: {entry.industry}</div>}
                            {entry.persona && <div>Persona: {entry.persona}</div>}
                            {entry.salesStage && <div>Stage: {entry.salesStage}</div>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>Score: {entry.performanceScore}</div>
                            <div className="text-xs text-muted-foreground">
                              {entry.acceptanceCount}/{entry.usageCount} used
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {entry.isValidated ? (
                              <Badge className="bg-green-100 text-green-800">Validated</Badge>
                            ) : (
                              <Badge variant="secondary">Pending</Badge>
                            )}
                            {!entry.isActive && (
                              <Badge variant="destructive">Inactive</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {!entry.isValidated && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => validateKnowledgeMutation.mutate(entry.id)}
                              disabled={validateKnowledgeMutation.isPending}
                              data-testid={`button-validate-${entry.id}`}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(knowledgeData?.knowledge || []).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No knowledge entries yet. Add your first entry to start building the knowledge store.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="learning" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Learning Logs</CardTitle>
              <CardDescription>Post-call learning data for research and AI training</CardDescription>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="text-center py-8">Loading learning logs...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer Question</TableHead>
                      <TableHead>Intent</TableHead>
                      <TableHead>Rep Used</TableHead>
                      <TableHead>Context</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(learningLogsData?.logs || []).map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="max-w-xs truncate" title={log.customerQuestion}>
                          {log.customerQuestion.substring(0, 60)}...
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{formatIntentType(log.detectedIntent)}</Badge>
                        </TableCell>
                        <TableCell>
                          {log.repUsedSuggestion === true && <Badge className="bg-green-100 text-green-800">Yes</Badge>}
                          {log.repUsedSuggestion === false && <Badge variant="secondary">No</Badge>}
                          {log.repUsedSuggestion === null && <Badge variant="outline">Unknown</Badge>}
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-muted-foreground">
                            {log.industry && <div>{log.industry}</div>}
                            {log.persona && <div>{log.persona}</div>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {log.canUseForMarketing && <Badge variant="outline" className="text-xs">Marketing</Badge>}
                            {log.canUseForTraining && <Badge variant="outline" className="text-xs">Training</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(log.createdAt), "MMM d, yyyy")}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(learningLogsData?.logs || []).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No learning logs yet. Data will appear here after sales calls with suggestions.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export History</CardTitle>
              <CardDescription>Previous data exports for research and marketing</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Export Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(exportsData?.exports || []).map((exp: any) => (
                    <TableRow key={exp.id}>
                      <TableCell className="font-medium">{exp.exportName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{exp.exportType}</Badge>
                      </TableCell>
                      <TableCell>{exp.purpose}</TableCell>
                      <TableCell>{exp.recordCount}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(exp.createdAt), "MMM d, yyyy HH:mm")}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(exportsData?.exports || []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No exports yet. Use the "Export Data" button to create your first export.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
