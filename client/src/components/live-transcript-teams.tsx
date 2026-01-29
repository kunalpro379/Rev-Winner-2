import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Download, User, Bot, Clock, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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

interface LiveTranscriptTeamsProps {
  sessionId: string;
  isTeamsConnected: boolean;
  onTranscriptUpdate?: (entries: TranscriptEntry[]) => void;
}

export default function LiveTranscriptTeams({ 
  sessionId, 
  isTeamsConnected,
  onTranscriptUpdate 
}: LiveTranscriptTeamsProps) {
  const [transcriptEntries, setTranscriptEntries] = useState<TranscriptEntry[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [participants, setParticipants] = useState<Map<string, string>>(new Map());
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Connect to WebSocket for real-time transcription
    if (isTeamsConnected) {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/teams-ws?sessionId=${sessionId}`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'live-transcription') {
            const transcription = data.transcription;
            
            const newEntry: TranscriptEntry = {
              id: `${Date.now()}-${Math.random()}`,
              text: transcription.text,
              participantId: transcription.participantId,
              participantName: participants.get(transcription.participantId) || transcription.participantId || 'Unknown',
              timestamp: new Date(transcription.timestamp),
              confidence: transcription.confidence,
              isFinal: transcription.isFinal,
              source: 'teams'
            };
            
            setTranscriptEntries(prev => {
              // If this is an interim result, replace the last entry from the same participant
              if (!transcription.isFinal && prev.length > 0) {
                const lastEntry = prev[prev.length - 1];
                if (lastEntry.participantId === transcription.participantId && !lastEntry.isFinal) {
                  return [...prev.slice(0, -1), newEntry];
                }
              }
              
              return [...prev, newEntry];
            });
          } else if (data.type === 'transcription-started') {
            setIsRecording(true);
          } else if (data.type === 'transcription-stopped') {
            setIsRecording(false);
          } else if (data.type === 'meeting-started') {
            // Update participants list
            if (data.meeting.participants) {
              const newParticipants = new Map();
              data.meeting.participants.forEach((p: any, index: number) => {
                newParticipants.set(p.id || `participant-${index}`, p.name || `Participant ${index + 1}`);
              });
              setParticipants(newParticipants);
            }
          }
        } catch (error) {
          console.error('Error parsing transcription WebSocket message:', error);
        }
      };
      
      ws.onclose = () => {
        wsRef.current = null;
      };
      
      return () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      };
    }
  }, [isTeamsConnected, sessionId, participants]);

  useEffect(() => {
    // Auto-scroll to bottom when new entries are added
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [transcriptEntries]);

  useEffect(() => {
    // Notify parent component of transcript updates
    onTranscriptUpdate?.(transcriptEntries);
  }, [transcriptEntries, onTranscriptUpdate]);

  const addLocalTranscript = (text: string, source: 'local' | 'ai' = 'local') => {
    const newEntry: TranscriptEntry = {
      id: `${Date.now()}-${Math.random()}`,
      text,
      timestamp: new Date(),
      isFinal: true,
      source,
      participantName: source === 'ai' ? 'AI Assistant' : 'You'
    };
    
    setTranscriptEntries(prev => [...prev, newEntry]);
  };

  const downloadTranscript = () => {
    const transcriptText = transcriptEntries
      .filter(entry => entry.isFinal)
      .map(entry => {
        const timestamp = entry.timestamp.toLocaleTimeString();
        const speaker = entry.participantName || 'Unknown';
        return `[${timestamp}] ${speaker}: ${entry.text}`;
      })
      .join('\n');
    
    const blob = new Blob([transcriptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teams-transcript-${sessionId}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getSourceIcon = (source: TranscriptEntry['source']) => {
    switch (source) {
      case 'teams':
        return <Users className="h-3 w-3" />;
      case 'ai':
        return <Bot className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  const getSourceColor = (source: TranscriptEntry['source']) => {
    switch (source) {
      case 'teams':
        return 'bg-blue-500';
      case 'ai':
        return 'bg-purple-500';
      default:
        return 'bg-green-500';
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Live Transcript
            {isRecording && (
              <Badge variant="destructive" className="animate-pulse">
                Recording
              </Badge>
            )}
          </CardTitle>
          
          <Button
            onClick={downloadTranscript}
            disabled={transcriptEntries.length === 0}
            variant="outline"
            size="sm"
            data-testid="button-download-transcript"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0">
        <ScrollArea ref={scrollAreaRef} className="h-full px-6 pb-6">
          {transcriptEntries.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              {isTeamsConnected ? (
                <div className="text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Waiting for conversation to begin...</p>
                  <p className="text-sm">Start speaking or enable transcription</p>
                </div>
              ) : (
                <div className="text-center">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Connect to Teams meeting to see live transcript</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {transcriptEntries.map((entry, index) => (
                <div key={entry.id} className="group">
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${getSourceColor(entry.source)}`}>
                      {getSourceIcon(entry.source)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {entry.participantName || 'Unknown'}
                        </span>
                        
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(entry.timestamp, { addSuffix: true })}
                        </span>
                        
                        {entry.confidence && entry.confidence < 0.8 && (
                          <Badge variant="outline" className="text-xs">
                            Low confidence
                          </Badge>
                        )}
                        
                        {!entry.isFinal && (
                          <Badge variant="secondary" className="text-xs animate-pulse">
                            Speaking...
                          </Badge>
                        )}
                      </div>
                      
                      <p className={`text-sm leading-relaxed ${!entry.isFinal ? 'italic opacity-70' : ''}`}>
                        {entry.text}
                      </p>
                    </div>
                  </div>
                  
                  {index < transcriptEntries.length - 1 && (
                    <Separator className="mt-4" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}