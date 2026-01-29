import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useVoiceFingerprinting } from "@/hooks/use-voice-fingerprinting";
import { Mic, MicOff, Play, Pause, Square, Copy, Trash2, Volume2, Radio, User, Users, Zap, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

interface LiveTranscriptProps {
  onSendMessage: (message: string, speakerLabel?: string) => void;
  shouldStop?: boolean;
  onStopped?: () => void;
}

const DEFAULT_SPEAKERS: Speaker[] = [
  { id: "speaker1", name: "Speaker", color: "bg-blue-500", initials: "S" },
  { id: "speaker2", name: "Speaker", color: "bg-purple-500", initials: "S" },
  { id: "speaker3", name: "Speaker", color: "bg-green-500", initials: "S" },
  { id: "speaker4", name: "Speaker", color: "bg-orange-500", initials: "S" },
];

export function LiveTranscript({ onSendMessage, shouldStop = false, onStopped }: LiveTranscriptProps) {
  const [interimTranscript, setInterimTranscript] = useState("");
  const [fullTranscript, setFullTranscript] = useState("");
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>(DEFAULT_SPEAKERS);
  const [currentSpeakerId, setCurrentSpeakerId] = useState<string>("speaker1");
  const [autoDetectEnabled, setAutoDetectEnabled] = useState(true);
  const { toast } = useToast();

  const getCurrentSpeaker = () => {
    return speakers.find(s => s.id === currentSpeakerId) || speakers[0];
  };

  // Voice fingerprinting for automatic speaker detection
  const { 
    currentSpeaker: detectedSpeaker, 
    confidence, 
    isAnalyzing,
    startAnalysis,
    stopAnalysis,
    analyzeOnSpeech,
    reset: resetVoiceDetection
  } = useVoiceFingerprinting({
    onSpeakerChange: (speakerId) => {
      if (autoDetectEnabled) {
        console.log(`👤 Setting current speaker to: ${speakerId}`);
        // Ensure speaker exists in the list before setting as current
        getSpeakerById(speakerId);
        setCurrentSpeakerId(speakerId);
      }
    },
    sensitivity: 0.6,
    minConfidence: 0.6
  });

  const { isListening, isPaused, isSupported, startListening, pauseListening, stopListening } = useSpeechRecognition({
    onResult: (result) => {
      // Analyze voice on every speech event (both interim and final)
      if (autoDetectEnabled && analyzeOnSpeech) {
        analyzeOnSpeech();
      }

      if (result.isFinal) {
        setInterimTranscript("");
        const finalText = result.transcript.trim();
        if (finalText) {
          const currentSpeaker = getCurrentSpeaker();
          setFullTranscript(prev => prev + (prev ? " " : "") + finalText);
          setTranscriptSegments(prev => [...prev, { 
            text: finalText,
            speakerId: currentSpeakerId,
            timestamp: new Date()
          }]);
          onSendMessage(finalText, currentSpeaker.name);
        }
      } else {
        setInterimTranscript(result.transcript);
      }
    },
    onError: (error) => {
      toast({
        title: "Speech Recognition Error",
        description: error,
        variant: "destructive"
      });
    }
  });

  useEffect(() => {
    if (shouldStop && (isListening || isPaused)) {
      stopListening();
      onStopped?.();
    }
  }, [shouldStop, isListening, isPaused, stopListening, onStopped]);

  // Start/stop voice analysis when recording starts/stops
  useEffect(() => {
    if (isListening && autoDetectEnabled) {
      startAnalysis();
    } else if (!isListening) {
      stopAnalysis();
    }
  }, [isListening, autoDetectEnabled, startAnalysis, stopAnalysis]);

  const clearTranscript = () => {
    setFullTranscript("");
    setInterimTranscript("");
    setTranscriptSegments([]);
    resetVoiceDetection();
  };

  const getSpeakerById = (speakerId: string): Speaker => {
    const existingSpeaker = speakers.find(s => s.id === speakerId);
    if (existingSpeaker) {
      return existingSpeaker;
    }
    
    // If speaker doesn't exist, create it dynamically
    const speakerNumber = parseInt(speakerId.replace('speaker', ''));
    const colors = ["bg-blue-500", "bg-purple-500", "bg-green-500", "bg-orange-500", "bg-pink-500", "bg-teal-500", "bg-yellow-500", "bg-red-500"];
    const colorIndex = (speakerNumber - 1) % colors.length;
    
    const newSpeaker: Speaker = {
      id: speakerId,
      name: "Speaker",
      color: colors[colorIndex],
      initials: "S"
    };
    
    // Add to speakers list
    setSpeakers(prev => [...prev, newSpeaker]);
    
    return newSpeaker;
  };

  const copyTranscript = () => {
    if (transcriptSegments.length > 0) {
      const formattedTranscript = transcriptSegments
        .map(segment => {
          const speaker = getSpeakerById(segment.speakerId);
          const time = segment.timestamp.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          return `${speaker.name} (${time}):\n${segment.text}\n`;
        })
        .join('\n');
      navigator.clipboard.writeText(formattedTranscript);
      toast({
        title: "Copied",
        description: "Transcript copied to clipboard"
      });
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusConfig = () => {
    if (isListening) {
      return {
        text: "Recording",
        color: "text-red-500",
        bgColor: "bg-red-500",
        icon: <Volume2 className="h-4 w-4" />
      };
    }
    if (isPaused) {
      return {
        text: "Paused",
        color: "text-yellow-500",
        bgColor: "bg-yellow-500",
        icon: <Pause className="h-4 w-4" />
      };
    }
    return {
      text: "Ready",
      color: "text-muted-foreground",
      bgColor: "bg-muted-foreground",
      icon: <MicOff className="h-4 w-4" />
    };
  };

  const status = getStatusConfig();
  const wordCount = fullTranscript.split(' ').filter(word => word.trim()).length;

  return (
    <Card className="card-shadow-lg border-border/50 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border/50 pb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={isListening ? 'p-2 bg-red-500/10 rounded-lg' : 'p-2 bg-muted/10 rounded-lg'}>
                <Mic className={`h-5 w-5 ${isListening ? 'text-red-500' : 'text-muted-foreground'}`} />
              </div>
              {isListening && (
                <div className="absolute -top-1 -right-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                </div>
              )}
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">Live Transcript</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                <span className={status.color}>{status.text}</span>
                {transcriptSegments.length > 0 && (
                  <>
                    <span className="text-border">•</span>
                    <span>{transcriptSegments.length} segments</span>
                  </>
                )}
              </p>
            </div>
          </div>
          
          {/* Speaker Selector & Auto-Detect Toggle */}
          <div className="flex items-center gap-3">
            {/* Auto-Detect Badge */}
            {autoDetectEnabled && isListening && (
              <Badge variant={confidence > 0.7 ? "default" : "secondary"} className="gap-1.5 text-xs">
                <Zap className="h-3 w-3" />
                Auto {Math.round(confidence * 100)}%
              </Badge>
            )}
            
            {/* Auto-Detect Toggle */}
            <Button
              variant={autoDetectEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoDetectEnabled(!autoDetectEnabled)}
              className="h-8 px-2 text-xs gap-1.5"
              title={autoDetectEnabled ? "Auto-detect ON" : "Auto-detect OFF"}
              data-testid="button-toggle-auto-detect"
            >
              <Zap className={`h-3.5 w-3.5 ${autoDetectEnabled ? '' : 'opacity-50'}`} />
              Auto
            </Button>
            
            {/* Manual Speaker Selector */}
            {!autoDetectEnabled && (
              <>
                <Users className="h-4 w-4 text-muted-foreground" />
                <Select value={currentSpeakerId} onValueChange={setCurrentSpeakerId}>
                  <SelectTrigger className="w-[140px] h-8 text-xs" data-testid="select-speaker">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {speakers.map(speaker => (
                      <SelectItem key={speaker.id} value={speaker.id}>
                        <div className="flex items-center gap-2">
                          <div className={`w-5 h-5 rounded-full ${speaker.color} text-white text-[10px] font-bold flex items-center justify-center`}>
                            {speaker.initials}
                          </div>
                          <span>{speaker.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {/* Meeting Audio Capture Guide */}
        <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-sm text-amber-900 dark:text-amber-100">
            <div className="space-y-2">
              <p className="font-semibold">📞 In a Teams/Zoom meeting?</p>
              <p className="text-xs">Currently, only YOUR voice (from microphone) is transcribed. Remote participants' audio cannot be captured directly by web browsers.</p>
              
              <div className="mt-3 space-y-2">
                <p className="font-semibold text-xs">💡 Workarounds:</p>
                <ol className="list-decimal ml-4 space-y-1.5 text-xs">
                  <li>
                    <strong>Use built-in meeting transcription:</strong> Teams/Zoom have native transcription that captures all participants
                  </li>
                  <li>
                    <strong>Virtual audio cable (advanced):</strong> Route your speaker output to a virtual microphone input using software like VB-Cable
                  </li>
                  <li>
                    <strong>Record & transcribe after:</strong> Record the meeting and upload the audio file to a transcription service
                  </li>
                </ol>
              </div>
              
              <div className="mt-3 p-2 bg-amber-100 dark:bg-amber-900/30 rounded text-xs">
                <strong>Why this limitation?</strong> Web browsers can only access your microphone, not audio playing through your speakers (for security/privacy reasons).
              </div>
            </div>
          </AlertDescription>
        </Alert>

        <div 
          className="min-h-[220px] max-h-[280px] overflow-y-auto p-4 bg-muted/30 rounded-xl border border-border/30" 
          data-testid="live-transcript"
        >
          {transcriptSegments.length > 0 || interimTranscript ? (
            <div className="space-y-4">
              {transcriptSegments.map((segment, index) => {
                const speaker = getSpeakerById(segment.speakerId);
                return (
                  <div key={index} className="flex gap-3" data-testid={`transcript-segment-${index}`}>
                    {/* Speaker Avatar */}
                    <div className={`w-8 h-8 rounded-full ${speaker.color} text-white text-xs font-bold flex items-center justify-center flex-shrink-0 shadow-sm`}>
                      {speaker.initials}
                    </div>
                    
                    {/* Speaker Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-semibold text-sm text-foreground" data-testid={`speaker-name-${index}`}>
                          {speaker.name}:
                        </span>
                        <span className="text-xs text-muted-foreground" data-testid={`timestamp-${index}`}>
                          {formatTimestamp(segment.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/80 leading-relaxed" data-testid={`speaker-text-${index}`}>
                        {segment.text}
                      </p>
                    </div>
                  </div>
                );
              })}
              
              {/* Interim/Live Transcript */}
              {isListening && interimTranscript && (
                <div className="flex gap-3 animate-pulse">
                  <div className={`w-8 h-8 rounded-full ${getCurrentSpeaker().color} text-white text-xs font-bold flex items-center justify-center flex-shrink-0 shadow-sm`}>
                    {getCurrentSpeaker().initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-semibold text-sm text-foreground">
                        {getCurrentSpeaker().name}:
                      </span>
                      <Radio className="h-3 w-3 text-red-500 animate-pulse" />
                    </div>
                    <p className="text-sm text-foreground/60 leading-relaxed italic">
                      {interimTranscript}
                      <span className="inline-block w-0.5 h-4 ml-1 bg-primary animate-pulse"></span>
                    </p>
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
                {isSupported ? 
                  (isListening ? "Listening for your voice..." : 
                   isPaused ? "Recording paused" : 
                   "Click Start to begin recording") :
                  "Speech recognition not supported in this browser"}
              </p>
              {isSupported && !isListening && (
                <div className="text-xs text-muted-foreground/70 max-w-md space-y-2">
                  <p>⚡ Auto-detect ON: Automatically switches speakers when voice changes</p>
                  <p>🌍 Supports all languages - just speak naturally</p>
                  <p>💡 Toggle "Auto" button off to manually select speakers</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-2">
            {!isListening && !isPaused ? (
              <Button
                onClick={startListening}
                disabled={!isSupported}
                className="bg-green-600 hover:bg-green-700 rounded-lg btn-professional h-10"
                data-testid="button-start"
              >
                <Play className="h-4 w-4 mr-2" />
                Start
              </Button>
            ) : isListening ? (
              <Button
                onClick={pauseListening}
                className="bg-yellow-600 hover:bg-yellow-700 rounded-lg btn-professional h-10"
                data-testid="button-pause"
              >
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
            ) : (
              <Button
                onClick={startListening}
                className="bg-blue-600 hover:bg-blue-700 rounded-lg btn-professional h-10"
                data-testid="button-resume"
              >
                <Play className="h-4 w-4 mr-2" />
                Resume
              </Button>
            )}
            
            {(isListening || isPaused) && (
              <Button
                onClick={stopListening}
                variant="destructive"
                className="rounded-lg btn-professional h-10"
                data-testid="button-stop"
              >
                <Square className="h-4 w-4 mr-2" />
                Stop
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={copyTranscript}
              disabled={!fullTranscript}
              variant="outline"
              size="sm"
              className="rounded-lg border-border/50 h-10"
              data-testid="button-copy"
            >
              <Copy className="h-3.5 w-3.5 mr-2" />
              Copy
            </Button>
            <Button
              onClick={clearTranscript}
              disabled={!fullTranscript && !interimTranscript}
              variant="outline"
              size="sm"
              className="rounded-lg border-border/50 h-10"
              data-testid="button-clear"
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Clear
            </Button>
          </div>
        </div>
      </CardContent>

    </Card>
  );
}
