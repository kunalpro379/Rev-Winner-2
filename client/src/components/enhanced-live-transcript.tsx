import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useDeepgramTranscription } from "@/hooks/use-deepgram-transcription";
import { useVoiceFingerprinting } from "@/hooks/use-voice-fingerprinting";
import { Mic, MicOff, Play, Pause, Square, Copy, Trash2, Volume2, Radio, Zap, Monitor, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import PricingModal from "./pricing-modal";
import { SessionMinutesModal } from "./session-minutes-modal";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Speaker {
  id: string;
  name: string;
  color: string;
  initials: string;
}

interface TranscriptSegment {
  text: string;
  speakerId: string;
  timestamp: Date;
}

interface EnhancedLiveTranscriptProps {
  onSendMessage: (message: string, speakerLabel?: string) => void;
  onAnalyze?: (selectedText: string) => void;
  isAnalyzing?: boolean;
  shouldStop?: boolean;
  onStopped?: () => void;
  onStartTimer?: () => void;
  onStopTimer?: () => void;
  onTranscriptUpdate?: (transcriptText: string) => void;
  onTranscribingChange?: (isTranscribing: boolean) => void;
  onNewSession?: () => void;
  resetVersion?: number;
}

const SPEAKER_COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-green-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-indigo-500",
  "bg-red-500"
];

const DEFAULT_SPEAKERS: Speaker[] = [
  { id: "speaker1", name: "Speaker 1", color: SPEAKER_COLORS[0], initials: "S" },
  { id: "speaker2", name: "Speaker 2", color: SPEAKER_COLORS[1], initials: "S" },
  { id: "speaker3", name: "Speaker 3", color: SPEAKER_COLORS[2], initials: "S" },
  { id: "speaker4", name: "Speaker 4", color: SPEAKER_COLORS[3], initials: "S" },
];

const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
};

const isDesktopBrowser = () => {
  return !isMobileDevice() && typeof navigator.mediaDevices?.getDisplayMedia === 'function';
};

export function EnhancedLiveTranscript({ onSendMessage, onAnalyze, isAnalyzing = false, shouldStop = false, onStopped, onStartTimer, onStopTimer, onTranscriptUpdate, onTranscribingChange, onNewSession, resetVersion = 0 }: EnhancedLiveTranscriptProps) {
  const [interimTranscript, setInterimTranscript] = useState("");
  const [fullTranscript, setFullTranscript] = useState("");
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>(DEFAULT_SPEAKERS);
  const [currentSpeakerId, setCurrentSpeakerId] = useState<string>("speaker1");
  const [autoDetectEnabled, setAutoDetectEnabled] = useState(true);
  const [captureMeetingAudio, setCaptureMeetingAudio] = useState(isDesktopBrowser());
  const [selectedSegments, setSelectedSegments] = useState<Set<number>>(new Set());
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showSessionMinutesModal, setShowSessionMinutesModal] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
  const transcriptScrollRef = useRef<HTMLDivElement>(null);
  const prevIsTranscribingRef = useRef<boolean>(false);
  const analyzeOnSpeechRef = useRef<(() => void) | null>(null);
  const { toast } = useToast();

  // Check subscription limits
  const { data: limitsData } = useQuery<{
    canUseService: boolean;
    planType: string;
    status: string;
    hasPlatformAccess?: boolean;
    hasSessionMinutes?: boolean;
    sessionsUsed: number;
    sessionsLimit: number | null;
    sessionsRemaining: number | null;
    minutesUsed: number;
    minutesLimit: number | null;
    minutesRemaining: number | null;
  }>({
    queryKey: ["/api/subscriptions/check-limits"],
  });

  // Check session minutes status
  const { data: sessionMinutesData } = useQuery<{
    hasActiveMinutes: boolean;
    totalMinutesRemaining: number;
    nextExpiryDate: string | null;
    activePurchases: Array<{
      id: string;
      minutesPurchased: number;
      minutesRemaining: number;
      expiryDate: string;
      purchaseDate: string;
    }>;
  }>({
    queryKey: ["/api/session-minutes/status"],
  });

  const getCurrentSpeaker = () => {
    return speakers.find(s => s.id === currentSpeakerId) || speakers[0];
  };

  const getSpeakerById = (id: string) => {
    const speaker = speakers.find(s => s.id === id);
    if (speaker) return speaker;
    
    // Extract speaker number from id (e.g., "speaker1" -> 1)
    const speakerNumber = id.replace('speaker', '');
    const speakerLabel = `Speaker ${speakerNumber}`;
    
    // Create new speaker with proper color rotation (supports up to 8 speakers)
    const colorIndex = (parseInt(speakerNumber) - 1) % SPEAKER_COLORS.length;
    const newSpeaker = { 
      id,
      name: speakerLabel,
      color: SPEAKER_COLORS[colorIndex],
      initials: 'S'
    };
    setSpeakers(prev => [...prev, newSpeaker]);
    return newSpeaker;
  };

  const { isConnected, isTranscribing, startTranscription, stopTranscription, audioStream } = useDeepgramTranscription({
    enabled: true,
    onResult: (result) => {
      if (autoDetectEnabled) {
        analyzeOnSpeechRef.current?.();
      }

      if (result.isFinal) {
        setInterimTranscript("");
        const finalText = result.transcript.trim();
        if (finalText) {
          // Check if Deepgram detected MULTIPLE speakers (not just all speaker 0)
          const hasMultipleSpeakers = result.speakerSegments && 
            result.speakerSegments.length > 0 &&
            new Set(result.speakerSegments.map(s => s.speaker)).size > 1;
          
          if (hasMultipleSpeakers) {
            // Use Deepgram's diarization when it actually detects different speakers
            console.log(`👥 Deepgram detected multiple speakers - using Deepgram diarization`);
            result.speakerSegments!.forEach(segment => {
              const speakerId = `speaker${segment.speaker + 1}`;
              console.log(`👤 Deepgram Speaker ${segment.speaker} -> ${speakerId}: "${segment.text.substring(0, 30)}..."`);
              const speaker = getSpeakerById(speakerId);
              
              setFullTranscript(prev => prev + (prev ? " " : "") + segment.text);
              setTranscriptSegments(prev => [...prev, { 
                text: segment.text,
                speakerId,
                timestamp: new Date()
              }]);
              
              onSendMessage(segment.text, `Speaker ${segment.speaker + 1}`);
            });
          } else {
            // Use client-side voice fingerprinting for speaker detection
            // This works better when Deepgram returns all speaker 0 (mixed meeting audio)
            const voiceSpeakerId = detectedSpeaker || currentSpeakerId;
            const speaker = getSpeakerById(voiceSpeakerId);
            console.log(`🎙️ Using voice fingerprinting: ${voiceSpeakerId} (confidence: ${(confidence * 100).toFixed(0)}%)`);
            
            setFullTranscript(prev => prev + (prev ? " " : "") + finalText);
            setTranscriptSegments(prev => [...prev, { 
              text: finalText,
              speakerId: voiceSpeakerId,
              timestamp: new Date()
            }]);
            onSendMessage(finalText, speaker.name);
          }
        }
      } else {
        setInterimTranscript(result.transcript);
      }
    },
    onError: (error) => {
      toast({
        title: "Transcription Error",
        description: error,
        variant: "destructive"
      });
    }
  });

  const { currentSpeaker: detectedSpeaker, confidence, isAnalyzing: isVoiceAnalyzing, startAnalysis, stopAnalysis, analyzeOnSpeech, reset: resetVoiceDetection } = useVoiceFingerprinting({
    onSpeakerChange: (speakerId) => {
      if (autoDetectEnabled) {
        console.log(`👤 Voice fingerprint detected speaker change to: ${speakerId}`);
        getSpeakerById(speakerId);
        setCurrentSpeakerId(speakerId);
      }
    },
    sensitivity: 0.5,    // Lower threshold = more sensitive to speaker changes
    minConfidence: 0.5,   // Accept lower confidence matches for meeting audio
    inputStream: audioStream
  });

  useEffect(() => {
    analyzeOnSpeechRef.current = analyzeOnSpeech;
  }, [analyzeOnSpeech]);

  useEffect(() => {
    if (audioStream) {
      // Rebind voice fingerprinting to the same meeting audio stream
      // so speaker detection works for all participants, not just mic input.
      resetVoiceDetection();
    }
  }, [audioStream, resetVoiceDetection]);

  useEffect(() => {
    if (shouldStop && isTranscribing) {
      stopTranscription();
      onStopped?.();
    }
  }, [shouldStop, isTranscribing, stopTranscription, onStopped]);

  // Autoscroll to latest message
  useEffect(() => {
    if (transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
    }
  }, [transcriptSegments, interimTranscript]);

  useEffect(() => {
    if (isTranscribing && autoDetectEnabled) {
      startAnalysis();
    } else if (!isTranscribing) {
      stopAnalysis();
    }
  }, [isTranscribing, autoDetectEnabled, startAnalysis, stopAnalysis]);

  // Sync session timer with transcription state
  useEffect(() => {
    const prevIsTranscribing = prevIsTranscribingRef.current;
    
    if (isTranscribing && !prevIsTranscribing) {
      // Started transcribing
      onStartTimer?.();
    } else if (!isTranscribing && prevIsTranscribing) {
      // Stopped transcribing
      onStopTimer?.();
    }
    
    prevIsTranscribingRef.current = isTranscribing;
  }, [isTranscribing, onStartTimer, onStopTimer]);

  // Notify parent of transcript updates
  useEffect(() => {
    onTranscriptUpdate?.(fullTranscript);
  }, [fullTranscript, onTranscriptUpdate]);

  // Notify parent of transcribing state changes
  useEffect(() => {
    onTranscribingChange?.(isTranscribing);
  }, [isTranscribing, onTranscribingChange]);

  const [, setLocation] = useLocation();

  const handleStart = async () => {
    try {
      // Check subscription limits before starting
      if (limitsData && !limitsData.canUseService) {
        let limitMessage = "";
        if (limitsData.hasPlatformAccess === false) {
          limitMessage = "Platform access is required. Visit Packages to purchase Platform Access.";
        } else if (limitsData.hasSessionMinutes === false) {
          limitMessage = "Session minutes are required to use the platform. Purchase a minutes package to continue.";
        } else if (limitsData.sessionsLimit && limitsData.sessionsUsed >= limitsData.sessionsLimit) {
          limitMessage = `You've used all ${limitsData.sessionsLimit} free sessions. Visit Packages to purchase Platform Access!`;
        } else if (limitsData.minutesLimit && limitsData.minutesUsed >= limitsData.minutesLimit) {
          limitMessage = `You've used all ${limitsData.minutesLimit} free minutes. Visit Packages to purchase Platform Access!`;
        } else {
          limitMessage = "Your free trial has expired. Visit Packages to purchase Platform Access!";
        }
        
        toast({
          title: "Free Trial Expired",
          description: limitMessage,
          variant: "destructive",
        });
        
        // Redirect to packages page after showing toast
        setTimeout(() => {
          setLocation('/packages');
        }, 2000);
        
        return;
      }

      // Check if user is on trial/free tier (has actual limits) and has exceeded them
      // Paid users with null limits should bypass this check
      const isTrialUser = limitsData?.sessionsLimit !== null || limitsData?.minutesLimit !== null;
      const hasExceededFreeTier = isTrialUser && (
        (limitsData?.sessionsUsed ?? 0) >= 3 || (limitsData?.minutesUsed ?? 0) >= 180
      );

      // Only require Session Minutes purchase if trial user has exceeded free tier
      if (hasExceededFreeTier) {
        if (!sessionMinutesData || !sessionMinutesData.hasActiveMinutes || sessionMinutesData.totalMinutesRemaining <= 0) {
          setShowSessionMinutesModal(true);
          
          let minutesMessage = "";
          if (!sessionMinutesData || sessionMinutesData.totalMinutesRemaining === 0) {
            minutesMessage = "You've completed your 3 free sessions or 180 free minutes. Purchase Session Minutes to continue!";
          } else {
            minutesMessage = "Your session minutes have expired or been exhausted. Purchase more Session Minutes to continue!";
          }
          
          toast({
            title: "Session Minutes Required",
            description: minutesMessage,
            variant: "destructive"
          });
          return;
        }
      }
      
      await startTranscription(true, captureMeetingAudio);
    } catch (error: any) {
      toast({
        title: "Failed to start transcription",
        description: error.message || "An error occurred",
        variant: "destructive"
      });
    }
  };

  const handleStop = () => {
    stopTranscription();
    setIsPaused(false);
  };

  const handlePause = () => {
    stopTranscription();
    setIsPaused(true);
    toast({
      title: "Transcription paused",
      description: "Click Resume to continue",
    });
  };

  const handleResume = async () => {
    try {
      await startTranscription(true, captureMeetingAudio);
      setIsPaused(false);
      toast({
        title: "Transcription resumed",
        description: "Listening for speech...",
      });
    } catch (error: any) {
      toast({
        title: "Failed to resume transcription",
        description: error.message || "An error occurred",
        variant: "destructive"
      });
    }
  };

  // Reset all local state when parent triggers new session via resetVersion
  useEffect(() => {
    if (resetVersion > 0) {
      // Step 1: Stop transcription if running
      if (isTranscribing || isPaused) {
        stopTranscription();
      }
      
      // Step 2: Reset voice detection
      resetVoiceDetection();
      
      // Step 3: Clear all local state
      setTranscriptSegments([]);
      setFullTranscript("");
      setInterimTranscript("");
      setIsPaused(false);
      setSelectedSegments(new Set());
      setSpeakers(DEFAULT_SPEAKERS); // Reset to default speakers
      setCurrentSpeakerId("speaker1");
      setAutoDetectEnabled(true);
      
      // Step 4: Close modals
      setShowPricingModal(false);
      setShowSessionMinutesModal(false);
    }
  }, [resetVersion, isTranscribing, isPaused]);

  const handleCopy = () => {
    navigator.clipboard.writeText(fullTranscript);
    toast({
      title: "Copied to clipboard",
      description: "Full transcript has been copied",
    });
  };

  const handleClear = () => {
    setTranscriptSegments([]);
    setFullTranscript("");
    setInterimTranscript("");
    resetVoiceDetection();
    toast({
      title: "Transcript cleared",
      description: "All segments have been removed",
    });
  };

  const handleRename = (speakerId: string, newName: string) => {
    setSpeakers(prev => prev.map(s => 
      s.id === speakerId ? { ...s, name: newName, initials: newName.charAt(0).toUpperCase() } : s
    ));
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const toggleSegmentSelection = (index: number) => {
    setSelectedSegments(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(index)) {
        newSelection.delete(index);
      } else {
        newSelection.add(index);
      }
      return newSelection;
    });
  };

  const handleDeselectAll = () => {
    setSelectedSegments(new Set());
    toast({
      title: "Selection Cleared",
      description: "All segments have been deselected",
    });
  };

  const handleAnalyze = () => {
    if (!onAnalyze) return;

    let textToAnalyze = "";
    if (selectedSegments.size > 0) {
      // Analyze only selected segments
      const sortedIndices = Array.from(selectedSegments).sort((a, b) => a - b);
      textToAnalyze = sortedIndices
        .map(index => {
          const segment = transcriptSegments[index];
          const speaker = getSpeakerById(segment.speakerId);
          return `${speaker.name}: ${segment.text}`;
        })
        .join('\n');
    } else {
      // Analyze full transcript
      textToAnalyze = transcriptSegments
        .map(segment => {
          const speaker = getSpeakerById(segment.speakerId);
          return `${speaker.name}: ${segment.text}`;
        })
        .join('\n');
    }

    if (textToAnalyze.trim()) {
      onAnalyze(textToAnalyze);
      toast({
        title: "Analysis Started",
        description: selectedSegments.size > 0 
          ? `Analyzing ${selectedSegments.size} selected segment(s)` 
          : "Analyzing full transcript",
      });
    } else {
      toast({
        title: "No Content",
        description: "There's no transcript to analyze yet",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="w-full h-full shadow-lg border-border/40 flex flex-col">
      <CardHeader className="border-b border-border/30 bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 text-left">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg shadow-md">
              <Volume2 className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
                Live Transcript
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time speech-to-text transcription
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 ml-2">
            {isConnected && (
              <Badge variant="outline" className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900">
                <Radio className="h-3 w-3 mr-1.5 animate-pulse" />
                Connected
              </Badge>
            )}
            
            <Badge
              variant="default"
              className="bg-gradient-to-r from-purple-500 to-blue-500"
              data-testid="badge-auto-detect"
            >
              <Zap className="h-3 w-3 mr-1.5" />
              Auto Detect
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-4 flex-1">
        {!isTranscribing && (
          <Alert className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-300 dark:border-blue-800">
            <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-sm text-blue-900 dark:text-blue-100">
              <div className="space-y-3">
                <div className="text-left">
                  <p className="font-bold text-base mb-1">🎙️ Ready to Transcribe Your Conversation</p>
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    Rev Winner will capture and transcribe ALL audio from your sales call
                  </p>
                </div>

                <Collapsible open={isInstructionsOpen} onOpenChange={setIsInstructionsOpen}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-between px-2 py-1 h-auto text-blue-900 dark:text-blue-100 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                    >
                      <span className="text-xs font-semibold">
                        {isInstructionsOpen ? 'Hide Instructions' : 'Show Instructions'}
                      </span>
                      {isInstructionsOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="space-y-2 mt-2">
                    <div className="space-y-2">
                      <p className="font-semibold text-sm">What you'll hear transcribed:</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                            <CheckCircle2 className="h-3 w-3 text-white" />
                          </div>
                          <span>Your voice (sales rep)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                            <CheckCircle2 className="h-3 w-3 text-white" />
                          </div>
                          <span>Customer/prospect</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                            <CheckCircle2 className="h-3 w-3 text-white" />
                          </div>
                          <span>All meeting participants</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                            <CheckCircle2 className="h-3 w-3 text-white" />
                          </div>
                          <span>Screen shares with audio</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-blue-200 dark:border-blue-800 pt-3">
                      <p className="font-semibold text-sm mb-2">📋 Permission Steps (2 quick prompts):</p>
                      <ol className="text-xs space-y-1.5 list-decimal list-inside text-blue-800 dark:text-blue-200">
                        <li><strong>Microphone:</strong> Click "Allow" to capture your voice</li>
                        <li><strong>Meeting Audio:</strong> Select your meeting tab (Teams/Zoom/Meet/Webex) and <strong className="underline">check "Share audio"</strong></li>
                      </ol>
                    </div>

                    <div className="p-2.5 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-300 dark:border-green-800">
                      <p className="text-xs font-semibold text-green-900 dark:text-green-100">
                        💡 Pro Tip: Make sure your meeting audio is playing through speakers/headphones (not muted) for best transcription quality
                      </p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {isTranscribing && captureMeetingAudio && (
          <Alert className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-300 dark:border-green-800 animate-pulse">
            <Radio className="h-5 w-5 text-green-600 dark:text-green-400 animate-pulse" />
            <AlertDescription className="text-sm text-green-900 dark:text-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold">Live - Transcribing All Audio</p>
                  <p className="text-xs text-green-800 dark:text-green-200 mt-1">
                    Capturing both sides of your conversation in real-time
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge className="bg-green-600 hover:bg-green-600">
                    <Mic className="h-3 w-3 mr-1" />
                    Your Mic
                  </Badge>
                  <Badge className="bg-purple-600 hover:bg-purple-600">
                    <Monitor className="h-3 w-3 mr-1" />
                    Meeting Audio
                  </Badge>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div 
          ref={transcriptScrollRef}
          className="min-h-[220px] max-h-[280px] overflow-y-auto p-3 bg-muted/30 rounded-xl border border-border/30 font-mono text-xs" 
          data-testid="live-transcript"
        >
          {transcriptSegments.length > 0 || interimTranscript ? (
            <div className="space-y-1">
              {transcriptSegments.map((segment, index) => {
                const speaker = getSpeakerById(segment.speakerId);
                const isSelected = selectedSegments.has(index);
                return (
                  <div 
                    key={index} 
                    className={`px-2 py-1 rounded cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-primary/20 border-l-2 border-primary' 
                        : 'hover:bg-muted/40 border-l-2 border-transparent'
                    }`}
                    onClick={() => toggleSegmentSelection(index)}
                    data-testid={`transcript-segment-${index}`}
                  >
                    <div className="flex items-start gap-2">
                      <Input
                        value={speaker.name}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleRename(speaker.id, e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 px-1 text-[11px] font-semibold border-0 bg-transparent hover:bg-muted/50 focus:bg-muted transition w-20 flex-shrink-0"
                        data-testid={`input-rename-speaker-${index}`}
                      />
                      <span className="text-muted-foreground/70 flex-shrink-0">:</span>
                      <p className="text-[11px] text-foreground/90 leading-tight flex-1" data-testid={`speaker-text-${index}`}>
                        {segment.text}
                      </p>
                      {isSelected && (
                        <Badge variant="default" className="text-[9px] h-4 px-1">✓</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {isTranscribing && interimTranscript && (
                <div className="px-2 py-1 rounded animate-pulse border-l-2 border-primary/50">
                  <div className="flex items-start gap-2">
                    <span className="text-[11px] font-semibold w-20 flex-shrink-0">
                      {getCurrentSpeaker().name}
                    </span>
                    <span className="text-muted-foreground/70 flex-shrink-0">:</span>
                    <p className="text-[11px] text-foreground/60 leading-tight flex-1 italic">
                      {interimTranscript}
                      <span className="inline-block w-0.5 h-3 ml-1 bg-primary animate-pulse"></span>
                    </p>
                    <Radio className="h-3 w-3 text-red-500 animate-pulse flex-shrink-0" />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 bg-muted/50 rounded-full mb-4">
                <Mic className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {isTranscribing ? "Listening for speech..." : "Click Start to begin transcription"}
              </p>
              {!isTranscribing && (
                <div className="text-xs text-muted-foreground/70 max-w-md space-y-2">
                  <p>Auto-detect is on: Automatically identifies different speakers</p>
                  <p>Supports all languages with high accuracy</p>
                  {isDesktopBrowser() ? (
                    <p>Capturing meeting audio from microphone and tab</p>
                  ) : (
                    <p>Mobile mode: Microphone audio only</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-2 flex-wrap">
              {!isTranscribing && !isPaused ? (
                <Button
                  onClick={handleStart}
                  variant="default"
                  size="sm"
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-md"
                  data-testid="button-start-recording"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start
                </Button>
              ) : isPaused ? (
                <Button
                  onClick={handleResume}
                  variant="default"
                  size="sm"
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-md"
                  data-testid="button-resume-recording"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </Button>
              ) : (
                <Button
                  onClick={handlePause}
                  variant="outline"
                  size="sm"
                  className="border-orange-500 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950"
                  data-testid="button-pause-recording"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
              )}
              
              {(isTranscribing || isPaused) && (
                <Button
                  onClick={handleStop}
                  variant="destructive"
                  size="sm"
                  data-testid="button-stop-recording"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              )}
              
              <Button
                onClick={onNewSession}
                variant="outline"
                size="sm"
                disabled={isTranscribing}
                className="border-purple-500 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950"
                data-testid="button-new-session"
              >
                <Radio className="h-4 w-4 mr-2" />
                New Session
              </Button>
              
              <Button
                onClick={handleCopy}
                variant="outline"
                size="sm"
                disabled={!fullTranscript}
                data-testid="button-copy-transcript"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              
              <Button
                onClick={handleClear}
                variant="outline"
                size="sm"
                disabled={transcriptSegments.length === 0}
                data-testid="button-clear-transcript"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>

          {transcriptSegments.length > 0 && (
            <div className="border-t border-border/30 pt-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-muted-foreground">
                  {selectedSegments.size > 0 ? (
                    <span className="font-medium">{selectedSegments.size} segment(s) selected</span>
                  ) : (
                    <span>Click segments to select specific parts for analysis</span>
                  )}
                </div>
                <div className="flex gap-2">
                  {selectedSegments.size > 0 && (
                    <Button
                      onClick={handleDeselectAll}
                      variant="outline"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground"
                      data-testid="button-deselect-all"
                    >
                      Deselect All
                    </Button>
                  )}
                  <Button
                    onClick={handleAnalyze}
                    variant="default"
                    size="sm"
                    disabled={isAnalyzing || transcriptSegments.length === 0}
                    className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white shadow-md disabled:opacity-50"
                    data-testid="button-analyze-transcript"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    {isAnalyzing ? 'Analyzing...' : `Analyze ${selectedSegments.size > 0 ? 'Selected' : 'All'}`}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
      {/* Pricing Modal for upgrade */}
      <PricingModal
        open={showPricingModal}
        onOpenChange={setShowPricingModal}
        reason="trial_expired"
        currentPlan={limitsData?.planType}
      />
      <SessionMinutesModal
        open={showSessionMinutesModal}
        onOpenChange={setShowSessionMinutesModal}
      />
    </Card>
  );
}
