import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConversationArea } from "@/components/conversation-area";
import { SidebarPanels } from "@/components/sidebar-panels";
import { EnhancedLiveTranscript } from "@/components/enhanced-live-transcript";
import { ShiftGears } from "@/components/shift-gears";
import { AnalysisResults } from "@/components/analysis-results";
import { SalesAssistantQA } from "@/components/sales-assistent-qa";
import TechEnvironmentMindMap from "@/components/mind-map/TechEnvironmentMindMap";
import { DomainExpertiseSelector, isUniversalRVMode } from "@/components/domain-expertise-selector";
import { HamburgerNav } from "@/components/hamburger-nav";
import { AIEngineSetup } from "@/components/ai-engine-setup";
import { SessionTimer } from "@/components/session-timer";
import { PresentToWin } from "@/components/present-to-win";
import { NewSessionDialog } from "@/components/new-session-dialog";
import { FloatingAssistant } from "@/components/floating-assistant";
import { MeetingPreview } from "@/components/meeting-preview";
import { useSessionTimer } from "@/hooks/use-session-timer";
import { useToast } from "@/hooks/use-toast";
import { useSalesIntelligence } from "@/hooks/use-sales-intelligence";
import { createConversation, getConversation, sendMessage } from "@/lib/conversation";
import { apiRequest } from "@/lib/queryClient";
import { useSEO } from "@/hooks/use-seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Globe, X, Check, Edit2, AlertCircle, MessageCircle } from "lucide-react";

export default function SalesAssistant() {
  const [, setLocation] = useLocation();
  
  useSEO({
    title: "Rev Winner App | AI Sales Coaching & Conversation Intelligence",
    description: "Your AI-powered sales assistant. Get real-time coaching, live transcription, conversation analysis, and meeting minutes to close more deals.",
    keywords: "Rev Winner AI Sales Assistant, real-time sales coaching, live call feedback, conversation intelligence for sales calls, AI-powered sales call feedback, sales meeting transcription, live sales insights, call recording, AI meeting summary, conversation analysis software, sales calls analysis, sales enablement platform, AI sales insights, meeting transcription, AI-generated notes, customer success enablement, keyword tracking in calls, outreach automation tool, sales engagement platform, AI revenue workflow platform, sales call objection handling, meeting minutes automation, sales leadership insights, pitch deck generator, case study generator, battle card automation, Zoom Teams Webex integration, AI for business meetings, voice analytics for sales, AI transcription engine, AI call analysis, sales deal coaching, AI powered CRM assistant, sales process optimization",
    ogImage: "https://revwinner.com/og-image.png",
    ogUrl: "https://revwinner.com/ai-sales-assistant"
  });
  
  // Check authentication
  const { data: authData, isLoading: isAuthLoading, error: authError } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  // Check AI engine setup status
  const { data: aiEngineSettings, isLoading: isLoadingAISettings } = useQuery({
    queryKey: ["/api/auth/ai-engine-settings"],
    enabled: !!authData,
  });

  const [showAISetup, setShowAISetup] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthLoading && (authError || !authData)) {
      setLocation("/login?redirect=/ai-sales-assistant");
    }
  }, [isAuthLoading, authError, authData, setLocation]);

  // Show AI engine setup if not completed
  useEffect(() => {
    if (!isLoadingAISettings && aiEngineSettings && !(aiEngineSettings as any).aiEngineSetupCompleted) {
      setShowAISetup(true);
    }
  }, [isLoadingAISettings, aiEngineSettings]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [recommendedModules, setRecommendedModules] = useState<string[]>([]);
  const [nextQuestions, setNextQuestions] = useState<string[]>([]);
  const [callSummary, setCallSummary] = useState<any>(null);
  const [showCallSummary, setShowCallSummary] = useState(false);
  const [meetingMinutes, setMeetingMinutes] = useState<any>(null);
  const [isLoadingMinutes, setIsLoadingMinutes] = useState(false);
  const [transcriptEntries, setTranscriptEntries] = useState<any[]>([]);
  const [shouldStopListening, setShouldStopListening] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [analyzedTranscript, setAnalyzedTranscript] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState<string>("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showNewSessionDialog, setShowNewSessionDialog] = useState(false);
  const [showMeetingPreview, setShowMeetingPreview] = useState(false);
  const [resetVersion, setResetVersion] = useState(0);
  const [domainExpertise, setDomainExpertise] = useState<string>(() => {
    // Load from localStorage or prompt user to set domain
    try {
      const stored = localStorage.getItem('domainExpertise');
      // Don't auto-load Universal RV - it must be entered manually each session
      if (stored && !isUniversalRVMode(stored)) {
        return stored;
      }
    } catch (error) {
      console.error('Failed to load domain expertise from localStorage:', error);
    }
    // Empty string will trigger edit mode in DomainExpertiseSelector to prompt user
    return "";
  });
  
  const [domainExpertiseId, setDomainExpertiseId] = useState<string | undefined>(() => {
    try {
      const stored = localStorage.getItem('domainExpertiseId');
      if (stored) {
        return stored;
      }
    } catch (error) {
      console.error('Failed to load domain expertise ID from localStorage:', error);
    }
    return undefined;
  });
  
  // Website URL for enhanced domain context
  const [domainWebsite, setDomainWebsite] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('domainWebsite');
      return stored || '';
    } catch (error) {
      console.error('Failed to load domain website from localStorage:', error);
      return '';
    }
  });
  const [isEditingWebsite, setIsEditingWebsite] = useState(false);
  const [websiteInput, setWebsiteInput] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Session timer hook
  const { isRunning: isTimerRunning, currentSessionTime, totalUsage, startTimer, stopTimer } = useSessionTimer();
  
  // Sales Intelligence Agent (passive layer - doesn't disrupt existing features)
  const { 
    suggestions: intelligenceSuggestions,
    isProcessing: isIntelligenceProcessing,
    processTranscriptEntries,
    clearSuggestions: clearIntelligenceSuggestions,
    latestSuggestion
  } = useSalesIntelligence({
    sessionId,
    domainExpertise,
    domainExpertiseId,
    enabled: !!sessionId && !!domainExpertise
  });

  // Save domain expertise to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('domainExpertise', domainExpertise);
  }, [domainExpertise]);
  
  // Save domain expertise ID to localStorage whenever it changes
  useEffect(() => {
    if (domainExpertiseId) {
      localStorage.setItem('domainExpertiseId', domainExpertiseId);
    } else {
      localStorage.removeItem('domainExpertiseId');
    }
  }, [domainExpertiseId]);
  
  // Save domain website to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('domainWebsite', domainWebsite);
  }, [domainWebsite]);
  
  // Handler for saving website
  const handleSaveWebsite = () => {
    const trimmedUrl = websiteInput.trim();
    if (trimmedUrl) {
      // Basic URL validation and formatting
      let formattedUrl = trimmedUrl;
      if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
        formattedUrl = 'https://' + trimmedUrl;
      }
      setDomainWebsite(formattedUrl);
      toast({
        title: "Website Saved",
        description: `AI will use ${formattedUrl} for enhanced domain context`,
      });
    }
    setIsEditingWebsite(false);
    setWebsiteInput('');
  };
  
  // Handler for editing website
  const handleEditWebsite = () => {
    setWebsiteInput(domainWebsite);
    setIsEditingWebsite(true);
  };
  
  // Handler for clearing website
  const handleClearWebsite = () => {
    setDomainWebsite('');
    setIsEditingWebsite(false);
    setWebsiteInput('');
    toast({
      title: "Website Cleared",
      description: "Domain website context has been removed",
    });
  };

  // Handler for domain expertise change
  const handleDomainExpertiseChange = (newDomain: string, newDomainId?: string) => {
    setDomainExpertise(newDomain);
    setDomainExpertiseId(newDomainId);
    // Reset conversation when domain changes to get fresh context
    // We'll keep the session ID but the next message will use new domain
  };

  // Initialize conversation
  useEffect(() => {
    const initializeConversation = async () => {
      try {
        const session = await createConversation();
        setSessionId(session.conversation.sessionId);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to initialize conversation",
          variant: "destructive"
        });
      }
    };

    initializeConversation();
  }, [toast]);

  // Get conversation data
  const { data: conversationData, isLoading: isLoadingConversation } = useQuery({
    queryKey: ["/api/conversations", sessionId],
    queryFn: () => getConversation(sessionId!),
    enabled: !!sessionId,
    refetchInterval: false,
  });

  // Auto-load existing meeting minutes if they exist
  const { data: existingMinutes } = useQuery({
    queryKey: [`/api/conversations/${sessionId}/meeting-minutes?domain=${encodeURIComponent(domainExpertise || '')}`],
    enabled: !!sessionId && !!domainExpertise,
    refetchInterval: false,
    retry: false,
  });

  // Clear meeting minutes when session or domain changes
  useEffect(() => {
    setMeetingMinutes(null);
  }, [sessionId, domainExpertise]);

  // Update meeting minutes state when existing minutes are loaded
  useEffect(() => {
    if (existingMinutes) {
      setMeetingMinutes(existingMinutes);
    } else if (existingMinutes === null) {
      // Query returned null (no minutes exist), ensure state is cleared
      setMeetingMinutes(null);
    }
  }, [existingMinutes]);

  // Process transcript entries through Sales Intelligence Agent (passive, non-blocking)
  useEffect(() => {
    if (transcriptEntries.length > 0) {
      processTranscriptEntries(transcriptEntries);
    }
  }, [transcriptEntries, processTranscriptEntries]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: ({ content, speakerLabel }: { content: string; speakerLabel?: string }) => 
      sendMessage(sessionId!, content, speakerLabel, domainExpertise),
    onSuccess: (data) => {
      if ('summary' in data) {
        // Call ended, show summary
        setCallSummary(data.summary);
        setShowCallSummary(true);
      } else {
        // Regular message response
        // Add assistant response to transcript entries for coaching analysis
        if (data.assistantMessage) {
          const assistantTranscriptEntry = {
            text: data.assistantMessage.content,
            participantId: 'assistant',
            participantName: 'AI Sales Assistant',
            timestamp: new Date(),
            confidence: 1.0,
            isFinal: true,
            source: 'ai' as const
          };
          setTranscriptEntries(prev => [...prev, assistantTranscriptEntry]);
        }
      }
      
      // Refetch conversation data
      queryClient.invalidateQueries({
        queryKey: ["/api/conversations", sessionId]
      });
    },
    onError: (error) => {
      const status = (error as any)?.status;
      const message = error instanceof Error ? error.message : "Failed to send message";
      toast({
        title: status === 403 ? "Subscription Required" : "Error",
        description: status === 403 ? "You need an active subscription to continue." : message,
        variant: "destructive"
      });
    },
  });

  const handleSendMessage = async (content: string, speakerLabel?: string) => {
    if (!content.trim() || !sessionId) return;
    
    // Add user message to transcript entries for coaching analysis
    const userTranscriptEntry = {
      text: content,
      participantId: speakerLabel || 'user',
      participantName: speakerLabel || 'Client',
      timestamp: new Date(),
      confidence: 1.0,
      isFinal: true,
      source: 'typing' as const
    };
    setTranscriptEntries(prev => [...prev, userTranscriptEntry]);
    
    try {
      await sendMessageMutation.mutateAsync({ content, speakerLabel });
    } catch (error) {
      // Mutation onError handles user feedback; swallow to avoid unhandled rejection overlay.
    }
  };

  const handleAnalyze = async (transcriptText: string) => {
    if (!sessionId) return;
    
    setIsAnalyzing(true);
    const startTime = Date.now();
    
    // Get Multi-Product Elite AI preference (with safe fallback)
    let multiProductEliteAI = false;
    try {
      const stored = localStorage.getItem("multiProductEliteAI");
      multiProductEliteAI = stored ? JSON.parse(stored) : false;
    } catch (error) {
      console.warn("Failed to read multiProductEliteAI from localStorage:", error);
      multiProductEliteAI = false;
    }
    
    try {
      const response = await apiRequest("POST", `/api/conversations/${sessionId}/analyze`, {
        transcriptText,
        domainExpertise,
        multiProductEliteAI
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Analysis Failed",
          description: data.message || "Failed to analyze the transcript. Please try again.",
          variant: "destructive"
        });
        return;
      }

      const duration = Date.now() - startTime;
      setAnalysisResults(data);
      setAnalyzedTranscript(transcriptText);
      
      // Show performance feedback
      const performanceMsg = data._performance?.duration 
        ? `Analysis completed in ${data._performance.duration}ms (${data._performance.messageCount} messages analyzed)`
        : `Analysis completed in ${duration}ms`;
      
      toast({
        title: "⚡ Fast Analysis Complete",
        description: performanceMsg,
      });
      
      console.log(`⚡ Analysis performance: Frontend=${duration}ms, Backend=${data._performance?.duration}ms`);
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze the transcript. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRegenerateAnalysis = async () => {
    if (!sessionId || !analyzedTranscript) return;
    
    await handleAnalyze(analyzedTranscript);
  };

  const handleGenerateMinutes = async () => {
    if (!sessionId) {
      toast({
        title: "No Session",
        description: "Please start a conversation first",
        variant: "destructive"
      });
      return;
    }

    setIsLoadingMinutes(true);
    try {
      const response = await apiRequest("GET", `/api/conversations/${sessionId}/meeting-minutes?domain=${encodeURIComponent(domainExpertise)}`);
      const minutes = await response.json();
      setMeetingMinutes(minutes);
      toast({
        title: "Minutes Generated",
        description: "Meeting minutes have been generated successfully",
      });
      // Scroll to meeting minutes section
      setTimeout(() => {
        document.getElementById('meeting-minutes-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error: any) {
      console.error('Error generating meeting minutes:', error);
      
      // Check if it's a validation error (conversation too short)
      if (error.message && error.message.includes('400:')) {
        toast({
          title: "Not Enough Content",
          description: "Please have a longer conversation before generating meeting minutes. We need at least 3 messages with meaningful content.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Generation Failed",
          description: "Failed to generate meeting minutes. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoadingMinutes(false);
    }
  };

  // Handler for stopping session and generating summary
  const handleStopSession = async () => {
    if (!sessionId) return;
    
    try {
      // Send /end command to generate and save summary
      await sendMessage(sessionId, "/end", undefined, domainExpertise);
      
      toast({
        title: "Session Ended",
        description: "Summary has been generated and saved",
      });
    } catch (error) {
      console.error("Error generating summary:", error);
      toast({
        title: "Summary Generation Failed",
        description: "Could not generate session summary",
        variant: "destructive"
      });
    }
  };

  // Handler for initiating new session
  const handleNewSession = () => {
    // Don't allow starting new session while recording
    if (isTranscribing) {
      toast({
        title: "Cannot Start New Session",
        description: "Please stop recording before starting a new session",
        variant: "destructive"
      });
      return;
    }
    
    // Show confirmation dialog
    setShowNewSessionDialog(true);
  };

  // Handler for confirming new session after dialog
  const handleConfirmNewSession = async () => {
    try {
      // Store old sessionId for cache cleanup
      const oldSessionId = sessionId;
      
      // Step 1: Create new session FIRST (fail-safe approach)
      const newSession = await createConversation();
      const newSessionId = newSession.conversation.sessionId;
      
      // Step 2: Stop timer
      stopTimer();
      
      // Step 3: Clear all session-specific state
      setSessionId(newSessionId); // Set new session immediately
      setAnalysisResults(null);
      setAnalyzedTranscript("");
      setCurrentTranscript("");
      setMeetingMinutes(null);
      setCallSummary(null);
      setShowCallSummary(false);
      setTranscriptEntries([]);
      setShouldStopListening(false);
      setRecommendedModules([]);
      setNextQuestions([]);
      setIsAnalyzing(false);
      setIsLoadingMinutes(false);
      clearIntelligenceSuggestions();
      setIsTranscribing(false);
      
      // Step 4: Increment reset version to notify all children
      setResetVersion(prev => prev + 1);
      
      // Step 5: Clear OLD session cache and prefetch NEW session data
      if (oldSessionId) {
        // Remove all queries containing the old sessionId
        queryClient.removeQueries({ 
          predicate: (query) => {
            const queryKey = query.queryKey;
            return Array.isArray(queryKey) && queryKey.some(key => key === oldSessionId);
          }
        });
      }
      
      // Step 6: Prefetch new conversation data immediately (force refetch)
      queryClient.prefetchQuery({
        queryKey: ["/api/conversations", newSessionId],
        queryFn: () => getConversation(newSessionId),
        staleTime: 0 // Force fresh data
      });
      
      // Step 7: Refresh subscription limits and session minutes data
      // This ensures the Start button checks are up-to-date
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/check-limits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/session-minutes/status"] });
      
      // Step 8: Success notification
      toast({
        title: "New Session Started",
        description: "Ready for a fresh conversation. Your preferences have been preserved.",
      });
      
      // Close dialog
      setShowNewSessionDialog(false);
      
    } catch (error) {
      console.error('Failed to create new session:', error);
      toast({
        title: "Session Reset Failed",
        description: "Failed to create a new session. Please try again.",
        variant: "destructive"
      });
      // Don't close dialog on error so user can retry
    }
  };

  // Messages now come with metadata from the backend
  const messages = conversationData?.messages || [];
  const isLoading = sendMessageMutation.isPending || isLoadingConversation;

  // Show loading state while checking authentication
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Checking Authentication...</h2>
          <p className="text-muted-foreground">Please wait</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!authData) {
    return null;
  }

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Initializing Session...</h2>
          <p className="text-muted-foreground">Setting up your call</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* AI Engine Setup Modal */}
      <AIEngineSetup 
        open={showAISetup} 
        onComplete={() => setShowAISetup(false)} 
      />
      
      {/* New Session Confirmation Dialog */}
      <NewSessionDialog
        open={showNewSessionDialog}
        onOpenChange={setShowNewSessionDialog}
        onConfirm={handleConfirmNewSession}
      />
      
      {/* Meeting Preview Module */}
      <MeetingPreview
        isOpen={showMeetingPreview}
        onClose={() => setShowMeetingPreview(false)}
      />
      
      <HamburgerNav currentPath="/app" />

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-6 lg:px-8 py-8">
        {/* Call Session Title */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-4 mb-2 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center shadow-lg circular-badge">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight">Call Session</h1>
                <p className="text-sm text-muted-foreground">Real-time AI-powered sales assistant</p>
              </div>
            </div>
            
            {/* User Info & AI Engine Display */}
            <div className="flex items-center gap-4 flex-wrap">
              {/* User Name */}
              {authData && (authData as any).user && (
                <div className="flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg border border-purple-300 dark:border-purple-700/50" data-testid="user-info-display">
                  <svg className="w-5 h-5 text-purple-700 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <div>
                    <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">User</p>
                    <p className="text-sm font-semibold text-purple-900 dark:text-purple-200" data-testid="text-username">
                      {(authData as any).user.name || (authData as any).user.username || (authData as any).user.email}
                    </p>
                  </div>
                </div>
              )}
              
              {/* AI Engine */}
              {aiEngineSettings && (aiEngineSettings as any).aiEngine && (
                <div className="flex items-center gap-2 px-4 py-2 bg-fuchsia-100 dark:bg-fuchsia-900/30 rounded-lg border border-fuchsia-300 dark:border-fuchsia-700/50" data-testid="ai-engine-display">
                  <svg className="w-5 h-5 text-fuchsia-700 dark:text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <div>
                    <p className="text-xs text-fuchsia-600 dark:text-fuchsia-400 font-medium">AI Engine</p>
                    <p className="text-sm font-semibold text-fuchsia-900 dark:text-fuchsia-200" data-testid="text-ai-engine">
                      {(aiEngineSettings as any).aiEngine === 'openai' && 'OpenAI'}
                      {(aiEngineSettings as any).aiEngine === 'anthropic' && 'Anthropic Claude'}
                      {(aiEngineSettings as any).aiEngine === 'google' && 'Google Gemini'}
                      {(aiEngineSettings as any).aiEngine === 'deepseek' && 'DeepSeek'}
                      {(aiEngineSettings as any).aiEngine === 'xai' && 'X.AI Grok'}
                      {(aiEngineSettings as any).aiEngine === 'kimi' && 'Kimi K2'}
                      {!['openai', 'anthropic', 'google', 'deepseek', 'xai', 'kimi'].includes((aiEngineSettings as any).aiEngine) && (aiEngineSettings as any).aiEngine}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Session Timer and Domain Expertise */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
          <SessionTimer 
            currentSessionTime={currentSessionTime}
            totalUsage={totalUsage}
            isRunning={isTimerRunning}
          />
          
          <DomainExpertiseSelector
            value={domainExpertise}
            onChange={handleDomainExpertiseChange}
          />
        </div>
        
        {/* Company Website - Aligned below Domain Expertise */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Preview Meeting Button - Left Column */}
          <div className="flex flex-col justify-center">
            <Button
              onClick={() => setShowMeetingPreview(true)}
              className="w-full lg:w-auto bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white font-semibold shadow-lg"
              size="lg"
              data-testid="button-preview-meeting"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Preview My Meeting
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              View your video meeting while staying in Rev Winner
            </p>
          </div>
          
          {/* Website Info Field - Right Column (aligned with Domain Expertise) */}
          <Card className="border-primary/20 bg-gradient-to-r from-blue-50/50 via-blue-50/30 to-transparent dark:from-blue-950/30 dark:via-blue-950/20 dark:to-transparent">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex-shrink-0">
                  <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Company Website (Optional - Enhances AI Accuracy)
                  </label>
                  {isEditingWebsite ? (
                    <div className="flex items-center gap-2">
                      <Input
                        data-testid="input-domain-website"
                        value={websiteInput}
                        onChange={(e) => setWebsiteInput(e.target.value)}
                        placeholder="e.g., integris.com, microsoft.com..."
                        className="h-9 bg-background border-blue-300 dark:border-blue-700 focus:border-blue-500 rounded-lg flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveWebsite();
                          if (e.key === 'Escape') {
                            setIsEditingWebsite(false);
                            setWebsiteInput('');
                          }
                        }}
                        autoFocus
                      />
                      <Button
                        data-testid="button-save-website"
                        onClick={handleSaveWebsite}
                        size="sm"
                        variant="outline"
                        className="h-9 px-3 border-green-300 text-green-600 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-950"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        data-testid="button-cancel-website"
                        onClick={() => {
                          setIsEditingWebsite(false);
                          setWebsiteInput('');
                        }}
                        size="sm"
                        variant="outline"
                        className="h-9 px-3 border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-950"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : domainWebsite ? (
                    <div className="flex items-center gap-2">
                      <a 
                        href={domainWebsite} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline truncate max-w-[200px]"
                        data-testid="link-domain-website"
                      >
                        {domainWebsite.replace(/^https?:\/\//, '')}
                      </a>
                      <Button
                        data-testid="button-edit-website"
                        onClick={handleEditWebsite}
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        data-testid="button-clear-website"
                        onClick={handleClearWebsite}
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      data-testid="button-add-website"
                      onClick={() => setIsEditingWebsite(true)}
                      size="sm"
                      variant="outline"
                      className="h-9 text-blue-600 border-blue-300 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-950"
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Add Website
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Row: Live Transcript and Shift Gears Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch mb-6">
            {/* Left Column: Live Transcript */}
            <div className="space-y-4 h-full">
              <EnhancedLiveTranscript 
                onSendMessage={handleSendMessage}
                onAnalyze={handleAnalyze}
                isAnalyzing={isAnalyzing}
                shouldStop={shouldStopListening}
                onStopped={() => setShouldStopListening(false)}
                onStartTimer={startTimer}
                onStopTimer={stopTimer}
                onTranscriptUpdate={setCurrentTranscript}
                onTranscribingChange={setIsTranscribing}
                onNewSession={handleNewSession}
                resetVersion={resetVersion}
                  sessionId={sessionId}
                  onStop={handleStopSession}
              />
            </div>

            {/* Right Column: Shift Gears and Mind Map */}
            <div className="space-y-4 h-full">
              {/* Shift Gears - Real-time AI tips */}
              {sessionId && (
                <ShiftGears
                  sessionId={sessionId}
                  transcriptText={currentTranscript}
                  domainExpertise={domainExpertise}
                  isTranscribing={isTranscribing}
                  resetVersion={resetVersion}
                />
              )}
            </div>
          </div>

          {/* Conversation Analysis (70%) + Sales Q&A (30%) Row */}
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 mb-6 min-h-[500px]" id="conversation-area">
            {/* Left: Conversation Analysis - 70% */}
            <div className="lg:col-span-7 flex flex-col min-h-0">
              <ConversationArea
                onRegenerate={handleRegenerateAnalysis}
                isRegenerating={isAnalyzing}
                hasAnalysis={!!analysisResults}
                isAnalyzing={isAnalyzing}
              >
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Analysis Results Panel */}
                  <div className="flex-1 rounded-lg border border-border/50 bg-muted/10 p-4 min-h-0">
                    {analysisResults ? (
                      <AnalysisResults
                        results={analysisResults}
                        onClose={() => setAnalysisResults(null)}
                        sessionId={sessionId || ""}
                        conversationContext={analyzedTranscript}
                        domainExpertise={domainExpertise}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full min-h-[350px] text-center">
                        <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 rounded-full mb-4">
                          <AlertCircle className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                        </div>
                        <p className="text-base font-semibold text-foreground mb-2">No Analysis Yet</p>
                        <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                          Select transcript segments or use the Analyze button to get AI-powered insights
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </ConversationArea>
            </div>

            {/* Right: Sales Q&A - 30% */}
            <div className="lg:col-span-3 flex flex-col min-h-0">
              {sessionId && (
                <SalesAssistantQA
                  sessionId={sessionId}
                  conversationContext={currentTranscript || analyzedTranscript}
                  domainExpertise={domainExpertise}
                  domainExpertiseId={domainExpertiseId}
                  resetVersion={resetVersion}
                />
              )}
            </div>
          </div>

          {/* Present to Win - Added margin-top for spacing */}
          {sessionId && conversationData?.messages && conversationData.messages.length > 0 && (
            <div className="w-full mt-6 mb-6" id="present-to-win-section">
              <PresentToWin
                sessionId={sessionId}
                conversationContext={
                  conversationData.messages && conversationData.messages.length > 0
                    ? conversationData.messages
                        .map(m => `${m.sender}: ${m.content}`)
                        .join('\n')
                    : currentTranscript
                }
                domainExpertise={domainExpertise}
                resetVersion={resetVersion}
                multiProductEliteAI={(() => {
                  try {
                    const stored = localStorage.getItem("multiProductEliteAI");
                    return stored ? JSON.parse(stored) : false;
                  } catch {
                    return false;
                  }
                })()}
              />
            </div>
          )}

          {/* AI Recommendations & Product Reference */}
          <div className="mb-6" id="ai-recommendations">
            <SidebarPanels
              callSummary={callSummary}
              recommendedModules={recommendedModules}
              showCallSummary={showCallSummary}
              sessionId={sessionId || ''}
              conversationId={sessionId || ''}
              domainExpertise={domainExpertise}
              onGenerateMinutes={handleGenerateMinutes}
              isLoadingMinutes={isLoadingMinutes}
              meetingMinutes={meetingMinutes}
              onMinutesSaved={(updatedMinutes) => setMeetingMinutes(updatedMinutes)}
            />
          </div>

          {/* Tech Environment Mind Map - At the Bottom */}
          {sessionId && (
            <div className="w-full mb-6" id="tech-environment-mind-map">
              <TechEnvironmentMindMap
                sessionId={sessionId}
                transcript={currentTranscript}
                domainExpertise={domainExpertise}
                resetVersion={resetVersion}
              />
            </div>
          )}
      </main>
      
      {/* Floating AI Assistant - Bottom Right Corner */}
      {sessionId && <FloatingAssistant conversationId={sessionId} />}
    </div>
  );
}