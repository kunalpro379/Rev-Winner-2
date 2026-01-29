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

export function FloatingAssistant({ conversationId }: FloatingAssistantProps) {
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

  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50">
      {/* Toggle visibility button */}
      <div className="relative ml-auto">
        <Button
          size="icon"
          variant="outline"
          className="h-10 w-10 rounded-full shadow-lg bg-white dark:bg-gray-900"
          onClick={toggleVisibility}
          data-testid="toggle-assistant-visibility"
          title={preferences.visible ? "Hide assistant" : "Show assistant"}
        >
          <ChevronUp className={`h-4 w-4 transition-transform ${preferences.visible ? '' : 'rotate-180'}`} />
        </Button>
        <span className="absolute -top-1 -right-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
          New
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
                className="h-10 w-10 rounded-full shadow-lg bg-white dark:bg-gray-900 ml-auto"
                data-testid="assistant-settings"
                title="Configure assistant"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent side="left" className="w-72 p-4">
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
              className={`h-14 w-14 rounded-full shadow-lg border-2 ${hoverColor} transition-all hover:scale-110 bg-white dark:bg-gray-900`}
              onClick={() => handleAdviceClick(type)}
              data-testid={`floating-assistant-${type}`}
              title={description}
            >
              <Icon className={`h-6 w-6 ${color}`} />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            side="left"
            className="w-80 p-4"
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
  );
}
