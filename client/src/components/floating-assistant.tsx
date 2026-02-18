import { useState, useEffect } from "react";
import { Lightbulb, Smile, Heart, ChevronUp, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface FloatingAssistantProps {
  conversationId?: string;
  variant?: "floating" | "embedded";
}

type AdviceType = "proverbs" | "humor" | "coaching";

interface AssistantPreferences {
  enabled: {
    proverbs: boolean;
    humor: boolean;
    coaching: boolean;
  };
  visible: boolean;
}

export function FloatingAssistant({ conversationId, variant = "floating" }: FloatingAssistantProps) {
  const [activeAdvice, setActiveAdvice] = useState<{
    type: AdviceType;
    content: string;
  } | null>(null);
  const [openPopover, setOpenPopover] = useState<AdviceType | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  // Load preferences from localStorage
  const [preferences, setPreferences] = useState<AssistantPreferences>(() => {
    const saved = localStorage.getItem("floatingAssistantPrefs");
    return saved ? JSON.parse(saved) : {
      enabled: { proverbs: true, humor: true, coaching: true },
      visible: false,
    };
  });

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("floatingAssistantPrefs", JSON.stringify(preferences));
  }, [preferences]);

  const toggleIcon = (type: AdviceType) => {
    setPreferences(prev => ({
      ...prev,
      enabled: { ...prev.enabled, [type]: !prev.enabled[type] }
    }));
  };

  const toggleVisibility = () => {
    setPreferences(prev => ({ ...prev, visible: !prev.visible }));
  };

  const adviceMutation = useMutation({
    mutationFn: async (type: AdviceType) => {
      const response = await apiRequest("POST", `/api/assistant-advice`, {
        conversationId,
        type,
      });
      const data = await response.json();
      return data;
    },
    onSuccess: (data: { advice: string }, type) => {
      setActiveAdvice({
        type,
        content: data.advice,
      });
    },
  });

  const handleAdviceClick = (type: AdviceType) => {
    setOpenPopover(type);
    adviceMutation.mutate(type);
  };

  const icons = [
    {
      type: "proverbs" as AdviceType,
      Icon: Lightbulb,
      label: "Wisdom",
      description: "Get proverbs to guide closure",
      color: "text-yellow-500 dark:text-yellow-400",
      hoverColor: "hover:bg-yellow-50 dark:hover:bg-yellow-950",
    },
    {
      type: "humor" as AdviceType,
      Icon: Smile,
      label: "Humor",
      description: "Lighten the mood",
      color: "text-blue-500 dark:text-blue-400",
      hoverColor: "hover:bg-blue-50 dark:hover:bg-blue-950",
    },
    {
      type: "coaching" as AdviceType,
      Icon: Heart,
      label: "Coach",
      description: "Friendly guidance for next steps",
      color: "text-pink-500 dark:text-pink-400",
      hoverColor: "hover:bg-pink-50 dark:hover:bg-pink-950",
    },
  ];

  const enabledIcons = icons.filter(icon => preferences.enabled[icon.type]);

  // Embedded variant - inline chat interface
  if (variant === "embedded") {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto space-y-3 p-4">
          {enabledIcons.map(({ type, Icon, label, description, color }) => (
            <div key={type} className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start gap-2 h-auto py-3"
                onClick={() => handleAdviceClick(type)}
                disabled={adviceMutation.isPending}
              >
                <Icon className={`h-5 w-5 ${color}`} />
                <div className="text-left flex-1">
                  <div className="font-medium">{label}</div>
                  <div className="text-xs text-muted-foreground">{description}</div>
                </div>
              </Button>
              
              {adviceMutation.isPending && openPopover === type ? (
                <div className="flex items-center justify-center py-4 bg-muted/50 rounded-md">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : activeAdvice && activeAdvice.type === type ? (
                <div className="p-3 bg-muted/50 rounded-md space-y-2">
                  <p className="text-sm leading-relaxed whitespace-pre-line">
                    {activeAdvice.content}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleAdviceClick(type)}
                    className="w-full"
                  >
                    Get New Advice
                  </Button>
                </div>
              ) : adviceMutation.isError ? (
                <div className="p-3 bg-destructive/10 rounded-md space-y-2">
                  <p className="text-sm text-destructive">
                    Failed to generate advice. Please try again.
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleAdviceClick(type)}
                    className="w-full"
                  >
                    Retry
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
        
        {/* Settings footer */}
        <div className="border-t p-3 bg-muted/30">
          <Popover open={showSettings} onOpenChange={setShowSettings}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                <Settings className="h-4 w-4" />
                Configure Assistant
              </Button>
            </PopoverTrigger>
            <PopoverContent side="top" className="w-72 p-4">
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Sales Assistant Settings</h3>
                <div className="space-y-3">
                  {icons.map(({ type, Icon, label, color }) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${color}`} />
                        <Label htmlFor={`toggle-${type}`} className="text-sm cursor-pointer">
                          {label}
                        </Label>
                      </div>
                      <Switch
                        id={`toggle-${type}`}
                        checked={preferences.enabled[type]}
                        onCheckedChange={() => toggleIcon(type)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    );
  }

  // Floating variant - positioned by parent container
  return (
    <div className="flex flex-col gap-3 z-30" style={{ pointerEvents: 'none' }}>
      <div className="flex flex-col gap-3" style={{ pointerEvents: 'auto' }}>
        {/* Toggle visibility button */}
        <div className="relative ml-auto">
          <Button
            size="icon"
            variant="outline"
            className="h-14 w-14 rounded-full shadow-xl bg-white dark:bg-gray-900 border-2 border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all hover:scale-105"
            onClick={toggleVisibility}
            data-testid="toggle-assistant-visibility"
            title={preferences.visible ? "Hide assistant" : "Show assistant"}
          >
            <ChevronUp className={`h-5 w-5 text-indigo-600 dark:text-indigo-400 transition-transform duration-300 ${preferences.visible ? '' : 'rotate-180'}`} />
          </Button>
          <span className="absolute -top-1 -right-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
            AI
          </span>
        </div>

        {preferences.visible && (
          <>
            {/* Settings button */}
            <Popover open={showSettings} onOpenChange={setShowSettings}>
              <PopoverTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-14 w-14 rounded-full shadow-xl bg-white dark:bg-gray-900 ml-auto border-2 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all hover:scale-105"
                  data-testid="assistant-settings"
                  title="Configure assistant"
                >
                  <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </Button>
              </PopoverTrigger>
              <PopoverContent side="left" className="w-72 p-4 shadow-xl">
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm">Sales Assistant Settings</h3>
                  <div className="space-y-3">
                    {icons.map(({ type, Icon, label, color }) => (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${color}`} />
                          <Label htmlFor={`toggle-${type}`} className="text-sm cursor-pointer">
                            {label}
                          </Label>
                        </div>
                        <Switch
                          id={`toggle-${type}`}
                          checked={preferences.enabled[type]}
                          onCheckedChange={() => toggleIcon(type)}
                          data-testid={`toggle-${type}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Advice icons */}
            {enabledIcons.map(({ type, Icon, label, description, color, hoverColor }) => (
              <Popover
                key={type}
                open={openPopover === type}
                onOpenChange={(open) => {
                  if (!open) {
                    setOpenPopover(null);
                    setActiveAdvice(null);
                  }
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    size="icon"
                    variant="outline"
                    className={`h-16 w-16 rounded-full shadow-xl border-2 ${hoverColor} transition-all hover:scale-110 bg-white dark:bg-gray-900 hover:shadow-2xl`}
                    onClick={() => handleAdviceClick(type)}
                    data-testid={`floating-assistant-${type}`}
                    title={description}
                  >
                    <Icon className={`h-7 w-7 ${color}`} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  side="left"
                  className="w-80 p-4 shadow-xl"
                  data-testid={`popover-${type}`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-5 w-5 ${color}`} />
                      <h3 className="font-semibold text-sm">{label}</h3>
                    </div>
                    
                    {adviceMutation.isPending && openPopover === type ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : activeAdvice && activeAdvice.type === type ? (
                      <div className="space-y-2">
                        <p className="text-sm leading-relaxed whitespace-pre-line" data-testid={`advice-content-${type}`}>
                          {activeAdvice.content}
                        </p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAdviceClick(type)}
                          className="w-full"
                          data-testid={`refresh-advice-${type}`}
                        >
                          Get New Advice
                        </Button>
                      </div>
                    ) : adviceMutation.isError ? (
                      <div className="space-y-2">
                        <p className="text-sm text-destructive">
                          Failed to generate advice. Please try again.
                        </p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAdviceClick(type)}
                          className="w-full"
                        >
                          Retry
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </PopoverContent>
              </Popover>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
