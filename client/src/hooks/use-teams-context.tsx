import { useEffect, useState, useCallback } from "react";
import { app, meeting } from "@microsoft/teams-js";

interface TeamsContext {
  isInitialized: boolean;
  isInMeeting: boolean;
  meetingId?: string;
  userId?: string;
  userName?: string;
  organizerId?: string;
  isRecording?: boolean;
  error?: string;
}

interface UseTeamsContextReturn {
  teamsContext: TeamsContext;
  initializeTeams: () => Promise<void>;
  getTeamsContext: () => Promise<void>;
  startLiveStream: (streamUrl: string, streamKey: string) => Promise<void>;
  toggleIncomingAudio: () => Promise<void>;
  shareToStage: (appUrl: string) => Promise<void>;
}

export function useTeamsContext(): UseTeamsContextReturn {
  const [teamsContext, setTeamsContext] = useState<TeamsContext>({
    isInitialized: false,
    isInMeeting: false,
  });

  const initializeTeams = useCallback(async () => {
    try {
      // Check if running in Teams environment
      if (typeof window === 'undefined' || !window.navigator.userAgent.includes('Teams')) {
        console.log('Not running in Microsoft Teams environment');
        setTeamsContext(prev => ({ 
          ...prev, 
          isInitialized: false,
          error: 'Not running in Microsoft Teams environment'
        }));
        return;
      }

      // Initialize Teams SDK
      await app.initialize();
      
      setTeamsContext(prev => ({ 
        ...prev, 
        isInitialized: true,
        error: undefined
      }));

      // Get initial context directly
      try {
        const context = await app.getContext();
        
        setTeamsContext(prev => ({
          ...prev,
          isInMeeting: !!context.meeting?.id,
          meetingId: context.meeting?.id,
          userId: context.user?.id,
          userName: context.user?.userPrincipalName,
          organizerId: context.user?.id, // Use user ID as organizer fallback
          isRecording: false, // Recording status not available in context
        }));
      } catch (contextError) {
        console.error('Failed to get Teams context after initialization:', contextError);
        setTeamsContext(prev => ({ 
          ...prev, 
          error: contextError instanceof Error ? contextError.message : 'Failed to get Teams context'
        }));
      }
    } catch (error) {
      console.error('Teams initialization failed:', error);
      setTeamsContext(prev => ({ 
        ...prev, 
        isInitialized: false,
        error: error instanceof Error ? error.message : 'Teams initialization failed'
      }));
    }
  }, []);

  const getTeamsContext = useCallback(async () => {
    try {
      if (!teamsContext.isInitialized) {
        throw new Error('Teams SDK not initialized');
      }

      const context = await app.getContext();
      
      setTeamsContext(prev => ({
        ...prev,
        isInMeeting: !!context.meeting?.id,
        meetingId: context.meeting?.id,
        userId: context.user?.id,
        userName: context.user?.userPrincipalName,
        organizerId: context.user?.id, // Use user ID as organizer fallback
        isRecording: false, // Recording status not available in context
      }));
    } catch (error) {
      console.error('Failed to get Teams context:', error);
      setTeamsContext(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to get Teams context'
      }));
    }
  }, [teamsContext.isInitialized]);

  const startLiveStream = useCallback(async (streamUrl: string, streamKey: string) => {
    return new Promise<void>((resolve, reject) => {
      if (!teamsContext.isInMeeting) {
        reject(new Error('Not in a Teams meeting'));
        return;
      }

      meeting.requestStartLiveStreaming((error) => {
        if (error) {
          reject(new Error(`Live streaming failed: ${error}`));
        } else {
          resolve();
        }
      }, streamUrl, streamKey);
    });
  }, [teamsContext.isInMeeting]);

  const toggleIncomingAudio = useCallback(async () => {
    return new Promise<void>((resolve, reject) => {
      if (!teamsContext.isInMeeting) {
        reject(new Error('Not in a Teams meeting'));
        return;
      }

      meeting.toggleIncomingClientAudio((error, newState) => {
        if (error) {
          reject(new Error(`Audio toggle failed: ${error}`));
        } else {
          console.log('Audio toggled to:', newState);
          resolve();
        }
      });
    });
  }, [teamsContext.isInMeeting]);

  const shareToStage = useCallback(async (appUrl: string) => {
    return new Promise<void>((resolve, reject) => {
      if (!teamsContext.isInMeeting) {
        reject(new Error('Not in a Teams meeting'));
        return;
      }

      // Check sharing capabilities first
      meeting.getAppContentStageSharingCapabilities((error, capabilities) => {
        if (error) {
          reject(new Error(`Failed to check sharing capabilities: ${error}`));
          return;
        }

        if (!capabilities?.doesAppHaveSharePermission) {
          reject(new Error('App does not have share permission'));
          return;
        }

        // Share content to stage
        meeting.shareAppContentToStage((shareError, result) => {
          if (shareError) {
            reject(new Error(`Share to stage failed: ${shareError}`));
          } else {
            console.log('Successfully shared to stage:', result);
            resolve();
          }
        }, appUrl);
      });
    });
  }, [teamsContext.isInMeeting]);

  // Auto-initialize on mount if in Teams environment
  useEffect(() => {
    initializeTeams();
  }, [initializeTeams]);

  // Set up event listeners for Teams context changes
  useEffect(() => {
    if (!teamsContext.isInitialized) return;

    let streamHandler: ((state: any) => void) | undefined;

    try {
      // Register for live stream state changes
      streamHandler = (state: any) => {
        console.log('Live stream state changed:', state);
      };
      
      meeting.registerLiveStreamChangedHandler(streamHandler);
    } catch (error) {
      console.error('Failed to register Teams event handlers:', error);
    }

    // Cleanup
    return () => {
      if (streamHandler) {
        try {
          // Note: Teams SDK doesn't provide explicit unregister method
          // Event handlers are automatically cleaned up when component unmounts
        } catch (error) {
          console.error('Error during Teams event cleanup:', error);
        }
      }
    };
  }, [teamsContext.isInitialized]);

  return {
    teamsContext,
    initializeTeams,
    getTeamsContext,
    startLiveStream,
    toggleIncomingAudio,
    shareToStage,
  };
}