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
  const [lastSyncTime, setLastSyncTime] = useState<number>(Date.now());
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasUserStartedTimerRef = useRef<boolean>(false); // Track if user explicitly started timer in THIS session

  // Query for current active session from backend (source of truth)
  const { data: currentSessionData } = useQuery<CurrentSessionResponse>({
    queryKey: ["/api/session-usage/current"],
    refetchInterval: 5000, // Refetch every 5 seconds to sync with backend
    enabled: true,
  });

  // Query for total usage from profile subscription endpoint
  const { data: subscriptionData } = useQuery<{
    sessionHistory?: SessionHistoryItem[];
    minutesUsed?: string;
    sessionsUsed?: string;
  }>({
    queryKey: ["/api/profile/subscription"],
    refetchInterval: isRunning ? 10000 : false, // Refetch every 10 seconds when running
  });

  // Sync frontend state with backend session (every 5 seconds)
  useEffect(() => {
    console.log('🔄 Sync effect triggered, currentSessionData:', currentSessionData);
    
    if (currentSessionData?.session) {
      const session = currentSessionData.session;
      console.log('📊 Session data from backend:', {
        sessionId: session.sessionId,
        status: session.status,
        isPaused: session.isPaused,
        currentDurationSeconds: session.currentDurationSeconds,
        hasUserStartedTimer: hasUserStartedTimerRef.current
      });
      
      // Backend has an active session
      const shouldBeRunning = session.status === "active" && !session.isPaused;
      const shouldBePaused = session.isPaused;
      
      // CRITICAL FIX: Only sync session data if user has started timer in THIS session
      if (hasUserStartedTimerRef.current) {
        // Set session ID and time from backend
        setActiveSessionId(session.sessionId);
        setCurrentSessionTime(session.currentDurationSeconds);
        setLastSyncTime(Date.now());
        
        // Update running state only if user started timer
        if (shouldBeRunning !== isRunning) {
          setIsRunning(shouldBeRunning);
          console.log(`⏱️ Timer state synced: ${shouldBeRunning ? 'RUNNING' : 'STOPPED'} at ${session.currentDurationSeconds}s`);
        }
        
        // Update paused state
        if (shouldBePaused !== isPaused) {
          setIsPaused(shouldBePaused);
          console.log(`⏸️ Timer paused at ${session.currentDurationSeconds}s`);
        }
      } else {
        // After refresh, NEVER auto-start and DON'T show old session time
        console.log('🛑 Session exists in backend but NOT syncing (hasUserStartedTimer=false)');
        
        // Keep session ID for potential resume, but don't show time
        if (activeSessionId !== session.sessionId) {
          setActiveSessionId(session.sessionId);
        }
        
        // Force timer to stopped state
        if (isRunning) {
          console.log('🛑 Forcing timer to STOP (was running but user did not start in this session)');
          setIsRunning(false);
        }
        if (!isPaused && shouldBePaused) {
          setIsPaused(true); // Show paused state
        }
        
        // Keep time at 0 until user explicitly starts
        if (currentSessionTime !== 0) {
          setCurrentSessionTime(0);
        }
      }
    } else {
      console.log('❌ No active session from backend');
      
      // No active session - reset to initial state
      if (isRunning) {
        console.log('🛑 Stopping timer (no backend session)');
        setIsRunning(false);
      }
      if (isPaused) {
        setIsPaused(false);
      }
      if (activeSessionId) {
        setActiveSessionId(null);
      }
      // Keep currentSessionTime to show last stopped time
    }
  }, [currentSessionData]);

  // Local timer for smooth UI updates (ticks every second)
  // CRITICAL: Only tick if user has explicitly started timer in THIS session
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // DEFENSIVE: Only run timer if user started it AND isRunning is true
    if (isRunning && hasUserStartedTimerRef.current) {
      console.log('⏱️ Starting local timer interval');
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

  // CRITICAL: Sync current time to backend every 10 seconds while running
  useEffect(() => {
    if (!isRunning || !activeSessionId) {
      return;
    }

    // Sync to backend every 10 seconds
    const syncInterval = setInterval(async () => {
      try {
        console.log(`🔄 Syncing current time to backend: ${currentSessionTime}s`);
        await apiRequest("PUT", `/api/session-usage/${activeSessionId}/sync`, {
          currentDurationSeconds: currentSessionTime
        });
        console.log(`✅ Synced ${currentSessionTime}s to backend`);
      } catch (error) {
        console.error('Failed to sync time to backend:', error);
      }
    }, 10000); // Every 10 seconds

    return () => {
      clearInterval(syncInterval);
    };
  }, [isRunning, activeSessionId, currentSessionTime]);

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
        
        setIsRunning(true);
        setCurrentSessionTime(0); // Start from 0
        setActiveSessionId(data.sessionUsage.sessionId);
        console.log('⏱️ Session timer started, Session ID:', data.sessionUsage.sessionId);
        
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
        // Call backend API to stop session tracking
        const response = await apiRequest("PUT", `/api/session-usage/${activeSessionId}/stop`, {});
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
        setCurrentSessionTime(0); // RESET to 0
        setActiveSessionId(null);
        hasUserStartedTimerRef.current = false; // Reset flag
        
        // Invalidate queries to refresh total usage from DB
        queryClient.invalidateQueries({ queryKey: ["/api/session-usage/current"] });
        queryClient.invalidateQueries({ queryKey: ["/api/profile/subscription"] });
        queryClient.invalidateQueries({ queryKey: ["/api/session-minutes/status"] });
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/check-limits"] });
        console.log('⏱️ Session timer stopped - current session reset to 0, refreshing total usage from DB');
      }
    }
  }, [isRunning, isPaused, activeSessionId]);

  const pauseTimer = useCallback(async () => {
    if (isRunning && activeSessionId) {
      try {
        const response = await apiRequest("PUT", `/api/session-usage/${activeSessionId}/pause`, {});
        const data = await response.json();
        
        if (!response.ok) {
          console.error('Failed to pause session:', data);
        } else {
          console.log('⏱️ Session paused at:', currentSessionTime, 'seconds');
          // Don't set isRunning here - let the backend sync handle it
          // This ensures the timer value is preserved
          queryClient.invalidateQueries({ queryKey: ["/api/session-usage/current"] });
        }
      } catch (error) {
        console.error('Failed to pause session timer:', error);
      }
    }
  }, [isRunning, activeSessionId, currentSessionTime]);

  const resumeTimer = useCallback(async () => {
    // Always try to resume if we have an active session
    if (activeSessionId) {
      try {
        // Mark that user has explicitly started/resumed the timer
        hasUserStartedTimerRef.current = true;
        
        const response = await apiRequest("PUT", `/api/session-usage/${activeSessionId}/resume`, {});
        const data = await response.json();
        
        if (!response.ok) {
          console.error('Failed to resume session:', data);
        } else {
          console.log('⏱️ Session resumed from:', currentSessionTime, 'seconds');
          // Don't set isRunning here - let the backend sync handle it
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
