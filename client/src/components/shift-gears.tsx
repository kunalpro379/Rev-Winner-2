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
  type: "rebuttal" | "objection" | "next_step" | "technical" | "psychological" | "closure" | "competitive" | "discovery" | "qualification" | "trust_building" | "risk_alert";
  title: string;
  action: string;
  priority: "high" | "medium" | "low";
  expected_reaction?: string;
}

interface QueryPitch {
  query: string;
  queryType: "technical" | "pricing" | "features" | "integration" | "support" | "general" | "comparison" | "challenge";
  pitch: string;
  keyPoints: string[];
  followUpQuestion?: string;
}

interface ShiftGearsProps {
  sessionId: string;
  transcriptText: string;
  domainExpertise?: string;
  isTranscribing: boolean;
  resetVersion?: number;
}

const typeIcons: Record<string, any> = {
  rebuttal: Target,
  objection: Wrench,
  next_step: TrendingUp,
  technical: Wrench,
  psychological: Brain,
  closure: Trophy,
  competitive: Target,
  discovery: MessageSquare,
  qualification: Target,
  trust_building: Brain,
  risk_alert: Zap,
};

const typeColors: Record<string, string> = {
  rebuttal: "bg-blue-100 dark:bg-blue-950 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-100",
  objection: "bg-orange-100 dark:bg-orange-950 border-orange-300 dark:border-orange-800 text-orange-900 dark:text-orange-100",
  next_step: "bg-green-100 dark:bg-green-950 border-green-300 dark:border-green-800 text-green-900 dark:text-green-100",
  technical: "bg-purple-100 dark:bg-purple-950 border-purple-300 dark:border-purple-800 text-purple-900 dark:text-purple-100",
  psychological: "bg-pink-100 dark:bg-pink-950 border-pink-300 dark:border-pink-800 text-pink-900 dark:text-pink-100",
  closure: "bg-amber-100 dark:bg-amber-950 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-100",
  competitive: "bg-red-100 dark:bg-red-950 border-red-300 dark:border-red-800 text-red-900 dark:text-red-100",
  discovery: "bg-cyan-100 dark:bg-cyan-950 border-cyan-300 dark:border-cyan-800 text-cyan-900 dark:text-cyan-100",
  qualification: "bg-indigo-100 dark:bg-indigo-950 border-indigo-300 dark:border-indigo-800 text-indigo-900 dark:text-indigo-100",
  trust_building: "bg-teal-100 dark:bg-teal-950 border-teal-300 dark:border-teal-800 text-teal-900 dark:text-teal-100",
  risk_alert: "bg-rose-100 dark:bg-rose-950 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100",
};

const priorityBadgeColors = {
  high: "bg-red-600 text-white hover:bg-red-700",
  medium: "bg-yellow-600 text-white hover:bg-yellow-700",
  low: "bg-gray-600 text-white hover:bg-gray-700",
};

const queryTypeColors: Record<string, string> = {
  technical: "bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-100 border-purple-300 dark:border-purple-700",
  pricing: "bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100 border-green-300 dark:border-green-700",
  features: "bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 border-blue-300 dark:border-blue-700",
  integration: "bg-orange-100 dark:bg-orange-900/30 text-orange-900 dark:text-orange-100 border-orange-300 dark:border-orange-700",
  support: "bg-pink-100 dark:bg-pink-900/30 text-pink-900 dark:text-pink-100 border-pink-300 dark:border-pink-700",
  general: "bg-gray-100 dark:bg-gray-900/30 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700",
  comparison: "bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-100 border-red-300 dark:border-red-700",
  challenge: "bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100 border-amber-300 dark:border-amber-700",
};

export function ShiftGears({ sessionId, transcriptText, domainExpertise, isTranscribing, resetVersion = 0 }: ShiftGearsProps) {
  const [tips, setTips] = useState<ShiftGearsTip[]>([]);
  const [pitches, setPitches] = useState<QueryPitch[]>([]);
  const [lastTranscript, setLastTranscript] = useState<string>("");
  const [lastPitchTranscript, setLastPitchTranscript] = useState<string>("");
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);
  const [lastPitchUpdateTime, setLastPitchUpdateTime] = useState<number>(0);
  const [isPitchesOpen, setIsPitchesOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
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
      setIsOpen(true);
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
      const tipsChanged = JSON.stringify(newTips) !== JSON.stringify(tips);
      
      if (tipsChanged) {
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
        console.log('⏸️ Shift Gears: Auto-paused after response - review tips before continuing');
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
      
      // FIXED: Replace old pitches instead of accumulating
      // Only keep unique queries based on query text
      const uniquePitches = newPitches.filter((newPitch: QueryPitch, index: number, self: QueryPitch[]) => 
        index === self.findIndex((p) => p.query.toLowerCase().trim() === newPitch.query.toLowerCase().trim())
      );
      
      const pitchesChanged = JSON.stringify(uniquePitches) !== JSON.stringify(pitches);
      
      if (pitchesChanged) {
        setPitches(uniquePitches);
        if (uniquePitches.length > 0 && !isPitchesOpen) {
          setIsPitchesOpen(true);
        }
      }
      
      setLastPitchTranscript(transcriptText);
      setLastPitchUpdateTime(Date.now());
      
      if (uniquePitches.length > 0) {
        setIsPitchesAutoPaused(true);
        if (!hasReceivedFirstPitch) {
          setHasReceivedFirstPitch(true);
          toast({
            title: "Query Pitch Ready",
            description: "Review the pitch response, then click Play to continue",
          });
        }
        console.log('⏸️ Query Pitches: Auto-paused after response - review pitch before continuing');
      }
    },
    onError: (error: any) => {
      console.error("Query pitch error:", error);
      setLastPitchTranscript(transcriptText);
      setLastPitchUpdateTime(Date.now());
    }
  });

  // Auto-update logic for tips: trigger when transcript changes significantly
  // OPTIMIZED: Near real-time updates (2s throttle + 0.5s debounce = ~2.5s response time)
  useEffect(() => {
    if (isAutoPaused || !isTranscribing || !transcriptText.trim()) {
      return;
    }

    const transcriptChanged = Math.abs(transcriptText.length - lastTranscript.length) > 15;
    
    if (!transcriptChanged || fetchTipsMutation.isPending) {
      return;
    }

    const timeSinceLastUpdate = Date.now() - lastUpdateTime;
    const timeUntilNextAllowedFetch = Math.max(0, 2000 - timeSinceLastUpdate);

    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current);
    }

    const delayMs = timeUntilNextAllowedFetch + 500;
    
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

    const timeSinceLastPitchUpdate = Date.now() - lastPitchUpdateTime;
    const timeUntilNextAllowedFetch = Math.max(0, 2000 - timeSinceLastPitchUpdate);

    if (pitchTimerRef.current) {
      clearTimeout(pitchTimerRef.current);
    }

    const delayMs = timeUntilNextAllowedFetch + 500;
    
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
        console.log('🚀 Shift Gears: Initial fetch triggered - detected meaningful content');
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
        console.log('🚀 Query Pitches: Initial fetch triggered - detected question or content');
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
    if (!fetchTipsMutation.isPending) {
      if (isAutoPaused) setIsAutoPaused(false);
      fetchTipsMutation.mutate();
    }
  };

  const handleManualPitchesRefresh = () => {
    if (!fetchPitchesMutation.isPending) {
      if (isPitchesAutoPaused) setIsPitchesAutoPaused(false);
      fetchPitchesMutation.mutate();
    }
  };

  if (!transcriptText.trim()) {
    return (
      <Card className="w-full h-full shadow-lg border-2 border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50/50 to-purple-50/30 dark:from-indigo-950/30 dark:to-purple-950/20 flex flex-col">
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
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground text-sm py-6">
            Start your conversation to get smart, actionable tips
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-full shadow-lg border-2 border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50/50 to-purple-50/30 dark:from-indigo-950/30 dark:to-purple-950/20 flex flex-col">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-4 border-b border-indigo-200/50 dark:border-indigo-800/50">
          <div className="flex items-center justify-between gap-3">
            <CollapsibleTrigger className="flex-1 flex items-start gap-3 text-left group" data-testid="toggle-shift-gears">
              <div className="p-2 bg-indigo-600 dark:bg-indigo-500 rounded-lg shadow-md group-hover:scale-105 transition-transform">
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
              {isOpen ? (
                <ChevronUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mt-2 flex-shrink-0" />
              ) : (
                <ChevronDown className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mt-2 flex-shrink-0" />
              )}
            </CollapsibleTrigger>
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
                disabled={fetchTipsMutation.isPending}
                data-testid="button-refresh-shift-gears"
                className="h-9 border-indigo-300 dark:border-indigo-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300"
                title="Refresh tips"
              >
                <RefreshCw className={`h-4 w-4 ${fetchTipsMutation.isPending ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-6">
        {tips.length === 0 && !fetchTipsMutation.isPending ? (
          <p className="text-center text-muted-foreground text-sm py-8">
            Continue the conversation to get smart tips
          </p>
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
                      {tip.expected_reaction && (
                        <p className="text-xs italic opacity-75 mt-1">
                          Expected: {tip.expected_reaction}
                        </p>
                      )}
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
                    disabled={fetchPitchesMutation.isPending}
                    data-testid="button-refresh-query-pitches"
                    className="h-8 border-fuchsia-300 dark:border-fuchsia-700 hover:bg-fuchsia-100 dark:hover:bg-fuchsia-900/50 text-fuchsia-700 dark:text-fuchsia-300"
                    title="Refresh pitches"
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
                                  <p className="text-sm leading-relaxed" data-testid={`pitch-response-${index}`}>
                                    {pitch.pitch}
                                  </p>
                                </div>

                                {/* Key Points */}
                                {pitch.keyPoints && pitch.keyPoints.length > 0 && (
                                  <div className="space-y-1.5">
                                    {pitch.keyPoints.map((point, pIndex) => (
                                      <div key={pIndex} className="flex items-start gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-current mt-1.5 flex-shrink-0"></div>
                                        <p className="text-xs leading-relaxed" data-testid={`pitch-point-${index}-${pIndex}`}>
                                          {point}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {pitch.followUpQuestion && (
                                  <div className="mt-2 p-2 bg-fuchsia-50 dark:bg-fuchsia-950/30 rounded-md border border-fuchsia-200 dark:border-fuchsia-800">
                                    <p className="text-xs font-medium text-fuchsia-700 dark:text-fuchsia-300">
                                      Ask: "{pitch.followUpQuestion}"
                                    </p>
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
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
