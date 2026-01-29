import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Brain, Sparkles, Zap, Globe, Shield, Moon, Crown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

interface AIEngineSetupProps {
  open: boolean;
  onComplete: () => void;
}

export function AIEngineSetup({ open, onComplete }: AIEngineSetupProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEngine, setSelectedEngine] = useState<string>("");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);

  const setupMutation = useMutation({
    mutationFn: async (data: { aiEngine: string; apiKey: string }) => {
      return apiRequest("POST", "/api/auth/ai-engine-settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/ai-engine-settings"] });
      toast({
        title: "Success!",
        description: "Your AI engine has been configured successfully.",
      });
      onComplete();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to configure AI engine",
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
    
    setupMutation.mutate({ aiEngine: selectedEngine, apiKey: selectedEngine === "default" ? "default" : apiKey.trim() });
  };

  const selectedEngineData = AI_ENGINES.find(e => e.value === selectedEngine);

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Setup Your AI Engine
          </DialogTitle>
          <DialogDescription className="text-base">
            Choose your preferred AI engine and enter your API key to get started with Rev Winner.
          </DialogDescription>
        </DialogHeader>

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
                API Key
              </Label>
              <div className="relative">
                <Input
                  id="api-key"
                  data-testid="input-api-key"
                  type={showApiKey ? "text" : "password"}
                  placeholder="Enter your API key"
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

          <DialogFooter>
            <Button
              type="submit"
              data-testid="button-setup-complete"
              disabled={setupMutation.isPending || !selectedEngine || (selectedEngine !== "default" && !apiKey.trim())}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {setupMutation.isPending ? "Setting up..." : "Complete Setup"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
