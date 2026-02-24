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
  const hasUserStartedTimerRef = useRef<boolean>(false); // Track if user explicitly started timer

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
      console.log('📊 Session data:', {
        sessionId: session.sessionId,
        status: session.status,
        isPaused: session.isPaused,
        currentDurationSeconds: session.currentDurationSeconds
      });
      
      setActiveSessionId(session.sessionId);
      
      // CRITICAL: Always sync time from backend, whether running or paused
      setCurrentSessionTime(session.currentDurationSeconds);
      setLastSyncTime(Date.now());
      
      // Update running and paused state based on backend status
      const shouldBeRunning = session.status === "active" && !session.isPaused;
      const shouldBePaused = session.isPaused;
      
      console.log('🎯 State update:', { shouldBeRunning, shouldBePaused, currentTime: session.currentDurationSeconds, hasUserStarted: hasUserStartedTimerRef.current, currentIsRunning: isRunning });
      
      // Update isRunning state
      // Only prevent auto-start on initial page load (when user hasn't started AND timer isn't already running)
      if (shouldBeRunning && !isRunning && !hasUserStartedTimerRef.current) {
        console.log('⚠️ Backend has active session but user hasn\'t started timer - NOT auto-starting');
        // Don't auto-start on page load, but show the time
      } else if (shouldBeRunning !== isRunning) {
        // User has started timer OR timer is already running - sync with backend
        setIsRunning(shouldBeRunning);
        console.log(`⏱️ Timer state changed: ${shouldBeRunning ? 'RUNNING' : 'PAUSED'} at ${session.currentDurationSeconds}s`);
      }
      
      if (shouldBePaused !== isPaused) {
        setIsPaused(shouldBePaused);
        // Cache paused time in localStorage
        if (shouldBePaused) {
          console.log(`💾 Caching paused time: ${session.currentDurationSeconds}s`);
          localStorage.setItem('pausedSessionTime', session.currentDurationSeconds.toString());
          localStorage.setItem('pausedSessionId', session.sessionId);
        }
      }
    } else {
      console.log('❌ No session data from backend');
      // No active session on backend
      // Check if we have a paused session in cache
      const cachedPausedTime = localStorage.getItem('pausedSessionTime');
      const cachedSessionId = localStorage.getItem('pausedSessionId');
      const stoppedTime = localStorage.getItem('stoppedSessionTime');
      const stoppedSessionId = localStorage.getItem('stoppedSessionId');
      
      console.log('🔍 Checking cache:', { cachedPausedTime, cachedSessionId, isPaused, stoppedTime, stoppedSessionId });
      
      if (cachedPausedTime && cachedSessionId && isPaused) {
        // Keep showing paused time from cache
        console.log(`⏸️ Keeping paused time from cache: ${cachedPausedTime}s`);
        setCurrentSessionTime(parseInt(cachedPausedTime));
        setActiveSessionId(cachedSessionId);
      } else if (stoppedTime && stoppedSessionId) {
        // Keep showing stopped time from cache (don't clear it)
        console.log(`⏹️ Keeping stopped time from cache: ${stoppedTime}s`);
        setCurrentSessionTime(parseInt(stoppedTime));
        setActiveSessionId(stoppedSessionId);
        // Ensure timer is not running
        if (isRunning) {
          setIsRunning(false);
        }
        if (isPaused) {
          setIsPaused(false);
        }
      } else if (isRunning || activeSessionId) {
        // Session ended, clear everything
        console.log('🧹 Clearing session state');
        setIsRunning(false);
        setIsPaused(false);
        setActiveSessionId(null);
        setCurrentSessionTime(0);
        localStorage.removeItem('pausedSessionTime');
        localStorage.removeItem('pausedSessionId');
        hasUserStartedTimerRef.current = false; // Reset flag
      }
    }
  }, [currentSessionData, isRunning, isPaused, activeSessionId]); // Added dependencies

  // Local timer for smooth UI updates (ticks every second)
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setCurrentSessionTime(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

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
        
        // Clear any stopped session cache (starting fresh)
        localStorage.removeItem('stoppedSessionTime');
        localStorage.removeItem('stoppedSessionId');
        
        // Call backend API to start session tracking
        const response = await apiRequest("POST", "/api/session-usage/start", {});
        const data = await response.json();
        
        if (!response.ok) {
          console.error('Failed to start session tracking:', data);
          throw new Error(data.message || 'Failed to start session');
        }
        
        setIsRunning(true);
        setCurrentSessionTime(0);
        setActiveSessionId(data.sessionUsage.sessionId);
        console.log('⏱️ Session timer started, Session ID:', data.sessionUsage.sessionId);
        
        // Invalidate current session query to fetch fresh data
        queryClient.invalidateQueries({ queryKey: ["/api/session-usage/current"] });
        
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
        // Cache the final time BEFORE stopping
        const finalTime = currentSessionTime;
        console.log(`⏹️ Stopping timer at: ${finalTime}s`);
        localStorage.setItem('stoppedSessionTime', finalTime.toString());
        localStorage.setItem('stoppedSessionId', activeSessionId);
        
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
        setIsRunning(false);
        setIsPaused(false);
        // DON'T reset currentSessionTime to 0 - keep showing the final time
        // setCurrentSessionTime(0);  ← REMOVED
        setActiveSessionId(null);
        
        // Clear cached paused time
        localStorage.removeItem('pausedSessionTime');
        localStorage.removeItem('pausedSessionId');
        
        // Invalidate queries to refresh usage data
        queryClient.invalidateQueries({ queryKey: ["/api/session-usage/current"] });
        queryClient.invalidateQueries({ queryKey: ["/api/profile/subscription"] });
        queryClient.invalidateQueries({ queryKey: ["/api/session-minutes/status"] });
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/check-limits"] });
        console.log('⏱️ Session timer stopped - refreshing usage data');
      }
    }
  }, [isRunning, isPaused, activeSessionId, currentSessionTime]);

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
    // Always try to resume if we have an active session, regardless of isRunning state
    // because the sync effect might have already set isRunning to true
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
          // Clear cached paused time when resuming
          localStorage.removeItem('pausedSessionTime');
          localStorage.removeItem('pausedSessionId');
          // Don't set isRunning here - let the backend sync handle it
          queryClient.invalidateQueries({ queryKey: ["/api/session-usage/current"] });
        }
      } catch (error) {
        console.error('Failed to resume session timer:', error);
      }
    } else {
      console.warn('⚠️ resumeTimer called but no activeSessionId - this might be a bug');
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
