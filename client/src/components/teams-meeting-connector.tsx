import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mic, MicOff, Users, Phone, PhoneOff, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface TeamsConnectionStatus {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  meetingId?: string;
  meetingTitle?: string;
  audioEnabled: boolean;
  participants: string[];
  errorMessage?: string;
}

interface TeamsConnectorProps {
  sessionId: string;
  onConnectionChange?: (status: TeamsConnectionStatus) => void;
  onTranscriptionReceived?: (transcription: string, participantId?: string) => void;
}

export default function TeamsMeetingConnector({ 
  sessionId, 
  onConnectionChange,
  onTranscriptionReceived 
}: TeamsConnectorProps) {
  const [connectionStatus, setConnectionStatus] = useState<TeamsConnectionStatus>({
    status: 'disconnected',
    audioEnabled: false,
    participants: []
  });
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
  const { toast } = useToast();

  // Check Teams integration status before attempting WebSocket connection
  const checkTeamsStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/conversations/${sessionId}/teams-status`);
      const status = await response.json();
      
      if (!status.isIntegrationEnabled) {
        setConnectionStatus(prev => ({
          ...prev,
          status: 'error',
          errorMessage: status.error || 'Teams integration not available'
        }));
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking Teams status:', error);
      setConnectionStatus(prev => ({
        ...prev,
        status: 'error',
        errorMessage: 'Failed to check Teams integration status'
      }));
      return false;
    }
  }, [sessionId]);

  // WebSocket connection for real-time Teams data
  const connectWebSocket = useCallback(async () => {
    // Check if Teams integration is enabled first
    const isEnabled = await checkTeamsStatus();
    if (!isEnabled) {
      return;
    }
    
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/teams-ws?sessionId=${sessionId}`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('Teams WebSocket connected');
      setWsConnection(ws);
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'meeting-available':
            setConnectionStatus(prev => ({
              ...prev,
              meetingId: data.meetingId,
              status: 'disconnected'
            }));
            toast({
              title: "Teams Meeting Detected",
              description: "A Teams meeting is available for connection.",
              duration: 5000
            });
            break;
            
          case 'meeting-started':
            setConnectionStatus(prev => ({
              ...prev,
              status: 'connected',
              meetingId: data.meeting.id,
              meetingTitle: data.meeting.title,
              participants: data.meeting.participants || []
            }));
            onConnectionChange?.({
              status: 'connected',
              meetingId: data.meeting.id,
              meetingTitle: data.meeting.title,
              audioEnabled: connectionStatus.audioEnabled,
              participants: data.meeting.participants || []
            });
            break;
            
          case 'meeting-ended':
            setConnectionStatus(prev => ({
              ...prev,
              status: 'disconnected',
              audioEnabled: false
            }));
            onConnectionChange?.({
              status: 'disconnected',
              audioEnabled: false,
              participants: []
            });
            break;
            
          case 'live-transcription':
            onTranscriptionReceived?.(data.transcription.text, data.transcription.participantId);
            break;
            
          case 'transcription-started':
            setConnectionStatus(prev => ({
              ...prev,
              audioEnabled: true
            }));
            break;
            
          case 'transcription-stopped':
            setConnectionStatus(prev => ({
              ...prev,
              audioEnabled: false
            }));
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    ws.onclose = () => {
      console.log('Teams WebSocket disconnected');
      setWsConnection(null);
      // Attempt to reconnect after 3 seconds
      setTimeout(connectWebSocket, 3000);
    };
    
    ws.onerror = (error) => {
      console.error('Teams WebSocket error:', error);
      setConnectionStatus(prev => ({
        ...prev,
        status: 'error',
        errorMessage: 'WebSocket connection failed'
      }));
    };
    
  }, [sessionId, onConnectionChange, onTranscriptionReceived, toast, checkTeamsStatus]);

  useEffect(() => {
    connectWebSocket();
    
    return () => {
      if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
        wsConnection.close();
      }
    };
  }, [connectWebSocket, wsConnection]);

  const initiateTeamsAuth = async () => {
    try {
      setIsAuthenticating(true);
      
      const response = await fetch(`/api/teams/auth/login?sessionId=${sessionId}&meetingId=${connectionStatus.meetingId || ''}`, {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error('Failed to initiate authentication');
      }
      
      const { authUrl } = await response.json();
      
      // Open authentication in new window
      const authWindow = window.open(authUrl, 'teams-auth', 'width=600,height=700,scrollbars=yes,resizable=yes');
      
      // Listen for auth completion
      const checkAuth = setInterval(() => {
        try {
          if (authWindow?.closed) {
            clearInterval(checkAuth);
            setIsAuthenticating(false);
            
            // Check if auth was successful by looking at URL params
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('authSuccess') === 'true') {
              toast({
                title: "Authentication Successful",
                description: "You're now connected to Microsoft Teams.",
              });
              
              const meetingId = urlParams.get('meetingId');
              if (meetingId) {
                connectToMeeting(meetingId);
              }
            } else if (urlParams.get('authError') === 'true') {
              toast({
                title: "Authentication Failed",
                description: "Failed to authenticate with Microsoft Teams.",
                variant: "destructive"
              });
            }
          }
        } catch (error) {
          // Cross-origin error is expected
        }
      }, 1000);
      
    } catch (error) {
      setIsAuthenticating(false);
      toast({
        title: "Authentication Error",
        description: "Failed to start Teams authentication.",
        variant: "destructive"
      });
    }
  };

  const connectToMeeting = async (meetingId?: string) => {
    const targetMeetingId = meetingId || connectionStatus.meetingId;
    if (!targetMeetingId) {
      toast({
        title: "No Meeting Available", 
        description: "No Teams meeting ID available for connection.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsConnecting(true);
      setConnectionStatus(prev => ({ ...prev, status: 'connecting' }));
      
      const response = await fetch(`/api/teams/meetings/${targetMeetingId}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      
      if (!response.ok) {
        throw new Error('Failed to connect to meeting');
      }
      
      const result = await response.json();
      
      setConnectionStatus(prev => ({
        ...prev,
        status: 'connected',
        meetingId: result.meetingId
      }));
      
      toast({
        title: "Connected to Teams Meeting",
        description: "Successfully connected to the Teams meeting.",
      });
      
    } catch (error) {
      setConnectionStatus(prev => ({ 
        ...prev, 
        status: 'error',
        errorMessage: 'Failed to connect to meeting'
      }));
      
      toast({
        title: "Connection Failed",
        description: "Failed to connect to the Teams meeting.",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectFromMeeting = async () => {
    if (!connectionStatus.meetingId) return;

    try {
      await fetch(`/api/teams/meetings/${connectionStatus.meetingId}/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      
      setConnectionStatus({
        status: 'disconnected',
        audioEnabled: false,
        participants: []
      });
      
      toast({
        title: "Disconnected",
        description: "Disconnected from Teams meeting.",
      });
      
    } catch (error) {
      toast({
        title: "Disconnect Error",
        description: "Failed to disconnect from meeting.",
        variant: "destructive"
      });
    }
  };

  const toggleTranscription = async () => {
    if (!connectionStatus.meetingId) return;

    try {
      const action = connectionStatus.audioEnabled ? 'stop' : 'start';
      const response = await fetch(`/api/teams/meetings/${connectionStatus.meetingId}/transcription/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${action} transcription`);
      }
      
      // WebSocket will handle the status update
      
    } catch (error) {
      toast({
        title: "Transcription Error",
        description: `Failed to ${connectionStatus.audioEnabled ? 'stop' : 'start'} transcription.`,
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus.status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'connecting':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Phone className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus.status) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-blue-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Microsoft Teams Integration
          <Badge className={getStatusColor()}>
            {connectionStatus.status}
          </Badge>
        </CardTitle>
        <CardDescription>
          Connect to your Teams meeting for live transcription
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {connectionStatus.status === 'error' && connectionStatus.errorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{connectionStatus.errorMessage}</AlertDescription>
          </Alert>
        )}

        {connectionStatus.status === 'disconnected' && (
          <div className="space-y-3">
            <Button 
              onClick={initiateTeamsAuth}
              disabled={isAuthenticating}
              className="w-full"
              data-testid="button-teams-auth"
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Phone className="mr-2 h-4 w-4" />
                  Connect to Teams Meeting
                </>
              )}
            </Button>
            
            {connectionStatus.meetingId && (
              <Button 
                onClick={() => connectToMeeting()}
                disabled={isConnecting}
                variant="outline"
                className="w-full"
                data-testid="button-teams-connect"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Users className="mr-2 h-4 w-4" />
                    Join Meeting: {connectionStatus.meetingId}
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {connectionStatus.status === 'connected' && (
          <div className="space-y-3">
            {connectionStatus.meetingTitle && (
              <div className="text-sm text-muted-foreground">
                <strong>Meeting:</strong> {connectionStatus.meetingTitle}
              </div>
            )}
            
            {connectionStatus.participants.length > 0 && (
              <div className="text-sm text-muted-foreground">
                <strong>Participants:</strong> {connectionStatus.participants.length}
              </div>
            )}
            
            <div className="flex gap-2">
              <Button
                onClick={toggleTranscription}
                variant={connectionStatus.audioEnabled ? "destructive" : "default"}
                className="flex-1"
                data-testid="button-toggle-transcription"
              >
                {connectionStatus.audioEnabled ? (
                  <>
                    <MicOff className="mr-2 h-4 w-4" />
                    Stop Transcription
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-4 w-4" />
                    Start Transcription
                  </>
                )}
              </Button>
              
              <Button
                onClick={disconnectFromMeeting}
                variant="outline"
                className="flex-1"
                data-testid="button-teams-disconnect"
              >
                <PhoneOff className="mr-2 h-4 w-4" />
                Disconnect
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}