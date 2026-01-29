import { useState, useRef, useCallback, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";

interface TranscriptEntry {
  id: string;
  text: string;
  participantId?: string;
  participantName?: string;
  timestamp: Date;
  confidence?: number;
  isFinal: boolean;
  source: 'teams' | 'local' | 'ai';
}

interface IntelligenceSuggestion {
  id: string;
  intent: string;
  suggestedResponse: string;
  followUpPrompt?: string;
  confidence: number;
  timestamp: Date;
}

interface SalesIntelligenceOptions {
  sessionId: string | null;
  domainExpertise: string;
  domainExpertiseId?: string;
  enabled?: boolean;
  onSuggestion?: (suggestion: IntelligenceSuggestion) => void;
}

const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_RECOVERY_MS = 30000;

export function useSalesIntelligence({
  sessionId,
  domainExpertise,
  domainExpertiseId,
  enabled = true,
  onSuggestion
}: SalesIntelligenceOptions) {
  const [suggestions, setSuggestions] = useState<IntelligenceSuggestion[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [isHealthy, setIsHealthy] = useState(true);
  const processedEntriesRef = useRef<Set<string>>(new Set());
  const pendingEntriesRef = useRef<TranscriptEntry[]>([]);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recoveryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const conversationContextRef = useRef<string[]>([]);

  const startRecoveryTimer = useCallback(() => {
    if (recoveryTimerRef.current) {
      clearTimeout(recoveryTimerRef.current);
    }
    recoveryTimerRef.current = setTimeout(() => {
      processedEntriesRef.current.clear();
      setErrorCount(0);
      setIsHealthy(true);
      console.debug("[Sales Intelligence] Circuit breaker reset - cleared processed entries for retry");
    }, CIRCUIT_BREAKER_RECOVERY_MS);
  }, []);

  const isQuestionPattern = useCallback((text: string): boolean => {
    const questionIndicators = [
      /\?$/,
      /^(what|how|why|when|where|who|which|can|could|would|should|is|are|do|does|will|have|has)/i,
      /(tell me|explain|clarify|describe|help me understand|interested in|wondering|curious)/i,
      /(price|cost|pricing|budget|payment|discount)/i,
      /(feature|capability|integration|support|service)/i,
      /(timeline|deadline|when can|how long|how soon)/i,
      /(competitor|alternative|comparison|better than)/i,
      /(concern|worry|issue|problem|challenge)/i
    ];
    return questionIndicators.some(pattern => pattern.test(text.toLowerCase()));
  }, []);

  const detectCustomerQuestion = useCallback((entries: TranscriptEntry[]): TranscriptEntry | null => {
    if (!entries.length) return null;
    
    const recentEntries = entries.slice(-5);
    for (let i = recentEntries.length - 1; i >= 0; i--) {
      const entry = recentEntries[i];
      if (
        entry.isFinal &&
        entry.text.length > 15 &&
        !processedEntriesRef.current.has(entry.id) &&
        isQuestionPattern(entry.text)
      ) {
        return entry;
      }
    }
    return null;
  }, [isQuestionPattern]);

  const processQuestion = useCallback(async (question: TranscriptEntry) => {
    if (!enabled || !sessionId) return;
    
    setIsProcessing(true);

    try {
      const contextTexts = conversationContextRef.current.slice(-5);
      
      const response = await apiRequest("POST", "/api/sales-intelligence/process", {
        sessionId,
        customerQuestion: question.text,
        conversationContext: contextTexts,
        domainExpertise,
        domainExpertiseId,
        timestamp: new Date().toISOString()
      });

      const result = await response.json();
      
      setErrorCount(0);
      setIsHealthy(true);

      if (result.suggestion) {
        processedEntriesRef.current.add(question.id);
        
        const newSuggestion: IntelligenceSuggestion = {
          id: result.suggestion.id || `sug-${Date.now()}`,
          intent: result.suggestion.intent,
          suggestedResponse: result.suggestion.suggestedResponse,
          followUpPrompt: result.suggestion.followUpPrompt,
          confidence: result.suggestion.confidence || 0.8,
          timestamp: new Date()
        };

        setSuggestions(prev => [...prev.slice(-9), newSuggestion]);
        onSuggestion?.(newSuggestion);
      }
    } catch (error) {
      setErrorCount(prev => {
        const newCount = prev + 1;
        if (newCount >= CIRCUIT_BREAKER_THRESHOLD) {
          setIsHealthy(false);
          startRecoveryTimer();
          console.debug("[Sales Intelligence] Circuit breaker tripped - pausing for recovery");
        }
        return newCount;
      });
      console.debug("[Sales Intelligence] Processing failed (passive mode):", error);
    } finally {
      setIsProcessing(false);
    }
  }, [enabled, sessionId, domainExpertise, domainExpertiseId, onSuggestion, startRecoveryTimer]);

  const processTranscriptEntries = useCallback((entries: TranscriptEntry[]) => {
    if (!enabled || !entries.length || !isHealthy) return;

    entries.forEach(entry => {
      if (entry.isFinal && !conversationContextRef.current.includes(entry.text)) {
        conversationContextRef.current.push(entry.text);
        if (conversationContextRef.current.length > 20) {
          conversationContextRef.current = conversationContextRef.current.slice(-20);
        }
      }
    });
    
    pendingEntriesRef.current = entries;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const question = detectCustomerQuestion(pendingEntriesRef.current);
      if (question) {
        processQuestion(question);
      }
    }, 1000);
  }, [enabled, detectCustomerQuestion, processQuestion, isHealthy]);

  const recordFeedback = useCallback(async (suggestionId: string, wasUsed: boolean) => {
    if (!sessionId || !suggestionId) return;
    
    try {
      await apiRequest("POST", "/api/sales-intelligence/feedback", {
        suggestionId,
        wasUsed,
        sessionId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.debug("[Sales Intelligence] Feedback recording failed (passive mode):", error);
    }
  }, [sessionId]);

  const logLearning = useCallback(async (data: {
    customerQuestion: string;
    repResponse: string;
    suggestedResponse?: string;
    detectedIntent?: string;
    usedSuggestion?: boolean;
  }) => {
    if (!sessionId || !data.customerQuestion) return;
    
    try {
      await apiRequest("POST", "/api/sales-intelligence/learn", {
        ...data,
        sessionId,
        domainExpertise,
        domainExpertiseId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.debug("[Sales Intelligence] Learning log failed (passive mode):", error);
    }
  }, [sessionId, domainExpertise, domainExpertiseId]);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    processedEntriesRef.current.clear();
    pendingEntriesRef.current = [];
    conversationContextRef.current = [];
    setErrorCount(0);
    setIsHealthy(true);
    if (recoveryTimerRef.current) {
      clearTimeout(recoveryTimerRef.current);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (recoveryTimerRef.current) {
        clearTimeout(recoveryTimerRef.current);
      }
    };
  }, []);

  return {
    suggestions,
    isProcessing,
    processTranscriptEntries,
    recordFeedback,
    logLearning,
    clearSuggestions,
    latestSuggestion: suggestions[suggestions.length - 1] || null,
    isHealthy
  };
}
