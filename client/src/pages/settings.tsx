import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { HamburgerNav } from "@/components/hamburger-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Brain, Sparkles, Zap, Globe, Shield, Save, Moon, Crown, Calendar, Check, TrendingUp } from "lucide-react";
import PricingModal from "@/components/pricing-modal";
import { Badge } from "@/components/ui/badge";
import { useSEO } from "@/hooks/use-seo";

const AI_ENGINES = [
  {
    value: "default",
    label: "Default AI Engine",
    description: "Use Rev Winner's default AI engine - no API key needed!",
    icon: Crown,
    color: "text-yellow-500",
  },
  {
    value: "openai",
    label: "OpenAI (GPT)",
    description: "Industry-leading models with excellent reasoning capabilities",
    icon: Brain,
    color: "text-green-500",
  },
  {
    value: "grok",
    label: "Grok (xAI)",
    description: "Real-time knowledge with unique personality",
    icon: Zap,
    color: "text-blue-500",
  },
  {
    value: "claude",
    label: "Claude (Anthropic)",
    description: "Thoughtful responses with strong ethical guidelines",
    icon: Shield,
    color: "text-purple-500",
  },
  {
    value: "gemini",
    label: "Gemini (Google)",
    description: "Multimodal AI with Google's vast knowledge",
    icon: Globe,
    color: "text-orange-500",
  },
  {
    value: "deepseek",
    label: "DeepSeek",
    description: "Cost-effective AI with competitive performance",
    icon: Sparkles,
    color: "text-cyan-500",
  },
  {
    value: "kimi",
    label: "Kimi K2 (Moonshot AI)",
    description: "1T parameter MoE model with 128K context and advanced agentic capabilities",
    icon: Moon,
    color: "text-indigo-500",
  },
];

export default function Settings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  useSEO({
    title: "Settings - Rev Winner | Configure AI Engine & Domain Expertise",
    description: "Customize your Rev Winner experience. Choose your AI provider (OpenAI, Claude, Gemini, Grok, DeepSeek, Kimi), set up API keys, and configure domain expertise.",
  });

  // Check authentication
  const { data: authData, isLoading: isAuthLoading, error: authError } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  // Get AI engine settings
  const { data: aiEngineSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["/api/auth/ai-engine-settings"],
    enabled: !!authData,
  });

  // Get subscription info
  const { data: subscriptionData } = useQuery<{
    subscription: {
      planType: string;
      status: string;
      currentPeriodEnd: string | null;
    }
  }>({
    queryKey: ["/api/subscriptions/current"],
    enabled: !!authData,
  });

  // Get subscription limits
  const { data: limitsData } = useQuery<{
    canUseService: boolean;
    planType: string;
    status: string;
    hasPlatformAccess?: boolean;
    hasSessionMinutes?: boolean;
    trialExpired?: boolean;
    sessionsUsed: number;
    sessionsLimit: number | null;
    sessionsRemaining: number | null;
    minutesUsed: number;
    minutesLimit: number | null;
    minutesRemaining: number | null;
  }>({
    queryKey: ["/api/subscriptions/check-limits"],
    enabled: !!authData,
  });

  const [selectedEngine, setSelectedEngine] = useState<string>("");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  
  // Multi-Product Elite AI toggle (load from localStorage)
  const [multiProductEliteAI, setMultiProductEliteAI] = useState(() => {
    const saved = localStorage.getItem("multiProductEliteAI");
    return saved ? JSON.parse(saved) : false;
  });

  // Save multiProductEliteAI to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("multiProductEliteAI", JSON.stringify(multiProductEliteAI));
    console.log("🎯 Multi-Product Elite AI:", multiProductEliteAI ? "ENABLED" : "DISABLED");
  }, [multiProductEliteAI]);

  // Set initial values when settings load
  useEffect(() => {
    if (aiEngineSettings && (aiEngineSettings as any).aiEngine) {
      setSelectedEngine((aiEngineSettings as any).aiEngine);
    }
  }, [aiEngineSettings]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthLoading && (authError || !authData)) {
      setLocation("/login");
    }
  }, [isAuthLoading, authError, authData, setLocation]);

  const updateMutation = useMutation({
    mutationFn: async (data: { aiEngine: string; apiKey: string }) => {
      return apiRequest("POST", "/api/auth/ai-engine-settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/ai-engine-settings"] });
      toast({
        title: "Success!",
        description: "Your AI engine settings have been updated.",
      });
      setApiKey("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update AI engine settings",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEngine) {
      toast({
        title: "Error",
        description: "Please select an AI engine",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedEngine !== "default" && !apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter your API key",
        variant: "destructive",
      });
      return;
    }
    
    updateMutation.mutate({ aiEngine: selectedEngine, apiKey: selectedEngine === "default" ? "default" : apiKey.trim() });
  };

  if (isAuthLoading || isLoadingSettings) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Loading Settings...</h2>
        </div>
      </div>
    );
  }

  if (!authData) {
    return null;
  }

  const selectedEngineData = AI_ENGINES.find(e => e.value === selectedEngine);
  const currentEngine = (aiEngineSettings as any)?.aiEngine;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <HamburgerNav currentPath="/settings" />

      <main className="max-w-[900px] mx-auto px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your AI engine preferences and API keys
          </p>
        </div>

        <Card className="border-2 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">AI Engine Configuration</CardTitle>
            <CardDescription className="text-base">
              {currentEngine 
                ? `You are currently using ${AI_ENGINES.find(e => e.value === currentEngine)?.label}. Update your settings below.`
                : "Configure your preferred AI engine and API key."
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <Label htmlFor="ai-engine" className="text-base font-semibold">
                  Select AI Engine
                </Label>
                <Select value={selectedEngine} onValueChange={setSelectedEngine}>
                  <SelectTrigger id="ai-engine" data-testid="select-ai-engine" className="w-full">
                    <SelectValue placeholder="Choose an AI engine" />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_ENGINES.map((engine) => {
                      const Icon = engine.icon;
                      return (
                        <SelectItem key={engine.value} value={engine.value} data-testid={`option-${engine.value}`}>
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${engine.color}`} />
                            <span>{engine.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                {selectedEngineData && (
                  <Card className="border-2 border-purple-200 dark:border-purple-900">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {(() => {
                          const Icon = selectedEngineData.icon;
                          return <Icon className={`h-5 w-5 ${selectedEngineData.color}`} />;
                        })()}
                        {selectedEngineData.label}
                      </CardTitle>
                      <CardDescription>{selectedEngineData.description}</CardDescription>
                    </CardHeader>
                  </Card>
                )}
              </div>

              {selectedEngine !== "default" && (
                <div className="space-y-2">
                  <Label htmlFor="api-key" className="text-base font-semibold">
                    API Key {currentEngine && <span className="text-xs text-muted-foreground font-normal">(leave blank to keep current key)</span>}
                  </Label>
                  <div className="relative">
                    <Input
                      id="api-key"
                      data-testid="input-api-key"
                      type={showApiKey ? "text" : "password"}
                      placeholder={currentEngine ? "Enter new API key (optional)" : "Enter your API key"}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="pr-20"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      data-testid="button-toggle-api-key"
                      className="absolute right-0 top-0 h-full px-3 text-xs"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? "Hide" : "Show"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your API key is encrypted and stored securely. It will never be shared with anyone.
                  </p>
                </div>
              )}

              {selectedEngine === "default" && (
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-sm text-green-900 dark:text-green-100">
                    ✓ You're all set! The Default AI Engine will be automatically configured with Rev Winner's API key.
                  </p>
                </div>
              )}

              {selectedEngine !== "default" && (
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                    Where to get your API key:
                  </h4>
                  <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                    <li><strong>OpenAI:</strong> platform.openai.com/api-keys</li>
                    <li><strong>Grok:</strong> console.x.ai/</li>
                    <li><strong>Claude:</strong> console.anthropic.com/</li>
                    <li><strong>Gemini:</strong> makersuite.google.com/app/apikey</li>
                    <li><strong>DeepSeek:</strong> platform.deepseek.com/api_keys</li>
                    <li><strong>Kimi K2:</strong> platform.moonshot.ai</li>
                  </ul>
                </div>
              )}

              <Button
                type="submit"
                data-testid="button-save-settings"
                disabled={updateMutation.isPending || !selectedEngine || (selectedEngine !== "default" && !apiKey.trim())}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                size="lg"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateMutation.isPending ? "Saving..." : "Save Settings"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Advanced Features Card */}
        <Card className="border-2 shadow-lg mt-6">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-purple-600" />
              Advanced Features
            </CardTitle>
            <CardDescription className="text-base">
              Enable advanced AI capabilities for elite sales performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-800">
              <div className="space-y-1 flex-1 mr-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold">Multi-Product Elite AI</h3>
                  <Badge variant="outline" className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700">
                    BETA
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Act like a top 1% sales performer with multi-product intelligence, cross-sell/upsell recommendations, and revenue expansion strategies
                </p>
              </div>
              <Switch
                data-testid="switch-multi-product-elite-ai"
                checked={multiProductEliteAI}
                onCheckedChange={setMultiProductEliteAI}
                className="ml-auto"
              />
            </div>

            {multiProductEliteAI && (
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-sm text-green-900 dark:text-green-100 flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Multi-Product Elite AI enabled
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscription & Plan Card */}
        <Card className="border-2 shadow-lg mt-6">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Crown className="h-6 w-6 text-purple-600" />
              Subscription & Plan
            </CardTitle>
            <CardDescription className="text-base">
              Manage your subscription and upgrade for unlimited access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Plan Status */}
            <div className="p-4 border rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm text-muted-foreground">Current Plan</div>
                  <div className="text-2xl font-bold capitalize">
                    {limitsData?.planType === 'free_trial' && 'Free Trial'}
                    {limitsData?.planType === 'yearly' && '1-Year Professional'}
                    {limitsData?.planType === 'three_year' && '3-Year Professional'}
                  </div>
                </div>
                <Badge 
                  variant={subscriptionData?.subscription?.status === 'active' ? 'default' : 'secondary'}
                  className="text-sm px-3 py-1"
                >
                  {subscriptionData?.subscription?.status || 'trial'}
                </Badge>
              </div>

              {limitsData?.planType === 'free_trial' && (
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sessions Used:</span>
                    <span className="font-semibold">
                      {limitsData.sessionsUsed} / {limitsData.sessionsLimit}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all"
                      style={{ 
                        width: `${limitsData.sessionsLimit ? (limitsData.sessionsUsed / limitsData.sessionsLimit * 100) : 0}%` 
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Minutes Used:</span>
                    <span className="font-semibold">
                      {limitsData.minutesUsed} / {limitsData.minutesLimit}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-emerald-600 to-cyan-600 h-2 rounded-full transition-all"
                      style={{ 
                        width: `${limitsData.minutesLimit ? (limitsData.minutesUsed / limitsData.minutesLimit * 100) : 0}%` 
                      }}
                    />
                  </div>
                </div>
              )}

              {subscriptionData?.subscription?.currentPeriodEnd && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-3">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {limitsData?.planType === 'free_trial' ? 'Trial ends' : 'Renews'} on{' '}
                    {new Date(subscriptionData.subscription.currentPeriodEnd).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {/* Upgrade Button for Free Trial Users */}
            {limitsData?.planType === 'free_trial' && (
              <div className="space-y-3">
                <div className="p-4 border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-lg bg-purple-50/50 dark:bg-purple-950/20">
                  <div className="flex items-start gap-3">
                    <Crown className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">Upgrade to Professional</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Get unlimited sessions, unlimited time, and premium support
                      </p>
                      <ul className="space-y-1.5 text-sm mb-4">
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <span>Unlimited sessions & time</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <span>Free upgrades & 24x5 support</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <span>Starting at $399/year (50% off)</span>
                        </li>
                      </ul>
                      <Button
                        onClick={() => setShowPricingModal(true)}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                        data-testid="button-upgrade-plan"
                      >
                        <Crown className="h-4 w-4 mr-2" />
                        View Plans & Upgrade
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Paid Plan Info */}
            {limitsData?.planType !== 'free_trial' && (
              <div className="space-y-3">
                <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold mb-1">Professional Plan Active</h4>
                      <p className="text-sm text-muted-foreground">
                        You have unlimited access to all features. Enjoy your premium experience!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Pricing Modal */}
      <PricingModal
        open={showPricingModal}
        onOpenChange={setShowPricingModal}
        reason={limitsData?.planType === 'free_trial' ? 'upgrade' : 'renew'}
        currentPlan={limitsData?.planType}
      />
    </div>
  );
}
