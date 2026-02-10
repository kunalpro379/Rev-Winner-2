import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, TrendingUp, Target, Wrench, Brain, Trophy, RefreshCw, MessageSquare, ChevronDown, ChevronUp, Pause, Play } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ShiftGearsTip {
  type: "rebuttal" | "objection" | "next_step" | "technical" | "psychological" | "closure" | "competitive" | "discovery";
  title: string;
  action: string;
  priority: "high" | "medium" | "low";
}

interface QueryPitch {
  query: string;
  queryType: "technical" | "pricing" | "features" | "integration" | "support" | "general";
  pitch: string;
  keyPoints: string[];
}

interface ShiftGearsProps {
  sessionId: string;
  transcriptText: string;
  domainExpertise?: string;
  isTranscribing: boolean;
  resetVersion?: number;
}

const typeIcons = {
  rebuttal: Target,
  objection: Wrench,
  next_step: TrendingUp,
  technical: Wrench,
  psychological: Brain,
  closure: Trophy,
  competitive: Target,
  discovery: MessageSquare,
};

const typeColors = {
  rebuttal: "bg-blue-100 dark:bg-blue-950 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-100",
  objection: "bg-orange-100 dark:bg-orange-950 border-orange-300 dark:border-orange-800 text-orange-900 dark:text-orange-100",
  next_step: "bg-green-100 dark:bg-green-950 border-green-300 dark:border-green-800 text-green-900 dark:text-green-100",
  technical: "bg-purple-100 dark:bg-purple-950 border-purple-300 dark:border-purple-800 text-purple-900 dark:text-purple-100",
  psychological: "bg-pink-100 dark:bg-pink-950 border-pink-300 dark:border-pink-800 text-pink-900 dark:text-pink-100",
  closure: "bg-amber-100 dark:bg-amber-950 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-100",
  competitive: "bg-red-100 dark:bg-red-950 border-red-300 dark:border-red-800 text-red-900 dark:text-red-100",
  discovery: "bg-cyan-100 dark:bg-cyan-950 border-cyan-300 dark:border-cyan-800 text-cyan-900 dark:text-cyan-100",
};

const priorityBadgeColors = {
  high: "bg-red-600 text-white hover:bg-red-700",
  medium: "bg-yellow-600 text-white hover:bg-yellow-700",
  low: "bg-gray-600 text-white hover:bg-gray-700",
};

const queryTypeColors = {
  technical: "bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-100 border-purple-300 dark:border-purple-700",
  pricing: "bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100 border-green-300 dark:border-green-700",
  features: "bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 border-blue-300 dark:border-blue-700",
  integration: "bg-orange-100 dark:bg-orange-900/30 text-orange-900 dark:text-orange-100 border-orange-300 dark:border-orange-700",
  support: "bg-pink-100 dark:bg-pink-900/30 text-pink-900 dark:text-pink-100 border-pink-300 dark:border-pink-700",
  general: "bg-gray-100 dark:bg-gray-900/30 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700",
};

export function ShiftGears({ sessionId, transcriptText, domainExpertise, isTranscribing, resetVersion = 0 }: ShiftGearsProps) {
  const [tips, setTips] = useState<ShiftGearsTip[]>([]);
  const [pitches, setPitches] = useState<QueryPitch[]>([]);
  const [lastTranscript, setLastTranscript] = useState<string>("");
  const [lastPitchTranscript, setLastPitchTranscript] = useState<string>("");
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);
  const [lastPitchUpdateTime, setLastPitchUpdateTime] = useState<number>(0);
  const [isPitchesOpen, setIsPitchesOpen] = useState(false);
  const [isAutoPaused, setIsAutoPaused] = useState(false);
  const [isPitchesAutoPaused, setIsPitchesAutoPaused] = useState(false);
  const [hasReceivedFirstTip, setHasReceivedFirstTip] = useState(false);
  const [hasReceivedFirstPitch, setHasReceivedFirstPitch] = useState(false);
  const { toast } = useToast();
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pitchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pitchesEndRef = useRef<HTMLDivElement>(null);
  const pitchesScrollRef = useRef<HTMLDivElement>(null);
  
  // Refs for initial fetch tracking (declared here for reset access)
  const hasFetchedFirstTipRef = useRef(false);
  const hasFetchedFirstPitchRef = useRef(false);
  
  // Reset all local state when parent triggers new session
  useEffect(() => {
    if (resetVersion > 0) {
      setTips([]);
      setPitches([]);
      setLastTranscript("");
      setLastPitchTranscript("");
      setLastUpdateTime(0);
      setLastPitchUpdateTime(0);
      setIsPitchesOpen(false);
      setIsAutoPaused(false);
      setIsPitchesAutoPaused(false);
      setHasReceivedFirstTip(false);
      setHasReceivedFirstPitch(false);
      hasFetchedFirstTipRef.current = false;
      hasFetchedFirstPitchRef.current = false;
      
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
        updateTimerRef.current = null;
      }
      if (pitchTimerRef.current) {
        clearTimeout(pitchTimerRef.current);
        pitchTimerRef.current = null;
      }
    }
  }, [resetVersion]);

  const fetchTipsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/conversations/${sessionId}/shift-gears`, {
        transcriptText,
        domainExpertise
      });
      return response.json();
    },
    onSuccess: (data) => {
      const newTips = data.tips || [];
      
      if (newTips.length > 0) {
        // REAL-TIME UPDATE: Replace old tips with fresh ones (no historical piling)
        setTips(newTips);
      }
      
      setLastTranscript(transcriptText);
      setLastUpdateTime(Date.now());
      
      if (newTips.length > 0) {
        setIsAutoPaused(true);
        if (!hasReceivedFirstTip) {
          setHasReceivedFirstTip(true);
          toast({
            title: "Shift Gears Ready",
            description: "Review the tips, then click Play to continue monitoring",
          });
        }
        console.log(`⏸️ Shift Gears: Auto-paused after response - ${newTips.length} fresh tips (replaced old ones)`);
      }
    },
    onError: (error: any) => {
      console.error("Shift Gears error:", error);
      toast({
        title: "Error",
        description: "Failed to update shift gears tips",
        variant: "destructive"
      });
      
      setLastTranscript(transcriptText);
      setLastUpdateTime(Date.now());
    }
  });

  const fetchPitchesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/conversations/${sessionId}/query-pitches`, {
        transcriptText,
        domainExpertise
      });
      return response.json();
    },
    onSuccess: (data) => {
      const newPitches = data.pitches || [];
      
      if (newPitches.length > 0) {
        // REAL-TIME UPDATE: Replace old pitches with fresh ones (no historical piling)
        setPitches(newPitches);
        
        if (!isPitchesOpen) {
          setIsPitchesOpen(true);
        }
      }
      
      setLastPitchTranscript(transcriptText);
      setLastPitchUpdateTime(Date.now());
      
      if (newPitches.length > 0) {
        setIsPitchesAutoPaused(true);
        if (!hasReceivedFirstPitch) {
          setHasReceivedFirstPitch(true);
          toast({
            title: "Query Pitch Ready",
            description: "Review the pitch response, then click Play to continue",
          });
        }
        console.log(`⏸️ Query Pitches: Auto-paused after response - ${newPitches.length} fresh pitches (replaced old ones)`);
      }
    },
    onError: (error: any) => {
      console.error("Query pitch error:", error);
      setLastPitchTranscript(transcriptText);
      setLastPitchUpdateTime(Date.now());
    }
  });

  const formatTextWithMarkdown = (text: string): JSX.Element | string => {
    if (!text) return text;
    
    // Convert markdown-style formatting to React elements
    const parts: (string | JSX.Element)[] = [];
    let currentIndex = 0;
    
    // Pattern to match **bold** text
    const boldPattern = /\*\*(.*?)\*\*/g;
    let match;
    let keyCounter = 0;
    
    while ((match = boldPattern.exec(text)) !== null) {
      // Add text before bold
      if (match.index > currentIndex) {
        parts.push(text.substring(currentIndex, match.index));
      }
      // Add bold text
      parts.push(<strong key={`bold-${keyCounter++}`} className="font-bold text-current">{match[1]}</strong>);
      currentIndex = boldPattern.lastIndex;
    }
    
    // Add remaining text
    if (currentIndex < text.length) {
      parts.push(text.substring(currentIndex));
    }
    
    return parts.length > 1 ? <>{parts}</> : text;
  };

  const formatPitchText = (text: string) => {
    if (!text) return { formatted: null, hasSections: false };
    
    const formatted = formatTextWithMarkdown(text);
    
    // Detect if text has structured sections
    const hasSections = /\[(SOLUTION|VALUE|TECHNICAL|CASE STUDY|COMPETITOR|WHY BETTER)\]|SOLUTION:|VALUE:|TECHNICAL:|CASE STUDY:|COMPETITOR:|WHY BETTER:/i.test(text);
    
    return { formatted: formatted !== text ? formatted : null, hasSections };
  };

  // Auto-update logic for tips: trigger when transcript changes significantly
  // OPTIMIZED: Near real-time updates (3s throttle + 1s debounce = ~4s response time)
  useEffect(() => {
    // Skip auto-updates if paused
    if (isAutoPaused || !isTranscribing || !transcriptText.trim()) {
      return;
    }

    // OPTIMIZED: Lower threshold (15 chars) for faster detection of conversation changes
    const transcriptChanged = Math.abs(transcriptText.length - lastTranscript.length) > 15;
    
    if (!transcriptChanged || fetchTipsMutation.isPending) {
      return;
    }

    // OPTIMIZED: Calculate when we can next fetch (3 seconds after last update for near real-time speed)
    const timeSinceLastUpdate = Date.now() - lastUpdateTime;
    const timeUntilNextAllowedFetch = Math.max(0, 3000 - timeSinceLastUpdate);

    // Clear any existing timer
    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current);
    }

    // OPTIMIZED: Minimal debounce (1 second) for near real-time response
    const delayMs = timeUntilNextAllowedFetch + 1000;
    
    updateTimerRef.current = setTimeout(() => {
      if (!fetchTipsMutation.isPending) {
        fetchTipsMutation.mutate();
      }
    }, delayMs);

    return () => {
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
      }
    };
  }, [transcriptText, isTranscribing, isAutoPaused]);

  // Auto-update logic for query pitches: trigger when transcript changes
  useEffect(() => {
    // Skip auto-updates if paused
    if (isPitchesAutoPaused || !isTranscribing || !transcriptText.trim()) {
      return;
    }

    // Detect NEW question marks by checking if the new transcript portion has a question mark
    const newTranscriptPortion = transcriptText.slice(lastPitchTranscript.length);
    const hasNewQuestion = newTranscriptPortion.includes('?');
    
    // Check if transcript has changed enough to warrant an update
    const transcriptChanged = Math.abs(transcriptText.length - lastPitchTranscript.length) > 15;
    const needsUpdate = transcriptChanged || hasNewQuestion;
    
    if (!needsUpdate || fetchPitchesMutation.isPending) {
      return;
    }

    // Calculate when we can next fetch (3 seconds after last update for real-time speed)
    const timeSinceLastPitchUpdate = Date.now() - lastPitchUpdateTime;
    const timeUntilNextAllowedFetch = Math.max(0, 3000 - timeSinceLastPitchUpdate);

    // Clear any existing timer
    if (pitchTimerRef.current) {
      clearTimeout(pitchTimerRef.current);
    }

    // Schedule fetch: minimal debounce (1 second) for near real-time response
    const delayMs = timeUntilNextAllowedFetch + 1000;
    
    pitchTimerRef.current = setTimeout(() => {
      if (!fetchPitchesMutation.isPending) {
        fetchPitchesMutation.mutate();
      }
    }, delayMs);

    return () => {
      if (pitchTimerRef.current) {
        clearTimeout(pitchTimerRef.current);
      }
    };
  }, [transcriptText, isTranscribing, isPitchesAutoPaused]);

  // INITIAL FETCH: Trigger first response when meaningful content is detected
  useEffect(() => {
    if (!hasFetchedFirstTipRef.current && !isAutoPaused && !fetchTipsMutation.isPending) {
      const hasEnoughContent = transcriptText.trim().length > 50;
      const hasMeaningfulSignal = transcriptText.includes('?') || transcriptText.includes('.') || hasEnoughContent;
      
      if (hasMeaningfulSignal && transcriptText.trim().length > 30) {
        hasFetchedFirstTipRef.current = true;
        console.log('Shift Gears: Initial fetch triggered - detected meaningful content');
        fetchTipsMutation.mutate();
      }
    }
  }, [transcriptText, isAutoPaused, fetchTipsMutation.isPending]);
  
  useEffect(() => {
    if (!hasFetchedFirstPitchRef.current && !isPitchesAutoPaused && !fetchPitchesMutation.isPending) {
      const hasQuestion = transcriptText.includes('?');
      const hasEnoughContent = transcriptText.trim().length > 50;
      
      if ((hasQuestion || hasEnoughContent) && transcriptText.trim().length > 30) {
        hasFetchedFirstPitchRef.current = true;
        console.log('Query Pitches: Initial fetch triggered - detected question or content');
        fetchPitchesMutation.mutate();
      }
    }
  }, [transcriptText, isPitchesAutoPaused, fetchPitchesMutation.isPending]);

  // RESUME FETCH: When unpaused, only fetch if transcript has advanced since last response
  const prevAutoPausedRef = useRef(isAutoPaused);
  useEffect(() => {
    const wasJustUnpaused = prevAutoPausedRef.current && !isAutoPaused;
    prevAutoPausedRef.current = isAutoPaused;
    
    if (wasJustUnpaused && transcriptText.trim() && !fetchTipsMutation.isPending) {
      const newContent = transcriptText.slice(lastTranscript.length);
      const hasNewContent = newContent.length > 15;
      const hasNewQuestion = newContent.includes('?');
      const hasNewStatement = newContent.includes('.');
      
      if (hasNewContent || hasNewQuestion || hasNewStatement) {
        console.log('▶️ Shift Gears: Resumed with new content, processing...');
        fetchTipsMutation.mutate();
      } else {
        console.log('▶️ Shift Gears: Resumed - waiting for next conversation shift');
      }
    }
  }, [isAutoPaused]);

  // RESUME FETCH: Fetch pitches when unpaused ONLY if transcript has advanced
  const prevPitchesAutoPausedRef = useRef(isPitchesAutoPaused);
  useEffect(() => {
    const wasJustUnpaused = prevPitchesAutoPausedRef.current && !isPitchesAutoPaused;
    prevPitchesAutoPausedRef.current = isPitchesAutoPaused;
    
    if (wasJustUnpaused && transcriptText.trim() && !fetchPitchesMutation.isPending) {
      const hasNewContent = transcriptText.length > lastPitchTranscript.length + 15;
      const newTranscriptPortion = transcriptText.slice(lastPitchTranscript.length);
      const hasNewQuestion = newTranscriptPortion.includes('?');
      
      if (hasNewContent || hasNewQuestion) {
        console.log('▶️ Query Pitches: Resumed with new content/question, processing...');
        fetchPitchesMutation.mutate();
      } else {
        console.log('▶️ Query Pitches: Resumed but no new content - waiting for next query');
      }
    }
  }, [isPitchesAutoPaused]);

  // Auto-scroll to show latest pitches when new ones are added
  useEffect(() => {
    if (pitches.length > 0 && pitchesEndRef.current) {
      pitchesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [pitches.length]);

  const handleManualRefresh = () => {
    if (!fetchTipsMutation.isPending && !isAutoPaused) {
      fetchTipsMutation.mutate();
    }
  };

  const handleManualPitchesRefresh = () => {
    if (!fetchPitchesMutation.isPending && !isPitchesAutoPaused) {
      fetchPitchesMutation.mutate();
    }
  };

  if (!transcriptText.trim()) {
    return (
      <Card className="shadow-lg border-2 border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50/50 to-purple-50/30 dark:from-indigo-950/30 dark:to-purple-950/20 h-full flex flex-col">
        <CardHeader className="pb-4 border-b border-indigo-200/50 dark:border-indigo-800/50">
          <CardTitle className="text-xl flex items-center gap-2.5 font-bold text-indigo-900 dark:text-indigo-100">
            <div className="p-2 bg-indigo-600 dark:bg-indigo-500 rounded-lg shadow-md">
              <Zap className="h-5 w-5 text-white" />
            </div>
            Shift Gears
          </CardTitle>
          <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-1.5 font-medium">
            Real-time tips to close deals faster
          </p>
        </CardHeader>
        <CardContent className="pt-6 flex-1">
          <div className="flex items-center justify-center h-full min-h-[200px]">
            <p className="text-center text-muted-foreground text-sm">
              Start your conversation to get smart, actionable tips
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-2 border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50/50 to-purple-50/30 dark:from-indigo-950/30 dark:to-purple-950/20 h-full flex flex-col min-h-[500px]">
      <CardHeader className="pb-4 border-b border-indigo-200/50 dark:border-indigo-800/50">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 flex items-start gap-3 text-left">
            <div className="p-2 bg-indigo-600 dark:bg-indigo-500 rounded-lg shadow-md">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-xl font-bold text-indigo-900 dark:text-indigo-100">
                  Shift Gears
                </CardTitle>
                {isAutoPaused && tips.length > 0 && (
                  <Badge className="bg-yellow-500 text-white text-xs animate-pulse">PAUSED</Badge>
                )}
              </div>
              <p className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">
                {fetchTipsMutation.isPending 
                  ? "Analyzing conversation..." 
                  : isAutoPaused && tips.length > 0
                    ? "Click Play to detect next conversation shift"
                    : "Smart tips to move the deal forward"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAutoPaused(!isAutoPaused)}
                data-testid="button-toggle-auto-shift-gears"
                className={`h-9 border-indigo-300 dark:border-indigo-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 ${
                  isAutoPaused 
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-400 dark:border-yellow-600' 
                    : 'text-indigo-700 dark:text-indigo-300'
                }`}
                title={isAutoPaused ? "Auto-updates paused. Click to resume." : "Auto-updates active. Click to pause."}
              >
                {isAutoPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                disabled={fetchTipsMutation.isPending || isAutoPaused}
                data-testid="button-refresh-shift-gears"
                className="h-9 border-indigo-300 dark:border-indigo-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300"
                title={isAutoPaused ? "Click Play first to refresh" : "Refresh tips"}
              >
                <RefreshCw className={`h-4 w-4 ${fetchTipsMutation.isPending ? 'animate-spin' : ''}`} />
              </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 flex-1">
        {tips.length === 0 && !fetchTipsMutation.isPending ? (
          <div className="flex items-center justify-center h-full min-h-[200px]">
            <p className="text-center text-muted-foreground text-sm">
              Continue the conversation to get smart tips
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tips.map((tip, index) => {
              const Icon = typeIcons[tip.type] || Zap;
              const colorClass = typeColors[tip.type] || "bg-gray-100 dark:bg-gray-950 border-gray-300 dark:border-gray-800 text-gray-900 dark:text-gray-100";
              const priorityColor = priorityBadgeColors[tip.priority] || "bg-gray-600 text-white hover:bg-gray-700";

              return (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 ${colorClass} transition-all hover:shadow-md`}
                  data-testid={`shift-gear-tip-${index}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-semibold text-sm leading-tight" data-testid={`tip-title-${index}`}>
                          {tip.title}
                        </h4>
                        <Badge className={`text-xs px-2 py-0.5 ${priorityColor}`} data-testid={`tip-priority-${index}`}>
                          {tip.priority.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm leading-relaxed" data-testid={`tip-action-${index}`}>
                        {tip.action}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {tip.type.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Query Pitch Subsection */}
        {transcriptText.trim() && (
          <div className="mt-6 pt-6 border-t-2 border-indigo-200/50 dark:border-indigo-800/50">
            <Collapsible open={isPitchesOpen} onOpenChange={setIsPitchesOpen}>
              <div className="flex items-center justify-between gap-3 p-4 rounded-lg bg-gradient-to-r from-fuchsia-50 to-purple-50 dark:from-fuchsia-950/30 dark:to-purple-950/30 transition-all border-2 border-fuchsia-200/50 dark:border-fuchsia-800/50">
                <CollapsibleTrigger className="flex-1 flex items-center justify-between group" data-testid="toggle-query-pitches">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-fuchsia-600 dark:bg-fuchsia-500 rounded-md shadow-sm group-hover:scale-105 transition-transform">
                      <MessageSquare className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-fuchsia-900 dark:text-fuchsia-100">
                          Customer Query Pitches
                          {pitches.length > 0 && (
                            <span className="ml-2 text-sm font-normal text-fuchsia-700 dark:text-fuchsia-300">({pitches.length})</span>
                          )}
                        </h3>
                        {isPitchesAutoPaused && pitches.length > 0 && (
                          <Badge className="bg-yellow-500 text-white text-xs animate-pulse">PAUSED</Badge>
                        )}
                      </div>
                      {isPitchesAutoPaused && pitches.length > 0 && (
                        <p className="text-xs text-fuchsia-600 dark:text-fuchsia-400">Click Play to detect next query</p>
                      )}
                    </div>
                  </div>
                  {isPitchesOpen ? (
                    <ChevronUp className="h-5 w-5 text-fuchsia-600 dark:text-fuchsia-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-fuchsia-600 dark:text-fuchsia-400" />
                  )}
                </CollapsibleTrigger>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPitchesAutoPaused(!isPitchesAutoPaused)}
                    data-testid="button-toggle-auto-query-pitches"
                    className={`h-8 border-fuchsia-300 dark:border-fuchsia-700 hover:bg-fuchsia-100 dark:hover:bg-fuchsia-900/50 ${
                      isPitchesAutoPaused 
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-400 dark:border-yellow-600' 
                        : 'text-fuchsia-700 dark:text-fuchsia-300'
                    }`}
                    title={isPitchesAutoPaused ? "Auto-updates paused. Click to resume and sync with live transcript." : "Auto-updates active. Click to pause."}
                  >
                    {isPitchesAutoPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManualPitchesRefresh}
                    disabled={fetchPitchesMutation.isPending || isPitchesAutoPaused}
                    data-testid="button-refresh-query-pitches"
                    className="h-8 border-fuchsia-300 dark:border-fuchsia-700 hover:bg-fuchsia-100 dark:hover:bg-fuchsia-900/50 text-fuchsia-700 dark:text-fuchsia-300"
                    title={isPitchesAutoPaused ? "Click Play first to refresh" : "Refresh pitches"}
                  >
                    <RefreshCw className={`h-4 w-4 ${fetchPitchesMutation.isPending ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
              
              <CollapsibleContent className="mt-3">
                {fetchPitchesMutation.isPending ? (
                  <div className="text-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-fuchsia-600 dark:border-fuchsia-400 mx-auto mb-2"></div>
                    <p className="text-xs text-muted-foreground">Analyzing customer queries...</p>
                  </div>
                ) : pitches.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-4">
                    No customer queries detected yet. Keep the conversation going!
                  </p>
                ) : (
                  <div className="relative">
                    {pitches.length > 3 && (
                      <div className="text-xs text-center text-fuchsia-600 dark:text-fuchsia-400 mb-2 flex items-center justify-center gap-1">
                        <ChevronUp className="h-3 w-3" />
                        <span>Scroll up for {pitches.length - 3} more {pitches.length - 3 === 1 ? 'response' : 'responses'}</span>
                      </div>
                    )}
                    <ScrollArea className="h-[480px] pr-3" ref={pitchesScrollRef}>
                      <div className="space-y-3" data-testid="pitch-responses-container">
                        {pitches.map((pitch, index) => {
                          const colorClass = queryTypeColors[pitch.queryType];

                          return (
                            <div
                              key={index}
                              className={`p-4 rounded-lg border-2 ${colorClass} transition-all hover:shadow-md`}
                              data-testid={`query-pitch-${index}`}
                            >
                              <div className="space-y-3">
                                {/* Query Header */}
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <MessageSquare className="h-4 w-4 flex-shrink-0" />
                                      <Badge variant="outline" className="text-xs">
                                        {pitch.queryType.replace('_', ' ').toUpperCase()}
                                      </Badge>
                                    </div>
                                    <p className="text-sm font-semibold italic leading-tight" data-testid={`pitch-query-${index}`}>
                                      "{pitch.query}"
                                    </p>
                                  </div>
                                </div>

                                {/* Pitch Response */}
                                <div className="bg-white/50 dark:bg-black/20 p-3 rounded-md">
                                  {(() => {
                                    const { formatted, hasSections } = formatPitchText(pitch.pitch);
                                    return (
                                      <div
                                        className={`text-sm leading-relaxed ${hasSections ? "space-y-2" : ""}`}
                                        data-testid={`pitch-response-${index}`}
                                      >
                                        {formatted ? formatted : pitch.pitch}
                                      </div>
                                    );
                                  })()}
                                </div>

                                {/* Key Points */}
                                {pitch.keyPoints && pitch.keyPoints.length > 0 && (
                                  <div className="space-y-1.5">
                                    {pitch.keyPoints.map((point, pIndex) => (
                                      <div key={pIndex} className="flex items-start gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-current mt-1.5 flex-shrink-0"></div>
                                        <div className="text-xs leading-relaxed" data-testid={`pitch-point-${index}-${pIndex}`}>
                                          {formatTextWithMarkdown(point)}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        <div ref={pitchesEndRef} />
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
