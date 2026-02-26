import { useState, useEffect, useCallback, useRef } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

interface SessionHistoryItem {
  sessionId: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  summary?: string | null;
  transcriptionStarted: boolean;
}

interface TotalUsageResponse {
  totalSessions: number;
  totalSeconds: number;
  totalMinutes: number;
  totalHours: number;
}

interface CurrentSessionResponse {
  session: {
    sessionId: string;
    startTime: string;
    lastResumeTime: string;
    accumulatedDurationMs: number;
    isPaused: boolean;
    status: string;
    currentDurationMs: number;
    currentDurationSeconds: number;
  } | null;
}

export function useSessionTimer() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentSessionTime, setCurrentSessionTime] = useState(0);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [clientStartTime, setClientStartTime] = useState<number | null>(null); // Client-side start time
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasUserStartedTimerRef = useRef<boolean>(false);

  // Query for current active session from backend (only for session ID, not for time)
  const { data: currentSessionData } = useQuery<CurrentSessionResponse>({
    queryKey: ["/api/session-usage/current"],
    refetchInterval: 30000, // Refetch every 30 seconds (less frequent, only for session status)
    enabled: true,
  });

  // Query for total usage from profile subscription endpoint
  const { data: subscriptionData } = useQuery<{
    sessionHistory?: SessionHistoryItem[];
    minutesUsed?: string;
    sessionsUsed?: string;
  }>({
    queryKey: ["/api/profile/subscription"],
    refetchInterval: isRunning ? 30000 : false, // Refetch every 30 seconds when running
  });

  // Sync session status with backend (load initial time on refresh, then run client-side)
  useEffect(() => {
    console.log('🔄 Session status check:', currentSessionData);
    
    if (currentSessionData?.session) {
      const session = currentSessionData.session;
      
      // Check if this is a fresh page load with existing session
      if (!hasUserStartedTimerRef.current && session.status === "active") {
        // CRITICAL FIX: Stop the stale session in the database
        // This prevents continuous background syncing
        console.log(`🛑 Found stale active session ${session.sessionId} - stopping it in DB`);
        
        // Stop the session in the background
        (async () => {
          try {
            await apiRequest("PUT", `/api/session-usage/${session.sessionId}/stop`, {
              finalDurationSeconds: session.currentDurationSeconds
            });
            console.log(`✅ Stopped stale session ${session.sessionId}`);
            
            // Refresh the current session data
            queryClient.invalidateQueries({ queryKey: ["/api/session-usage/current"] });
            queryClient.invalidateQueries({ queryKey: ["/api/profile/subscription"] });
          } catch (error) {
            console.error('Failed to stop stale session:', error);
          }
        })();
        
        // Don't load the session into the UI
        setActiveSessionId(null);
        setCurrentSessionTime(0);
        setIsRunning(false);
        setIsPaused(false);
        
        console.log('⏸️ Stale session stopped - user needs to click Start for new session');
      } else if (hasUserStartedTimerRef.current) {
        // User has started timer in THIS session - just keep session ID synced
        if (activeSessionId !== session.sessionId) {
          setActiveSessionId(session.sessionId);
          console.log(`📝 Session ID synced: ${session.sessionId}`);
        }
        // Time continues to run client-side, no sync from server
      }
    } else {
      console.log('❌ No active session from backend');
      
      // No active session - reset
      if (isRunning) {
        setIsRunning(false);
      }
      if (isPaused) {
        setIsPaused(false);
      }
      if (activeSessionId) {
        setActiveSessionId(null);
      }
    }
  }, [currentSessionData]);

  // CLIENT-SIDE TIMER: Runs purely on client, no server sync for time
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // DEFENSIVE: Only run timer if user started it AND isRunning is true
    if (isRunning && hasUserStartedTimerRef.current) {
      console.log('⏱️ Starting CLIENT-SIDE timer (no server sync for time)');
      intervalRef.current = setInterval(() => {
        setCurrentSessionTime(prev => prev + 1);
      }, 1000);
    } else if (isRunning && !hasUserStartedTimerRef.current) {
      // Safety check: If timer is running but user didn't start it, stop it
      console.log('🛑 SAFETY: Timer is running but user did not start it - forcing stop');
      setIsRunning(false);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  // REMOVED: No more periodic sync to backend for time
  // Time is now purely client-side, only sync on explicit actions (start/stop/pause/resume)
  
  // ADDED BACK: Periodic sync to DB every 10 seconds (for backup/recovery)
  // CRITICAL: Only sync if user has explicitly started the timer
  useEffect(() => {
    // DEFENSIVE: Don't sync if user hasn't started timer OR timer isn't running
    if (!isRunning || !activeSessionId || !hasUserStartedTimerRef.current) {
      return;
    }

    // Sync current time to backend every 10 seconds
    const syncInterval = setInterval(async () => {
      try {
        console.log(`🔄 Syncing current time to DB: ${currentSessionTime}s`);
        await apiRequest("PUT", `/api/session-usage/${activeSessionId}/sync`, {
          currentDurationSeconds: currentSessionTime
        });
        console.log(`✅ Synced ${currentSessionTime}s to DB`);
      } catch (error) {
        console.error('Failed to sync time to DB:', error);
      }
    }, 10000); // Every 10 seconds

    return () => {
      clearInterval(syncInterval);
    };
  }, [isRunning, activeSessionId, currentSessionTime, hasUserStartedTimerRef.current]);

  // Calculate total usage from subscription data + current session
  // IMPORTANT: Always include current session time (whether running or paused)
  // because backend only counts ENDED sessions
  const totalUsage: TotalUsageResponse | undefined = subscriptionData ? {
    totalSessions: parseInt(subscriptionData.sessionsUsed || '0'),
    totalMinutes: parseInt(subscriptionData.minutesUsed || '0') + Math.floor(currentSessionTime / 60),
    totalSeconds: parseInt(subscriptionData.minutesUsed || '0') * 60 + currentSessionTime,
    totalHours: Math.floor((parseInt(subscriptionData.minutesUsed || '0') + Math.floor(currentSessionTime / 60)) / 60),
  } : undefined;

  const startTimer = useCallback(async () => {
    if (!isRunning) {
      try {
        // Mark that user has explicitly started the timer
        hasUserStartedTimerRef.current = true;
        
        // Call backend API to start session tracking
        const response = await apiRequest("POST", "/api/session-usage/start", {});
        const data = await response.json();
        
        if (!response.ok) {
          console.error('Failed to start session tracking:', data);
          throw new Error(data.message || 'Failed to start session');
        }

        // Start CLIENT-SIDE timer from 0
        setIsRunning(true);
        setCurrentSessionTime(0);
        setActiveSessionId(data.sessionUsage.sessionId);
        setClientStartTime(Date.now());
        console.log('⏱️ CLIENT-SIDE timer started from 0, Session ID:', data.sessionUsage.sessionId);
        
        // Invalidate queries to refresh usage data immediately
        queryClient.invalidateQueries({ queryKey: ["/api/session-usage/current"] });
        queryClient.invalidateQueries({ queryKey: ["/api/profile/subscription"] });
        
        // Return session info so caller can show warnings
        return data;
      } catch (error: any) {
        console.error('Failed to start session timer:', error);
        hasUserStartedTimerRef.current = false; // Reset on error
        throw error; // Re-throw so caller can handle
      }
    }
  }, [isRunning]);

  const stopTimer = useCallback(async () => {
    if ((isRunning || isPaused) && activeSessionId) {
      try {
        // Send final time to backend before stopping
        const finalTime = currentSessionTime;
        console.log(`⏱️ Stopping session with final time: ${finalTime}s`);
        
        const response = await apiRequest("PUT", `/api/session-usage/${activeSessionId}/stop`, {
          finalDurationSeconds: finalTime // Send client-side time to backend
        });
        const data = await response.json();
        
        if (!response.ok) {
          console.error('Failed to stop session tracking:', data);
        } else {
          console.log('⏱️ Session stopped:', data.sessionUsage);
        }
      } catch (error) {
        console.error('Failed to stop session timer:', error);
      } finally {
        // Reset current session to 0
        setIsRunning(false);
        setIsPaused(false);
        setCurrentSessionTime(0);
        setActiveSessionId(null);
        setClientStartTime(null);
        hasUserStartedTimerRef.current = false;
        
        // Invalidate queries to refresh total usage from DB
        queryClient.invalidateQueries({ queryKey: ["/api/session-usage/current"] });
        queryClient.invalidateQueries({ queryKey: ["/api/profile/subscription"] });
        queryClient.invalidateQueries({ queryKey: ["/api/session-minutes/status"] });
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/check-limits"] });
        console.log('⏱️ CLIENT-SIDE timer stopped and reset to 0');
      }
    }
  }, [isRunning, isPaused, activeSessionId, currentSessionTime]);

  const pauseTimer = useCallback(async () => {
    if (isRunning && activeSessionId) {
      try {
        // Stop client-side timer first
        setIsRunning(false);
        setIsPaused(true);
        console.log(`⏸️ CLIENT-SIDE timer paused at: ${currentSessionTime}s`);
        
        // Notify backend
        const response = await apiRequest("PUT", `/api/session-usage/${activeSessionId}/pause`, {
          currentDurationSeconds: currentSessionTime // Send current time
        });
        const data = await response.json();
        
        if (!response.ok) {
          console.error('Failed to pause session:', data);
        } else {
          console.log('⏱️ Session paused on backend');
          queryClient.invalidateQueries({ queryKey: ["/api/session-usage/current"] });
        }
      } catch (error) {
        console.error('Failed to pause session timer:', error);
      }
    }
  }, [isRunning, activeSessionId, currentSessionTime]);

  const resumeTimer = useCallback(async () => {
    // Resume if we have an active session
    if (activeSessionId) {
      try {
        // Mark that user has explicitly started/resumed the timer
        hasUserStartedTimerRef.current = true;
        
        const response = await apiRequest("PUT", `/api/session-usage/${activeSessionId}/resume`, {});
        const data = await response.json();
        
        if (!response.ok) {
          console.error('Failed to resume session:', data);
        } else {
          // Resume client-side timer from current time
          setIsRunning(true);
          setClientStartTime(Date.now());
          console.log(`⏱️ CLIENT-SIDE timer resumed from: ${currentSessionTime}s`);
          queryClient.invalidateQueries({ queryKey: ["/api/session-usage/current"] });
        }
      } catch (error) {
        console.error('Failed to resume session timer:', error);
      }
    } else {
      console.warn('⚠️ resumeTimer called but no activeSessionId');
    }
  }, [activeSessionId, currentSessionTime]);

  return {
    isRunning,
    currentSessionTime,
    totalUsage,
    startTimer,
    stopTimer,
    pauseTimer,
    resumeTimer,
    activeSessionId,
  };
}
