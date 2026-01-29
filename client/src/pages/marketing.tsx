import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Lightbulb, 
  MessageSquare, 
  Send, 
  TrendingUp, 
  HelpCircle, 
  Sparkles, 
  AlertCircle,
  BarChart3,
  Users,
  FileText,
  Video,
  BookOpen,
  PieChart,
  Copy,
  RefreshCw,
  Settings,
  Database,
  Globe,
  Hash,
  Mail,
  Phone,
  LinkIcon,
  Check,
  Building2,
  Shield,
  Edit3
} from "lucide-react";

interface DiscoverMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  queryType?: string;
  insights?: string[];
  supportingQuotes?: string[];
  dataPoints?: {
    conversationsAnalyzed: number;
    totalMessages: number;
    industries: string[];
  };
  timestamp: Date;
}

interface DiscoverResponse {
  success: boolean;
  query: string;
  answer: string;
  insights: string[];
  supportingQuotes: string[];
  dataPoints: {
    conversationsAnalyzed: number;
    totalMessages: number;
    industries: string[];
    timeRange?: { earliest: string; latest: string };
  };
  error?: string;
}

interface GeneratedContent {
  success: boolean;
  content: string;
  hashtags?: string[];
  title?: string;
  metadata?: Record<string, any>;
  error?: string;
}

interface UserSettings {
  contactEmail?: string;
  contactPhone?: string;
  contactWebsite?: string;
  preferredTone?: string;
  defaultHashtagMode?: string;
  dataBankMode?: boolean;
}

const quickQueries = [
  { 
    label: "Top 5 Challenges", 
    queryType: "challenges" as const,
    icon: AlertCircle,
    description: "What are the biggest challenges customers face?"
  },
  { 
    label: "FAQs", 
    queryType: "faqs" as const,
    icon: HelpCircle,
    description: "Most frequently asked questions by customers"
  },
  { 
    label: "Unique Queries", 
    queryType: "unique_queries" as const,
    icon: Sparkles,
    description: "Interesting questions that were successfully answered"
  },
  { 
    label: "Unanswered Queries", 
    queryType: "unanswered" as const,
    icon: TrendingUp,
    description: "Questions that remain unresolved"
  },
];

const toneOptions = [
  { value: "professional", label: "Professional" },
  { value: "bold", label: "Bold" },
  { value: "thought-leadership", label: "Thought Leadership" },
  { value: "conversational", label: "Conversational" },
  { value: "analytical", label: "Analytical" },
];

const lengthOptions = [
  { value: "short", label: "Short" },
  { value: "medium", label: "Medium" },
  { value: "long", label: "Long" },
];

export default function Marketing() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<DiscoverMessage[]>([]);
  const [customQuery, setCustomQuery] = useState("");
  const [dataMode, setDataMode] = useState<"data_bank" | "universal">("data_bank");
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [postTopic, setPostTopic] = useState("");
  const [postLength, setPostLength] = useState<"short" | "medium" | "long">("medium");
  const [postTone, setPostTone] = useState("professional");
  const [postHashtagMode, setPostHashtagMode] = useState<"manual" | "auto" | "both">("auto");
  const [postManualHashtags, setPostManualHashtags] = useState("");
  const [postIncludeContact, setPostIncludeContact] = useState(false);
  const [generatedPost, setGeneratedPost] = useState<GeneratedContent | null>(null);
  
  const [videoTopic, setVideoTopic] = useState("");
  const [videoLength, setVideoLength] = useState<"short" | "medium" | "long">("medium");
  const [videoTone, setVideoTone] = useState("professional");
  const [videoHashtagMode, setVideoHashtagMode] = useState<"manual" | "auto" | "both">("auto");
  const [videoManualHashtags, setVideoManualHashtags] = useState("");
  const [generatedVideo, setGeneratedVideo] = useState<GeneratedContent | null>(null);
  
  const [researchTopic, setResearchTopic] = useState("");
  const [researchOutputType, setResearchOutputType] = useState<"research_paper" | "newsletter" | "blog" | "strategy">("blog");
  const [generatedResearch, setGeneratedResearch] = useState<GeneratedContent | null>(null);
  
  const [infographicTopic, setInfographicTopic] = useState("");
  const [infographicOutputType, setInfographicOutputType] = useState<"infographic" | "chart" | "numbers" | "summary">("summary");
  const [generatedInfographic, setGeneratedInfographic] = useState<GeneratedContent | null>(null);
  
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactWebsite, setContactWebsite] = useState("");
  const [copied, setCopied] = useState(false);
  
  const [domainExpertise, setDomainExpertise] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [accessAllMode, setAccessAllMode] = useState(false);
  const [isEditingDomain, setIsEditingDomain] = useState(false);

  useEffect(() => {
    document.title = "Marketing Add-On | Rev Winner";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'AI-powered marketing content generation. Create posts, video scripts, research insights, and infographics from your conversation data.');
    }
  }, []);

  const statsQuery = useQuery({
    queryKey: ["/api/marketing/stats"],
    enabled: true,
  });

  const settingsQuery = useQuery({
    queryKey: ["/api/marketing/settings"],
    enabled: true,
  });
  
  const domainExpertiseQuery = useQuery<{
    success: boolean;
    domainExpertise: {
      email: string;
      domain: string;
      companyName: string;
      isSuperAdmin: boolean;
      canAccessAll: boolean;
      canEditDomain: boolean;
    };
  }>({
    queryKey: ["/api/marketing/domain-expertise"],
    enabled: true,
  });
  
  const availableDomainsQuery = useQuery<{
    success: boolean;
    domains: { domain: string; companyName: string }[];
  }>({
    queryKey: ["/api/marketing/available-domains"],
    enabled: domainExpertiseQuery.data?.domainExpertise?.isSuperAdmin === true,
  });
  
  useEffect(() => {
    if (domainExpertiseQuery.data?.domainExpertise) {
      const de = domainExpertiseQuery.data.domainExpertise;
      setDomainExpertise(de.companyName || "");
      if (de.domain) {
        setCustomDomain(de.domain);
      }
    }
  }, [domainExpertiseQuery.data]);

  useEffect(() => {
    if (settingsQuery.data) {
      const settings = (settingsQuery.data as any).settings as UserSettings;
      if (settings) {
        setContactEmail(settings.contactEmail || "");
        setContactPhone(settings.contactPhone || "");
        setContactWebsite(settings.contactWebsite || "");
        setPostTone(settings.preferredTone || "professional");
        setVideoTone(settings.preferredTone || "professional");
        setPostHashtagMode((settings.defaultHashtagMode as any) || "auto");
        setVideoHashtagMode((settings.defaultHashtagMode as any) || "auto");
        setDataMode(settings.dataBankMode !== false ? "data_bank" : "universal");
      }
    }
  }, [settingsQuery.data]);

  const discoverMutation = useMutation({
    mutationFn: async ({ queryType, customQuestion }: { queryType: string; customQuestion?: string }) => {
      const isSuperAdmin = domainExpertiseQuery.data?.domainExpertise?.isSuperAdmin;
      const effectiveDomain = customDomain || domainExpertiseQuery.data?.domainExpertise?.domain || "";
      const response = await apiRequest("POST", "/api/marketing/discover", {
        queryType,
        customQuestion,
        dataMode,
        ...(isSuperAdmin && effectiveDomain && {
          domainOverride: accessAllMode ? null : effectiveDomain,
          accessAll: accessAllMode,
        }),
      });
      return response.json() as Promise<DiscoverResponse>;
    },
    onSuccess: (data, variables) => {
      const assistantMessage: DiscoverMessage = {
        id: Date.now().toString(),
        type: "assistant",
        content: data.answer,
        queryType: variables.queryType,
        insights: data.insights,
        supportingQuotes: data.supportingQuotes,
        dataPoints: data.dataPoints,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze conversation data",
        variant: "destructive",
      });
    },
  });

  const postMutation = useMutation({
    mutationFn: async () => {
      const isSuperAdmin = domainExpertiseQuery.data?.domainExpertise?.isSuperAdmin;
      const effectiveDomain = customDomain || domainExpertiseQuery.data?.domainExpertise?.domain || "";
      const response = await apiRequest("POST", "/api/marketing/generate/post", {
        topic: postTopic,
        length: postLength,
        tone: postTone,
        hashtagMode: postHashtagMode,
        manualHashtags: postManualHashtags ? postManualHashtags.split(",").map(h => h.trim()) : undefined,
        includeContact: postIncludeContact,
        contactDetails: postIncludeContact ? { email: contactEmail, phone: contactPhone, website: contactWebsite } : undefined,
        dataMode,
        ...(isSuperAdmin && effectiveDomain && {
          domainOverride: accessAllMode ? null : effectiveDomain,
          accessAll: accessAllMode,
        }),
      });
      return response.json() as Promise<GeneratedContent>;
    },
    onSuccess: (data) => {
      setGeneratedPost(data);
      if (data.success) {
        toast({ title: "Post Generated", description: "Your marketing post is ready!" });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate post",
        variant: "destructive",
      });
    },
  });

  const videoMutation = useMutation({
    mutationFn: async () => {
      const isSuperAdmin = domainExpertiseQuery.data?.domainExpertise?.isSuperAdmin;
      const effectiveDomain = customDomain || domainExpertiseQuery.data?.domainExpertise?.domain || "";
      const response = await apiRequest("POST", "/api/marketing/generate/video-script", {
        topic: videoTopic,
        length: videoLength,
        tone: videoTone,
        hashtagMode: videoHashtagMode,
        manualHashtags: videoManualHashtags ? videoManualHashtags.split(",").map(h => h.trim()) : undefined,
        dataMode,
        ...(isSuperAdmin && effectiveDomain && {
          domainOverride: accessAllMode ? null : effectiveDomain,
          accessAll: accessAllMode,
        }),
      });
      return response.json() as Promise<GeneratedContent>;
    },
    onSuccess: (data) => {
      setGeneratedVideo(data);
      if (data.success) {
        toast({ title: "Script Generated", description: "Your video script is ready!" });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate video script",
        variant: "destructive",
      });
    },
  });

  const researchMutation = useMutation({
    mutationFn: async () => {
      const isSuperAdmin = domainExpertiseQuery.data?.domainExpertise?.isSuperAdmin;
      const effectiveDomain = customDomain || domainExpertiseQuery.data?.domainExpertise?.domain || "";
      const response = await apiRequest("POST", "/api/marketing/generate/research", {
        topic: researchTopic,
        outputType: researchOutputType,
        dataMode,
        ...(isSuperAdmin && effectiveDomain && {
          domainOverride: accessAllMode ? null : effectiveDomain,
          accessAll: accessAllMode,
        }),
      });
      return response.json() as Promise<GeneratedContent>;
    },
    onSuccess: (data) => {
      setGeneratedResearch(data);
      if (data.success) {
        toast({ title: "Research Generated", description: "Your research content is ready!" });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate research",
        variant: "destructive",
      });
    },
  });

  const infographicMutation = useMutation({
    mutationFn: async () => {
      const isSuperAdmin = domainExpertiseQuery.data?.domainExpertise?.isSuperAdmin;
      const effectiveDomain = customDomain || domainExpertiseQuery.data?.domainExpertise?.domain || "";
      const response = await apiRequest("POST", "/api/marketing/generate/infographic", {
        topic: infographicTopic,
        outputType: infographicOutputType,
        dataMode,
        ...(isSuperAdmin && effectiveDomain && {
          domainOverride: accessAllMode ? null : effectiveDomain,
          accessAll: accessAllMode,
        }),
      });
      return response.json() as Promise<GeneratedContent>;
    },
    onSuccess: (data) => {
      setGeneratedInfographic(data);
      if (data.success) {
        toast({ title: "Data Generated", description: "Your infographic data is ready!" });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate infographic data",
        variant: "destructive",
      });
    },
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/marketing/settings", {
        contactEmail,
        contactPhone,
        contactWebsite,
        preferredTone: postTone,
        defaultHashtagMode: postHashtagMode,
        dataBankMode: dataMode === "data_bank",
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Settings Saved", description: "Your preferences have been saved." });
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    },
  });

  const handleQuickQuery = (queryType: string, label: string) => {
    const userMessage: DiscoverMessage = {
      id: Date.now().toString(),
      type: "user",
      content: label,
      queryType,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    discoverMutation.mutate({ queryType });
  };

  const handleCustomQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuery.trim()) return;

    const userMessage: DiscoverMessage = {
      id: Date.now().toString(),
      type: "user",
      content: customQuery,
      queryType: "custom",
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    discoverMutation.mutate({ queryType: "custom", customQuestion: customQuery });
    setCustomQuery("");
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied!", description: "Content copied to clipboard" });
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const stats = statsQuery.data as { success: boolean; stats: { totalConversations: number; totalChallenges: number; topIndustries: string[]; recentActivity: string | null } } | undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-fuchsia-50 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent mb-2">
            Marketing Add-On
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            AI-powered marketing content generation from your conversation data
          </p>
        </div>

        <div className="flex items-center justify-center gap-4 mb-8 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-2">
            <Database className={`h-5 w-5 ${dataMode === "data_bank" ? "text-purple-600" : "text-slate-400"}`} />
            <span className={`text-sm font-medium ${dataMode === "data_bank" ? "text-purple-600" : "text-slate-400"}`}>Data Bank</span>
          </div>
          <Switch
            checked={dataMode === "universal"}
            onCheckedChange={(checked) => setDataMode(checked ? "universal" : "data_bank")}
            data-testid="data-mode-toggle"
          />
          <div className="flex items-center gap-2">
            <Globe className={`h-5 w-5 ${dataMode === "universal" ? "text-purple-600" : "text-slate-400"}`} />
            <span className={`text-sm font-medium ${dataMode === "universal" ? "text-purple-600" : "text-slate-400"}`}>Universal</span>
          </div>
          <Badge variant="outline" className="ml-4">
            {dataMode === "data_bank" ? "Responses based on your conversation data" : "Responses from universal knowledge"}
          </Badge>
        </div>

        <div className="flex items-center justify-center gap-4 mb-4 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Domain Expertise:</span>
          </div>
          
          {domainExpertiseQuery.data?.domainExpertise?.isSuperAdmin ? (
            <div className="flex items-center gap-3">
              {accessAllMode ? (
                <div className="flex items-center gap-2">
                  <Badge className="bg-purple-600">
                    <Shield className="h-3 w-3 mr-1" />
                    Access All Domains
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAccessAllMode(false)}
                    data-testid="disable-access-all"
                  >
                    Switch to Single Domain
                  </Button>
                </div>
              ) : isEditingDomain ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    placeholder="Enter company name..."
                    className="w-48"
                    data-testid="domain-input"
                  />
                  <Select
                    value={customDomain}
                    onValueChange={(value) => {
                      setCustomDomain(value);
                      const selectedDomain = availableDomainsQuery.data?.domains?.find(d => d.domain === value);
                      setDomainExpertise(selectedDomain?.companyName || value);
                      setIsEditingDomain(false);
                    }}
                  >
                    <SelectTrigger className="w-48" data-testid="domain-select">
                      <SelectValue placeholder="Or select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDomainsQuery.data?.domains?.map((item) => (
                        <SelectItem key={item.domain} value={item.domain}>{item.companyName} ({item.domain})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      if (customDomain) {
                        setDomainExpertise(customDomain);
                        setIsEditingDomain(false);
                      }
                    }}
                    data-testid="save-domain"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAccessAllMode(true)}
                    data-testid="enable-access-all"
                  >
                    <Shield className="h-4 w-4 mr-1" />
                    Access All
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-600">
                    {domainExpertise || "Not Set"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCustomDomain(domainExpertise);
                      setIsEditingDomain(true);
                    }}
                    data-testid="edit-domain"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAccessAllMode(true)}
                    data-testid="enable-access-all"
                  >
                    <Shield className="h-4 w-4 mr-1" />
                    Access All
                  </Button>
                </div>
              )}
              <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/50">
                <Shield className="h-3 w-3 mr-1 text-purple-600" />
                Super Admin
              </Badge>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Badge className="bg-green-600">
                {domainExpertise || domainExpertiseQuery.data?.domainExpertise?.companyName || "Loading..."}
              </Badge>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                (Based on your email domain)
              </span>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-purple-200 dark:border-purple-800" data-testid="stat-conversations">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900">
                  <MessageSquare className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">
                    {statsQuery.isLoading ? <Skeleton className="h-6 w-12" /> : stats?.stats?.totalConversations || 0}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Conversations</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 dark:border-purple-800" data-testid="stat-challenges">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900">
                  <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">
                    {statsQuery.isLoading ? <Skeleton className="h-6 w-12" /> : stats?.stats?.totalChallenges || 0}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Challenges</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 dark:border-purple-800" data-testid="stat-industries">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                  <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">
                    {statsQuery.isLoading ? <Skeleton className="h-6 w-12" /> : stats?.stats?.topIndustries?.length || 0}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Industries</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 dark:border-purple-800" data-testid="stat-mode">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${dataMode === "data_bank" ? "bg-purple-100 dark:bg-purple-900" : "bg-blue-100 dark:bg-blue-900"}`}>
                  {dataMode === "data_bank" ? (
                    <Database className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  ) : (
                    <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">
                    {dataMode === "data_bank" ? "Data" : "Universal"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Mode</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="chatbot" className="space-y-6">
          <TabsList className="grid grid-cols-6 w-full bg-white dark:bg-slate-800 p-1 h-auto">
            <TabsTrigger value="chatbot" className="flex items-center gap-2 py-3" data-testid="tab-chatbot">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Chatbot</span>
            </TabsTrigger>
            <TabsTrigger value="posts" className="flex items-center gap-2 py-3" data-testid="tab-posts">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Posts</span>
            </TabsTrigger>
            <TabsTrigger value="video" className="flex items-center gap-2 py-3" data-testid="tab-video">
              <Video className="h-4 w-4" />
              <span className="hidden sm:inline">Video</span>
            </TabsTrigger>
            <TabsTrigger value="research" className="flex items-center gap-2 py-3" data-testid="tab-research">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Research</span>
            </TabsTrigger>
            <TabsTrigger value="infographic" className="flex items-center gap-2 py-3" data-testid="tab-infographic">
              <PieChart className="h-4 w-4" />
              <span className="hidden sm:inline">Data</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2 py-3" data-testid="tab-settings">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chatbot">
            <Card className="border-purple-200 dark:border-purple-800 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-purple-600" />
                  Marketing Chatbot
                </CardTitle>
                <CardDescription>
                  Ask questions for messaging ideas, positioning, campaign copy, and thought leadership content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">Quick queries:</p>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {quickQueries.map((query) => (
                      <Button
                        key={query.queryType}
                        variant="outline"
                        className="h-auto py-3 px-4 flex flex-col items-start gap-1 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-400"
                        onClick={() => handleQuickQuery(query.queryType, query.label)}
                        disabled={discoverMutation.isPending}
                        data-testid={`query-btn-${query.queryType}`}
                      >
                        <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                          <query.icon className="h-4 w-4" />
                          <span className="font-medium">{query.label}</span>
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 text-left">
                          {query.description}
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="border rounded-lg bg-slate-50 dark:bg-slate-900/50" data-testid="discover-chat">
                  <ScrollArea className="h-[400px] p-4" ref={scrollRef}>
                    {messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400">
                        <Sparkles className="h-12 w-12 mb-4 text-purple-400" />
                        <p className="text-lg font-medium mb-2">Start a Conversation</p>
                        <p className="text-sm max-w-md">
                          Click a quick query or type your own question. Use {dataMode === "data_bank" ? "Data Bank" : "Universal"} mode for {dataMode === "data_bank" ? "insights from your conversations" : "broader knowledge"}.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[85%] rounded-lg p-4 ${
                                message.type === "user"
                                  ? "bg-purple-600 text-white"
                                  : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                              }`}
                              data-testid={`message-${message.type}-${message.id}`}
                            >
                              {message.type === "user" ? (
                                <p>{message.content}</p>
                              ) : (
                                <div className="space-y-3">
                                  <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                                    {message.content}
                                  </div>
                                  
                                  {message.dataPoints && (
                                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                                      <Badge variant="secondary" className="text-xs">
                                        <MessageSquare className="h-3 w-3 mr-1" />
                                        {message.dataPoints.conversationsAnalyzed} conversations
                                      </Badge>
                                      <Badge variant="secondary" className="text-xs">
                                        <Users className="h-3 w-3 mr-1" />
                                        {message.dataPoints.totalMessages} messages
                                      </Badge>
                                    </div>
                                  )}
                                  
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => copyToClipboard(message.content)}
                                    className="mt-2"
                                  >
                                    {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                                    Copy
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {discoverMutation.isPending && (
                          <div className="flex justify-start">
                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 max-w-[85%]">
                              <div className="flex items-center gap-2">
                                <div className="animate-pulse flex space-x-1">
                                  <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                                  <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                                  <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                                </div>
                                <span className="text-sm text-slate-500 dark:text-slate-400">Analyzing...</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </ScrollArea>

                  <form onSubmit={handleCustomQuery} className="p-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex gap-2">
                      <Input
                        value={customQuery}
                        onChange={(e) => setCustomQuery(e.target.value)}
                        placeholder="Ask about messaging, positioning, campaigns..."
                        className="flex-1"
                        disabled={discoverMutation.isPending}
                        data-testid="custom-query-input"
                      />
                      <Button 
                        type="submit" 
                        disabled={discoverMutation.isPending || !customQuery.trim()}
                        data-testid="submit-query-btn"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="posts">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="border-purple-200 dark:border-purple-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-600" />
                    Post Generation
                  </CardTitle>
                  <CardDescription>Create marketing posts for social media</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Topic / Idea</Label>
                    <Textarea
                      value={postTopic}
                      onChange={(e) => setPostTopic(e.target.value)}
                      placeholder="What should the post be about?"
                      className="mt-1"
                      data-testid="post-topic-input"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Length</Label>
                      <Select value={postLength} onValueChange={(v) => setPostLength(v as any)}>
                        <SelectTrigger className="mt-1" data-testid="post-length-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {lengthOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Tone</Label>
                      <Select value={postTone} onValueChange={setPostTone}>
                        <SelectTrigger className="mt-1" data-testid="post-tone-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {toneOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Hashtags</Label>
                    <Select value={postHashtagMode} onValueChange={(v) => setPostHashtagMode(v as any)}>
                      <SelectTrigger className="mt-1" data-testid="post-hashtag-mode">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto-generate</SelectItem>
                        <SelectItem value="manual">Manual only</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                    {(postHashtagMode === "manual" || postHashtagMode === "both") && (
                      <Input
                        value={postManualHashtags}
                        onChange={(e) => setPostManualHashtags(e.target.value)}
                        placeholder="Enter hashtags separated by commas"
                        className="mt-2"
                        data-testid="post-manual-hashtags"
                      />
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-500" />
                      <span className="text-sm">Include contact details</span>
                    </div>
                    <Switch
                      checked={postIncludeContact}
                      onCheckedChange={setPostIncludeContact}
                      data-testid="post-include-contact"
                    />
                  </div>
                  
                  <Button
                    onClick={() => postMutation.mutate()}
                    disabled={postMutation.isPending || !postTopic.trim()}
                    className="w-full"
                    data-testid="generate-post-btn"
                  >
                    {postMutation.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Post
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="border-purple-200 dark:border-purple-800">
                <CardHeader>
                  <CardTitle>Generated Post</CardTitle>
                </CardHeader>
                <CardContent>
                  {generatedPost?.success ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg whitespace-pre-wrap text-sm">
                        {generatedPost.content}
                      </div>
                      {generatedPost.hashtags && generatedPost.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {generatedPost.hashtags.map((tag, i) => (
                            <Badge key={i} variant="secondary">
                              <Hash className="h-3 w-3 mr-1" />
                              {tag.replace("#", "")}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => copyToClipboard(generatedPost.content)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => postMutation.mutate()}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Regenerate
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-slate-400">
                      <div className="text-center">
                        <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Your generated post will appear here</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="video">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="border-purple-200 dark:border-purple-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5 text-purple-600" />
                    Video Script Generation
                  </CardTitle>
                  <CardDescription>Create video scripts for marketing videos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Topic / Idea</Label>
                    <Textarea
                      value={videoTopic}
                      onChange={(e) => setVideoTopic(e.target.value)}
                      placeholder="What should the video be about?"
                      className="mt-1"
                      data-testid="video-topic-input"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Video Length</Label>
                      <Select value={videoLength} onValueChange={(v) => setVideoLength(v as any)}>
                        <SelectTrigger className="mt-1" data-testid="video-length-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="short">Short (30-60s)</SelectItem>
                          <SelectItem value="medium">Medium (2-3min)</SelectItem>
                          <SelectItem value="long">Long (5-7min)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Tone</Label>
                      <Select value={videoTone} onValueChange={setVideoTone}>
                        <SelectTrigger className="mt-1" data-testid="video-tone-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {toneOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Hashtags for Distribution</Label>
                    <Select value={videoHashtagMode} onValueChange={(v) => setVideoHashtagMode(v as any)}>
                      <SelectTrigger className="mt-1" data-testid="video-hashtag-mode">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto-generate</SelectItem>
                        <SelectItem value="manual">Manual only</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                    {(videoHashtagMode === "manual" || videoHashtagMode === "both") && (
                      <Input
                        value={videoManualHashtags}
                        onChange={(e) => setVideoManualHashtags(e.target.value)}
                        placeholder="Enter hashtags separated by commas"
                        className="mt-2"
                        data-testid="video-manual-hashtags"
                      />
                    )}
                  </div>
                  
                  <Button
                    onClick={() => videoMutation.mutate()}
                    disabled={videoMutation.isPending || !videoTopic.trim()}
                    className="w-full"
                    data-testid="generate-video-btn"
                  >
                    {videoMutation.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Script
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="border-purple-200 dark:border-purple-800">
                <CardHeader>
                  <CardTitle>Generated Script</CardTitle>
                </CardHeader>
                <CardContent>
                  {generatedVideo?.success ? (
                    <div className="space-y-4">
                      <ScrollArea className="h-80">
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg whitespace-pre-wrap text-sm">
                          {generatedVideo.content}
                        </div>
                      </ScrollArea>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => copyToClipboard(generatedVideo.content)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => videoMutation.mutate()}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Regenerate
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-slate-400">
                      <div className="text-center">
                        <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Your video script will appear here</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="research">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="border-purple-200 dark:border-purple-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-purple-600" />
                    Research & Insights
                  </CardTitle>
                  <CardDescription>Generate research papers, newsletters, blogs, and strategy docs</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Research Topic</Label>
                    <Textarea
                      value={researchTopic}
                      onChange={(e) => setResearchTopic(e.target.value)}
                      placeholder="What topic do you want to research?"
                      className="mt-1"
                      data-testid="research-topic-input"
                    />
                  </div>
                  
                  <div>
                    <Label>Output Type</Label>
                    <Select value={researchOutputType} onValueChange={(v) => setResearchOutputType(v as any)}>
                      <SelectTrigger className="mt-1" data-testid="research-output-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="research_paper">Research Paper</SelectItem>
                        <SelectItem value="newsletter">Newsletter</SelectItem>
                        <SelectItem value="blog">Blog Post</SelectItem>
                        <SelectItem value="strategy">Strategy Document</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button
                    onClick={() => researchMutation.mutate()}
                    disabled={researchMutation.isPending || !researchTopic.trim()}
                    className="w-full"
                    data-testid="generate-research-btn"
                  >
                    {researchMutation.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Research
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="border-purple-200 dark:border-purple-800">
                <CardHeader>
                  <CardTitle>Generated Research</CardTitle>
                </CardHeader>
                <CardContent>
                  {generatedResearch?.success ? (
                    <div className="space-y-4">
                      <ScrollArea className="h-96">
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg whitespace-pre-wrap text-sm">
                          {generatedResearch.content}
                        </div>
                      </ScrollArea>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => copyToClipboard(generatedResearch.content)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => researchMutation.mutate()}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Regenerate
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-slate-400">
                      <div className="text-center">
                        <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Your research content will appear here</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="infographic">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="border-purple-200 dark:border-purple-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-purple-600" />
                    Infographics, Charts & Numbers
                  </CardTitle>
                  <CardDescription>Generate data summaries, chart-ready data, and numerical insights</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Topic</Label>
                    <Textarea
                      value={infographicTopic}
                      onChange={(e) => setInfographicTopic(e.target.value)}
                      placeholder="What data or insights do you need?"
                      className="mt-1"
                      data-testid="infographic-topic-input"
                    />
                  </div>
                  
                  <div>
                    <Label>Output Type</Label>
                    <Select value={infographicOutputType} onValueChange={(v) => setInfographicOutputType(v as any)}>
                      <SelectTrigger className="mt-1" data-testid="infographic-output-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="infographic">Infographic Data</SelectItem>
                        <SelectItem value="chart">Chart-Ready Data</SelectItem>
                        <SelectItem value="numbers">Key Metrics</SelectItem>
                        <SelectItem value="summary">Executive Summary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button
                    onClick={() => infographicMutation.mutate()}
                    disabled={infographicMutation.isPending || !infographicTopic.trim()}
                    className="w-full"
                    data-testid="generate-infographic-btn"
                  >
                    {infographicMutation.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Data
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="border-purple-200 dark:border-purple-800">
                <CardHeader>
                  <CardTitle>Generated Data</CardTitle>
                </CardHeader>
                <CardContent>
                  {generatedInfographic?.success ? (
                    <div className="space-y-4">
                      <ScrollArea className="h-80">
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg whitespace-pre-wrap text-sm font-mono">
                          {generatedInfographic.content}
                        </div>
                      </ScrollArea>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => copyToClipboard(generatedInfographic.content)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => infographicMutation.mutate()}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Regenerate
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-slate-400">
                      <div className="text-center">
                        <PieChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Your data will appear here</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="border-purple-200 dark:border-purple-800 max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-purple-600" />
                  Settings
                </CardTitle>
                <CardDescription>Configure your contact details and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Contact Details
                  </h3>
                  <p className="text-sm text-slate-500">These will be added to posts when you enable "Include contact details"</p>
                  
                  <div className="grid gap-4">
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="mt-1"
                        data-testid="settings-email"
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="+1 234 567 8900"
                        className="mt-1"
                        data-testid="settings-phone"
                      />
                    </div>
                    <div>
                      <Label>Website</Label>
                      <Input
                        value={contactWebsite}
                        onChange={(e) => setContactWebsite(e.target.value)}
                        placeholder="https://yourwebsite.com"
                        className="mt-1"
                        data-testid="settings-website"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <Button
                    onClick={() => saveSettingsMutation.mutate()}
                    disabled={saveSettingsMutation.isPending}
                    data-testid="save-settings-btn"
                  >
                    {saveSettingsMutation.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Save Settings
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          <p>
            {dataMode === "data_bank" 
              ? "Content is generated primarily from your conversation data bank."
              : "Content is generated from universal knowledge."}
          </p>
        </div>
      </div>
    </div>
  );
}
