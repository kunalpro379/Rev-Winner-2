import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { HamburgerNav } from "@/components/hamburger-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, Plus, FileText, Link as LinkIcon, Trash2, Upload, Loader2, CheckCircle2, AlertCircle, FileIcon, Sparkles, Lock, BookOpen, RefreshCw, Package, DollarSign, Settings, HelpCircle, Trophy, Target, MessageSquare, Star, Plug } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

const domainSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be 100 characters or less"),
  description: z.string().optional(),
});

type DomainFormData = z.infer<typeof domainSchema>;

const urlSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
});

type UrlFormData = z.infer<typeof urlSchema>;

interface DomainExpertise {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TrainingDocument {
  id: string;
  domainExpertiseId: string;
  userId: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  content: string | null;
  summary: string[] | null;
  summaryStatus: string | null;
  summaryError: string | null;
  lastSummarizedAt: string | null;
  processingStatus: string;
  processingError: string | null;
  metadata: Record<string, any>;
  uploadedAt: string;
}

interface TrainMeStatus {
  active: boolean;
  purchaseDate: string | null;
  daysRemaining: number;
  expiryDate: string | null;
}

interface KnowledgeEntry {
  id: string;
  domainExpertiseId: string;
  userId: string;
  category: string;
  title: string;
  content: string;
  details: Record<string, any>;
  keywords: string[] | null;
  sourceDocumentIds: string[] | null;
  contentHash: string | null;
  confidence: number | null;
  isVerified: boolean | null;
  usageCount: number | null;
  createdAt: string;
  updatedAt: string;
}

const categoryIcons: Record<string, any> = {
  product: Package,
  pricing: DollarSign,
  process: Settings,
  faq: HelpCircle,
  case_study: Trophy,
  competitor: Target,
  pain_point: AlertCircle,
  objection: MessageSquare,
  feature: Star,
  integration: Plug,
};

const categoryLabels: Record<string, string> = {
  product: "Products & Services",
  pricing: "Pricing",
  process: "Processes",
  faq: "FAQs",
  case_study: "Case Studies",
  competitor: "Competitors",
  pain_point: "Pain Points",
  objection: "Objections",
  feature: "Features",
  integration: "Integrations",
};

export default function TrainMe() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [urlDialogOpen, setUrlDialogOpen] = useState(false);
  const [selectedDomainForUrl, setSelectedDomainForUrl] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<Record<string, FileList | null>>({});

  // Check Train Me subscription status
  const { data: trainMeStatus, isLoading: isLoadingTrainMe } = useQuery<TrainMeStatus>({
    queryKey: ['/api/train-me/status'],
  });

  const { data: domains, isLoading: domainsLoading, error: domainsError } = useQuery<DomainExpertise[]>({
    queryKey: ['/api/domain-expertise'],
    retry: false, // Don't retry on 403
  });

  const createDomainForm = useForm<DomainFormData>({
    resolver: zodResolver(domainSchema),
    defaultValues: { name: "", description: "" },
  });

  const urlForm = useForm<UrlFormData>({
    resolver: zodResolver(urlSchema),
    defaultValues: { url: "" },
  });

  const createDomainMutation = useMutation({
    mutationFn: async (data: DomainFormData) => 
      apiRequest('POST', '/api/domain-expertise', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/domain-expertise'] });
      toast({ title: "Domain created", description: "Your domain expertise profile has been created successfully." });
      setCreateDialogOpen(false);
      createDomainForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create domain", variant: "destructive" });
    },
  });

  const uploadFileMutation = useMutation({
    mutationFn: async ({ domainId, files }: { domainId: string; files: FileList }) => {
      const formData = new FormData();
      // Append all files with the same field name 'files'
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }
      
      // Get access token from localStorage for authentication
      const accessToken = localStorage.getItem("accessToken");
      const headers: Record<string, string> = {};
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }
      
      return fetch(`/api/domain-expertise/${domainId}/documents`, {
        method: 'POST',
        body: formData,
        headers,
      }).then(res => {
        if (!res.ok) throw new Error('Upload failed');
        return res.json();
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/domain-expertise', variables.domainId, 'documents'] });
      
      // Handle partial failures
      const uploaded = data.uploaded || [];
      const errors = data.errors || [];
      
      if (uploaded.length > 0 && errors.length === 0) {
        // All files uploaded successfully
        toast({ 
          title: "Files uploaded", 
          description: `${uploaded.length} file(s) uploaded successfully. Processing...` 
        });
      } else if (uploaded.length > 0 && errors.length > 0) {
        // Partial success
        toast({ 
          title: "Partial upload", 
          description: `${uploaded.length} file(s) uploaded, ${errors.length} failed. Check failed files.`,
          variant: "default"
        });
        // Show individual errors
        errors.forEach((err: any) => {
          toast({
            title: `Failed: ${err.fileName}`,
            description: err.error,
            variant: "destructive"
          });
        });
      } else if (errors.length > 0) {
        // All files failed
        toast({ 
          title: "Upload failed", 
          description: `All ${errors.length} file(s) failed to upload`,
          variant: "destructive"
        });
        errors.forEach((err: any) => {
          toast({
            title: `Failed: ${err.fileName}`,
            description: err.error,
            variant: "destructive"
          });
        });
      }
      
      setSelectedFiles(prev => ({ ...prev, [variables.domainId]: null }));
    },
    onError: (error: any) => {
      toast({ title: "Upload failed", description: error.message || "Failed to upload files", variant: "destructive" });
    },
  });

  const addUrlMutation = useMutation({
    mutationFn: async ({ domainId, url }: { domainId: string; url: string }) =>
      apiRequest('POST', `/api/domain-expertise/${domainId}/documents/url`, { url }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/domain-expertise', variables.domainId, 'documents'] });
      toast({ title: "URL added", description: "Your URL is being processed..." });
      setUrlDialogOpen(false);
      urlForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to add URL", variant: "destructive" });
    },
  });

  const deleteDomainMutation = useMutation({
    mutationFn: async (domainId: string) =>
      apiRequest('DELETE', `/api/domain-expertise/${domainId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/domain-expertise'] });
      toast({ title: "Domain deleted", description: "Domain and all documents have been deleted." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete domain", variant: "destructive" });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async ({ domainId, docId }: { domainId: string; docId: string }) =>
      apiRequest('DELETE', `/api/domain-expertise/${domainId}/documents/${docId}`),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/domain-expertise', variables.domainId, 'documents'] });
      toast({ title: "Document deleted", description: "Document has been removed successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete document", variant: "destructive" });
    },
  });

  const replaceDocumentMutation = useMutation({
    mutationFn: async ({ domainId, docId, file }: { domainId: string; docId: string; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const accessToken = localStorage.getItem("accessToken");
      const headers: Record<string, string> = {};
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }
      
      return fetch(`/api/domain-expertise/${domainId}/documents/${docId}/replace`, {
        method: 'POST',
        body: formData,
        headers,
      }).then(res => {
        if (!res.ok) throw new Error('Replace failed');
        return res.json();
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/domain-expertise', variables.domainId, 'documents'] });
      toast({ title: "Document replaced", description: "Document has been updated with new content." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to replace document", variant: "destructive" });
    },
  });

  const handleFileSelect = (domainId: string, files: FileList | null) => {
    setSelectedFiles(prev => ({ ...prev, [domainId]: files }));
  };

  const handleFileUpload = (domainId: string) => {
    const files = selectedFiles[domainId];
    if (files && files.length > 0) {
      uploadFileMutation.mutate({ domainId, files });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"><CheckCircle2 className="w-3 h-3 mr-1" />Complete</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Processing</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"><AlertCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Pending</Badge>;
    }
  };

  if (isLoadingTrainMe || domainsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30 dark:bg-gradient-to-br dark:from-slate-950 dark:via-purple-950 dark:to-slate-900">
        <HamburgerNav currentPath="/train-me" />
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  // Show subscription required message if not subscribed
  if (!trainMeStatus?.active) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30 dark:bg-gradient-to-br dark:from-slate-950 dark:via-purple-950 dark:to-slate-900">
        <HamburgerNav currentPath="/train-me" />
        <div className="max-w-4xl mx-auto px-6 py-12">
          <Card className="border-2 border-dashed border-purple-200 dark:border-purple-800">
            <CardContent className="p-12 text-center">
              <div className="mx-auto mb-6 p-4 bg-purple-100 dark:bg-purple-900/30 rounded-full w-fit">
                <Lock className="w-12 h-12 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Train Me Subscription Required</h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Train Me is a premium add-on that allows you to upload your product knowledge, case studies, and documentation to enhance AI responses with domain-specific information.
              </p>
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg p-6 mb-6 border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold text-foreground mb-3">What's Included:</h3>
                <ul className="text-sm space-y-2 text-muted-foreground text-left max-w-xl mx-auto">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">✓</span>
                    <span>Create up to 5 domain expertise profiles</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">✓</span>
                    <span>Upload up to 100 documents per domain (PDF, DOC, DOCX, TXT, XLS, XLSX, CSV, PPT, PPTX)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">✓</span>
                    <span>Train AI with your specific product knowledge and pricing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">✓</span>
                    <span>Get accurate, domain-specific answers during sales calls</span>
                  </li>
                </ul>
                <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold mt-4">
                  30 days of access from purchase date
                </p>
              </div>
              <Button
                onClick={() => setLocation("/profile")}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                data-testid="button-go-to-profile"
              >
                Go to Profile to Subscribe
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30 dark:bg-gradient-to-br dark:from-slate-950 dark:via-purple-950 dark:to-slate-900">
      <HamburgerNav currentPath="/train-me" />
      
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <GraduationCap className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              Train Me
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Upload your product knowledge, case studies, and documentation to enhance AI responses
            </p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-domain" className="bg-gradient-to-r from-purple-600 to-pink-600">
                <Plus className="w-4 h-4 mr-2" />
                New Domain
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Domain Expertise</DialogTitle>
                <DialogDescription>
                  Create a new knowledge domain. You can upload up to 100 documents per domain.
                </DialogDescription>
              </DialogHeader>
              <Form {...createDomainForm}>
                <form onSubmit={createDomainForm.handleSubmit((data) => createDomainMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={createDomainForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Domain Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Product Documentation, Sales Playbook" {...field} data-testid="input-domain-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createDomainForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Describe what this domain covers..." {...field} data-testid="input-domain-description" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createDomainMutation.isPending} data-testid="button-submit-domain">
                      {createDomainMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Create Domain
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Info Alert */}
        <Alert>
          <AlertDescription>
            Upload documents (PDF, DOC, TXT, XLS), images, or audio files (MP3, WAV, M4A) to train the AI on your specific product knowledge. Audio files will be automatically transcribed. The AI will prioritize this information when generating responses.
          </AlertDescription>
        </Alert>

        {/* Domains List */}
        {!domains || domains.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <GraduationCap className="w-16 h-16 text-slate-400 dark:text-slate-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No domains yet</h3>
              <p className="text-slate-600 dark:text-slate-400 text-center mb-4">
                Create your first domain expertise to start uploading training materials
              </p>
              <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-first-domain" className="bg-gradient-to-r from-purple-600 to-pink-600">
                <Plus className="w-4 h-4 mr-2" />
                Create First Domain
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {domains.map((domain) => (
              <DomainCard
                key={domain.id}
                domain={domain}
                selectedFile={selectedFiles[domain.id]}
                onFileSelect={(files) => handleFileSelect(domain.id, files)}
                onFileUpload={() => handleFileUpload(domain.id)}
                onAddUrl={(url) => addUrlMutation.mutate({ domainId: domain.id, url })}
                onDeleteDomain={() => deleteDomainMutation.mutate(domain.id)}
                onDeleteDocument={(docId) => deleteDocumentMutation.mutate({ domainId: domain.id, docId })}
                onReplaceDocument={(docId, file) => replaceDocumentMutation.mutate({ domainId: domain.id, docId, file })}
                uploadPending={uploadFileMutation.isPending}
                urlDialogOpen={urlDialogOpen && selectedDomainForUrl === domain.id}
                setUrlDialogOpen={(open) => {
                  setUrlDialogOpen(open);
                  if (open) setSelectedDomainForUrl(domain.id);
                }}
                urlForm={urlForm}
                getStatusBadge={getStatusBadge}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DocumentCard({
  document,
  domainId,
  onDelete,
  onReplace,
  getStatusBadge,
}: {
  document: TrainingDocument;
  domainId: string;
  onDelete: () => void;
  onReplace: (file: File) => void;
  getStatusBadge: (status: string) => JSX.Element;
}) {
  const [showSummary, setShowSummary] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);
  const { toast } = useToast();
  
  // Check if document summary already exists
  const hasSummary = document.summary && Array.isArray(document.summary) && document.summary.length > 0;
  const canGenerateSummary = document.processingStatus === 'completed' && document.content;
  
  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    try {
      const accessToken = localStorage.getItem("accessToken");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }
      
      const res = await fetch(
        `/api/domain-expertise/${domainId}/documents/${document.id}/summary`,
        {
          method: "POST",
          headers,
        }
      );
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to generate summary");
      }
      
      const data = await res.json();
      toast({ description: "AI learning summary generated successfully!" });
      setShowSummary(true);
      
      // Refresh the page to show updated summary
      window.location.reload();
    } catch (error: any) {
      toast({ variant: "destructive", description: error.message || "Failed to generate summary" });
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="border rounded-lg p-4 bg-card space-y-3" data-testid={`document-card-${document.id}`}>
      {/* Document Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <FileIcon className="w-5 h-5 flex-shrink-0 text-purple-600 dark:text-purple-400 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate" data-testid={`document-title-${document.id}`}>
              {document.fileName}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              {document.fileType.toUpperCase()} • {new Date(document.uploadedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {getStatusBadge(document.processingStatus)}
          {/* Replace button with file input */}
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.csv,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.mp3,.wav,.m4a,.ogg,.webm,.flac,.aac"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onReplace(file);
                }
                e.target.value = ''; // Reset input
              }}
              data-testid={`input-replace-doc-${document.id}`}
            />
            <Button
              variant="ghost"
              size="sm"
              asChild
              data-testid={`button-replace-doc-${document.id}`}
            >
              <span title="Replace with new file">
                <Upload className="w-4 h-4 text-blue-600" />
              </span>
            </Button>
          </label>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            data-testid={`button-delete-doc-${document.id}`}
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function DomainCard({
  domain,
  selectedFile,
  onFileSelect,
  onFileUpload,
  onAddUrl,
  onDeleteDomain,
  onDeleteDocument,
  onReplaceDocument,
  uploadPending,
  urlDialogOpen,
  setUrlDialogOpen,
  urlForm,
  getStatusBadge,
}: {
  domain: DomainExpertise;
  selectedFile: FileList | null | undefined;
  onFileSelect: (files: FileList | null) => void;
  onFileUpload: () => void;
  onAddUrl: (url: string) => void;
  onDeleteDomain: () => void;
  onDeleteDocument: (docId: string) => void;
  onReplaceDocument: (docId: string, file: File) => void;
  uploadPending: boolean;
  urlDialogOpen: boolean;
  setUrlDialogOpen: (open: boolean) => void;
  urlForm: any;
  getStatusBadge: (status: string) => JSX.Element;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRebuilding, setIsRebuilding] = useState(false);
  
  const { data: documents, isLoading: documentsLoading } = useQuery<TrainingDocument[]>({
    queryKey: ['/api/domain-expertise', domain.id, 'documents'],
    queryFn: async () => {
      const accessToken = localStorage.getItem("accessToken");
      const headers: Record<string, string> = {};
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }
      const res = await fetch(`/api/domain-expertise/${domain.id}/documents`, { headers });
      if (!res.ok) throw new Error('Failed to fetch documents');
      return res.json();
    },
  });

  const { data: knowledgeEntries, isLoading: knowledgeLoading } = useQuery<KnowledgeEntry[]>({
    queryKey: ['/api/domain-expertise', domain.id, 'knowledge'],
    queryFn: async () => {
      const accessToken = localStorage.getItem("accessToken");
      const headers: Record<string, string> = {};
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }
      const res = await fetch(`/api/domain-expertise/${domain.id}/knowledge`, { headers });
      if (!res.ok) throw new Error('Failed to fetch knowledge entries');
      return res.json();
    },
  });

  const handleRebuildKnowledge = async (forceFullRebuild: boolean = false) => {
    setIsRebuilding(true);
    try {
      const accessToken = localStorage.getItem("accessToken");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }
      const url = forceFullRebuild 
        ? `/api/domain-expertise/${domain.id}/knowledge/rebuild?force=true`
        : `/api/domain-expertise/${domain.id}/knowledge/rebuild`;
      const res = await fetch(url, {
        method: "POST",
        headers,
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to rebuild knowledge base');
      }
      const startingCount = knowledgeEntries?.length || 0;
      toast({ 
        description: forceFullRebuild 
          ? "Full rebuild started. All entries will be regenerated..."
          : `Processing new documents. ${startingCount} existing entries preserved...` 
      });
      
      let previousCount = 0;
      let stableCount = 0;
      const pollForCompletion = async (attempts = 0) => {
        try {
          const accessToken = localStorage.getItem("accessToken");
          const headers: Record<string, string> = {};
          if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
          
          const res = await fetch(`/api/domain-expertise/${domain.id}/knowledge`, { headers });
          const entries: KnowledgeEntry[] = res.ok ? await res.json() : [];
          const currentCount = entries.length;
          
          if (currentCount > previousCount) {
            toast({ description: `Extracted ${currentCount} knowledge entries so far...` });
            stableCount = 0;
          } else {
            stableCount++;
          }
          previousCount = currentCount;
          
          queryClient.setQueryData(['/api/domain-expertise', domain.id, 'knowledge'], entries);
          
          if (stableCount >= 6 && currentCount > 0) {
            setIsRebuilding(false);
            toast({ description: `Knowledge extraction complete! ${currentCount} entries created.` });
            return;
          }
          
          if (attempts >= 120) {
            setIsRebuilding(false);
            if (currentCount > 0) {
              toast({ description: `Extraction still processing. ${currentCount} entries created so far.` });
            } else {
              toast({ description: "Extraction is taking longer than expected. Please check back later." });
            }
            return;
          }
          
          setTimeout(() => pollForCompletion(attempts + 1), 5000);
        } catch (e) {
          setTimeout(() => pollForCompletion(attempts + 1), 5000);
        }
      };
      pollForCompletion();
    } catch (error: any) {
      toast({ variant: "destructive", description: error.message || "Failed to rebuild knowledge base" });
      setIsRebuilding(false);
    }
  };

  const groupedKnowledge = knowledgeEntries?.reduce((acc, entry) => {
    if (!acc[entry.category]) acc[entry.category] = [];
    acc[entry.category].push(entry);
    return acc;
  }, {} as Record<string, KnowledgeEntry[]>) || {};

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">{domain.name}</CardTitle>
            {domain.description && (
              <CardDescription className="mt-2">{domain.description}</CardDescription>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary">{documents?.length || 0} / 100 documents</Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDeleteDomain}
            data-testid={`button-delete-domain-${domain.id}`}
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Section */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 flex gap-2">
            <Input
              type="file"
              accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.csv,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.mp3,.wav,.m4a,.ogg,.webm,.flac,.aac"
              multiple
              onChange={(e) => onFileSelect(e.target.files)}
              disabled={uploadPending || (documents?.length || 0) >= 100}
              data-testid={`input-file-${domain.id}`}
            />
            <Button
              onClick={onFileUpload}
              disabled={!selectedFile || uploadPending || (documents?.length || 0) >= 100}
              data-testid={`button-upload-${domain.id}`}
            >
              {uploadPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            </Button>
          </div>
          <Dialog open={urlDialogOpen} onOpenChange={setUrlDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={(documents?.length || 0) >= 100} data-testid={`button-add-url-${domain.id}`}>
                <LinkIcon className="w-4 h-4 mr-2" />
                Add URL
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add URL to {domain.name}</DialogTitle>
                <DialogDescription>
                  Add a web page URL to extract content from
                </DialogDescription>
              </DialogHeader>
              <Form {...urlForm}>
                <form onSubmit={urlForm.handleSubmit((data: UrlFormData) => onAddUrl(data.url))} className="space-y-4">
                  <FormField
                    control={urlForm.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/documentation" {...field} data-testid="input-url" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setUrlDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" data-testid="button-submit-url">
                      Add URL
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Documents List */}
        {documentsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400 dark:text-slate-600" />
          </div>
        ) : documents && documents.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Training Documents ({documents.length})
            </h3>
            {documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                domainId={domain.id}
                onDelete={() => onDeleteDocument(doc.id)}
                onReplace={(file) => onReplaceDocument(doc.id, file)}
                getStatusBadge={getStatusBadge}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-400 text-center py-4">
            No documents yet. Upload files or add URLs to get started.
          </p>
        )}

        {/* Knowledge Base Section */}
        <div className="border-t pt-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Structured Knowledge Base
              </h3>
              {knowledgeEntries && knowledgeEntries.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {knowledgeEntries.length} entries
                </Badge>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRebuildKnowledge(false)}
              disabled={isRebuilding || !documents || documents.length === 0}
              data-testid={`button-rebuild-knowledge-${domain.id}`}
              title="Process new documents only, keeping existing entries"
            >
              {isRebuilding ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              {isRebuilding ? "Processing..." : "Update Knowledge"}
            </Button>
          </div>

          {knowledgeLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          ) : knowledgeEntries && knowledgeEntries.length > 0 ? (
            <Accordion type="multiple" className="space-y-2">
              {Object.entries(groupedKnowledge).map(([category, entries]) => {
                const IconComponent = categoryIcons[category] || FileText;
                return (
                  <AccordionItem key={category} value={category} className="border rounded-lg px-3">
                    <AccordionTrigger className="text-sm py-2">
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span>{categoryLabels[category] || category}</span>
                        <Badge variant="outline" className="text-xs ml-2">
                          {entries.length}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 py-2">
                        {entries.map((entry) => (
                          <div
                            key={entry.id}
                            className="border rounded-md p-3 bg-slate-50 dark:bg-slate-900"
                            data-testid={`knowledge-entry-${entry.id}`}
                          >
                            <div className="flex items-start justify-between">
                              <h4 className="font-medium text-sm">{entry.title}</h4>
                              {entry.isVerified && (
                                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                              {entry.content}
                            </p>
                            {entry.keywords && entry.keywords.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {entry.keywords.slice(0, 5).map((keyword, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {keyword}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          ) : documents && documents.length > 0 ? (
            <div className="text-center py-4 text-sm text-slate-500 dark:text-slate-400">
              <p>No knowledge extracted yet.</p>
              <p className="text-xs mt-1">Click "Rebuild" to extract structured knowledge from your documents.</p>
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
              Upload documents first to build your knowledge base.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
