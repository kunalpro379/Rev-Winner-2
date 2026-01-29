import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useTeamsContext } from "@/hooks/use-teams-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface TeamsMeetingData {
  id: string;
  conversationId: string;
  meetingId?: string;
  meetingTitle?: string;
  organizerId?: string;
  startTime: string;
  endTime?: string;
  status: string;
  participants: string[];
  recordingUrl?: string;
  transcriptUrl?: string;
}

interface AudioSource {
  id: string;
  conversationId: string;
  sourceType: string;
  sourceId?: string;
  teamsMeetingId?: string;
  status: string;
  metadata: Record<string, any>;
  connectedAt: string;
  disconnectedAt?: string;
}

interface TeamsMeetingPanelProps {
  conversationId: string;
  sessionId: string;
}

export function TeamsMeetingPanel({ conversationId, sessionId }: TeamsMeetingPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { teamsContext, initializeTeams, getTeamsContext } = useTeamsContext();
  
  const [meetingTitle, setMeetingTitle] = useState("");
  const [participants, setParticipants] = useState("");
  const [isCreatingMeeting, setIsCreatingMeeting] = useState(false);

  // Query existing Teams meeting
  const { data: teamsMeetingData, isLoading: isLoadingMeeting } = useQuery({
    queryKey: ['/api/conversations', sessionId, 'teams-meeting'],
    enabled: !!sessionId,
  });

  // Query Teams connection status
  const { data: teamsStatus } = useQuery({
    queryKey: ['/api/conversations', sessionId, 'teams-status'],
    enabled: !!sessionId,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Create or join Teams meeting mutation
  const createMeetingMutation = useMutation({
    mutationFn: async (meetingData: any) => {
      return apiRequest('POST', `/api/conversations/${sessionId}/teams-meeting`, meetingData);
    },
    onSuccess: () => {
      toast({
        title: "Teams Meeting Connected",
        description: "Successfully connected to Microsoft Teams meeting",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', sessionId, 'teams-meeting'] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', sessionId, 'teams-status'] });
      setIsCreatingMeeting(false);
    },
    onError: (error) => {
      toast({
        title: "Teams Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect to Teams meeting",
        variant: "destructive",
      });
    },
  });

  // Update meeting with recordings/transcripts
  const updateMeetingMutation = useMutation({
    mutationFn: async (updates: any) => {
      return apiRequest('PATCH', `/api/conversations/${sessionId}/teams-meeting`, updates);
    },
    onSuccess: () => {
      toast({
        title: "Meeting Updated",
        description: "Teams meeting information updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', sessionId, 'teams-meeting'] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update meeting",
        variant: "destructive",
      });
    },
  });

  // Auto-connect to Teams meeting if context is available
  useEffect(() => {
    if (teamsContext.isInMeeting && teamsContext.meetingId && !((teamsMeetingData as any)?.teamsMeeting)) {
      const autoConnectData = {
        meetingId: teamsContext.meetingId,
        meetingTitle: meetingTitle || `Sales Discovery Call - ${new Date().toLocaleDateString()}`,
        organizerId: teamsContext.organizerId || teamsContext.userId,
        participants: [teamsContext.userName].filter(Boolean),
      };
      
      createMeetingMutation.mutate(autoConnectData);
    }
  }, [teamsContext.isInMeeting, teamsContext.meetingId, teamsMeetingData, meetingTitle, teamsContext.organizerId, teamsContext.userId, teamsContext.userName]);

  const handleCreateMeeting = async () => {
    if (!meetingTitle.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a meeting title",
        variant: "destructive",
      });
      return;
    }

    const participantList = participants
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0);

    const meetingData = {
      meetingTitle: meetingTitle.trim(),
      organizerId: teamsContext.userId || 'unknown',
      participants: participantList,
      ...(teamsContext.meetingId && { meetingId: teamsContext.meetingId }),
    };

    createMeetingMutation.mutate(meetingData);
  };

  const handleEndMeeting = async () => {
    const existingMeeting = (teamsMeetingData as any)?.teamsMeeting as TeamsMeetingData | undefined;
    if (!existingMeeting) return;

    updateMeetingMutation.mutate({
      status: 'ended',
      endTime: new Date().toISOString(),
    });
  };

  const existingMeeting = (teamsMeetingData as any)?.teamsMeeting as TeamsMeetingData | undefined;
  const audioSource = (teamsMeetingData as any)?.audioSource as AudioSource | undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <i className="fas fa-users text-blue-600"></i>
          Microsoft Teams Integration
        </CardTitle>
        <p className="text-xs text-muted-foreground">Connect and manage Teams meetings</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Teams Context Status */}
          <div className="bg-muted/30 rounded-lg p-3">
            <h4 className="text-sm font-medium mb-2">Teams Context Status</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">SDK Initialized:</span>
                <Badge variant={teamsContext.isInitialized ? "default" : "secondary"}>
                  {teamsContext.isInitialized ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">In Meeting:</span>
                <Badge variant={teamsContext.isInMeeting ? "default" : "secondary"}>
                  {teamsContext.isInMeeting ? "Yes" : "No"}
                </Badge>
              </div>
              {teamsContext.meetingId && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Meeting ID:</span>
                  <span className="text-xs font-mono">{teamsContext.meetingId.slice(0, 8)}...</span>
                </div>
              )}
              {teamsContext.error && (
                <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                  {teamsContext.error}
                </div>
              )}
            </div>
          </div>

          {/* Existing Meeting Info */}
          {existingMeeting ? (
            <div className="bg-blue-50 rounded-lg p-3">
              <h4 className="text-sm font-medium mb-2 text-blue-800">Active Teams Meeting</h4>
              <div className="space-y-2">
                <div>
                  <span className="text-xs text-blue-600">Title:</span>
                  <p className="text-sm font-medium">{existingMeeting.meetingTitle}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-blue-600">Status:</span>
                  <Badge variant={existingMeeting.status === 'active' ? "default" : "secondary"}>
                    {existingMeeting.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-blue-600">Participants:</span>
                  <span className="text-xs">{existingMeeting.participants.length}</span>
                </div>
                {audioSource && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-blue-600">Audio Source:</span>
                    <Badge variant={audioSource.status === 'active' ? "default" : "secondary"}>
                      {audioSource.status}
                    </Badge>
                  </div>
                )}
                {existingMeeting.status === 'active' && (
                  <Button
                    onClick={handleEndMeeting}
                    disabled={updateMeetingMutation.isPending}
                    size="sm"
                    variant="destructive"
                    className="w-full"
                    data-testid="button-end-teams-meeting"
                  >
                    {updateMeetingMutation.isPending ? "Ending..." : "End Meeting"}
                  </Button>
                )}
              </div>
            </div>
          ) : null}

          {/* Create/Join Meeting Form */}
          {!existingMeeting && (
            <div className="space-y-3">
              {isCreatingMeeting ? (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="meeting-title" className="text-xs">Meeting Title</Label>
                    <Input
                      id="meeting-title"
                      data-testid="input-meeting-title"
                      placeholder="Enter meeting title..."
                      value={meetingTitle}
                      onChange={(e) => setMeetingTitle(e.target.value)}
                      className="text-xs h-8"
                    />
                  </div>
                  <div>
                    <Label htmlFor="participants" className="text-xs">Participants (comma-separated emails)</Label>
                    <Input
                      id="participants"
                      data-testid="input-participants"
                      placeholder="user1@example.com, user2@example.com"
                      value={participants}
                      onChange={(e) => setParticipants(e.target.value)}
                      className="text-xs h-8"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCreateMeeting}
                      disabled={createMeetingMutation.isPending}
                      size="sm"
                      className="flex-1"
                      data-testid="button-create-meeting"
                    >
                      {createMeetingMutation.isPending ? "Connecting..." : "Connect Meeting"}
                    </Button>
                    <Button
                      onClick={() => setIsCreatingMeeting(false)}
                      size="sm"
                      variant="outline"
                      data-testid="button-cancel-meeting"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {teamsContext.isInMeeting ? (
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-2">
                        Teams meeting detected. Connect to enable audio integration.
                      </p>
                      <Button
                        onClick={() => {
                          setMeetingTitle(`Sales Discovery Call - ${new Date().toLocaleDateString()}`);
                          setIsCreatingMeeting(true);
                        }}
                        size="sm"
                        className="w-full"
                        data-testid="button-connect-detected-meeting"
                      >
                        Connect Current Meeting
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-2">
                        Create a new Teams meeting or join an existing one
                      </p>
                      <Button
                        onClick={() => setIsCreatingMeeting(true)}
                        size="sm"
                        className="w-full"
                        data-testid="button-start-new-meeting"
                      >
                        <i className="fas fa-plus mr-2"></i>
                        Setup Teams Meeting
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Connection Status */}
          {teamsStatus && (
            <div className="bg-muted/30 rounded-lg p-3">
              <h4 className="text-sm font-medium mb-2">Connection Status</h4>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Device Microphone:</span>
                  <Badge variant={(teamsStatus as any)?.deviceMicrophone?.status === 'active' ? "default" : "secondary"}>
                    {(teamsStatus as any)?.deviceMicrophone?.status || 'inactive'}
                  </Badge>
                </div>
                {(teamsStatus as any)?.teamsMeeting && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Teams Meeting:</span>
                    <Badge variant={(teamsStatus as any)?.teamsMeeting?.status === 'active' ? "default" : "secondary"}>
                      {(teamsStatus as any)?.teamsMeeting?.status}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Teams Actions */}
          {teamsContext.isInMeeting && existingMeeting && (
            <div className="bg-muted/30 rounded-lg p-3">
              <h4 className="text-sm font-medium mb-2">Meeting Actions</h4>
              <div className="space-y-2">
                <Button
                  onClick={() => getTeamsContext()}
                  size="sm"
                  variant="outline"
                  className="w-full"
                  data-testid="button-refresh-context"
                >
                  <i className="fas fa-refresh mr-2"></i>
                  Refresh Context
                </Button>
                {/* Additional meeting actions can be added here */}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}