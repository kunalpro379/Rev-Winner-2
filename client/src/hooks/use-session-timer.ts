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
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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
    if (currentSessionData?.session) {
      const session = currentSessionData.session;
      setActiveSessionId(session.sessionId);
      
      // CRITICAL: Always sync time from backend, whether running or paused
      setCurrentSessionTime(session.currentDurationSeconds);
      setLastSyncTime(Date.now());
      
      // Update running state based on backend status
      // Session is running if status is "active" AND not paused
      const shouldBeRunning = session.status === "active" && !session.isPaused;
      if (shouldBeRunning !== isRunning) {
        setIsRunning(shouldBeRunning);
        console.log(`⏱️ Timer state changed: ${shouldBeRunning ? 'RUNNING' : 'PAUSED'} at ${session.currentDurationSeconds}s`);
      }
    } else if (isRunning || activeSessionId) {
      // No active session on backend but frontend thinks there's a session - sync state
      setIsRunning(false);
      setActiveSessionId(null);
      setCurrentSessionTime(0);
    }
  }, [currentSessionData]);

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
  const totalUsage: TotalUsageResponse | undefined = subscriptionData ? {
    totalSessions: parseInt(subscriptionData.sessionsUsed || '0'),
    totalMinutes: parseInt(subscriptionData.minutesUsed || '0') + (isRunning ? Math.floor(currentSessionTime / 60) : 0),
    totalSeconds: parseInt(subscriptionData.minutesUsed || '0') * 60 + (isRunning ? currentSessionTime : 0),
    totalHours: Math.floor((parseInt(subscriptionData.minutesUsed || '0') + (isRunning ? Math.floor(currentSessionTime / 60) : 0)) / 60),
  } : undefined;

  const startTimer = useCallback(async () => {
    if (!isRunning) {
      try {
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
        throw error; // Re-throw so caller can handle
      }
    }
  }, [isRunning]);

  const stopTimer = useCallback(async () => {
    if (isRunning && activeSessionId) {
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
        setIsRunning(false);
        setCurrentSessionTime(0);
        setActiveSessionId(null);
        
        // Invalidate queries to refresh usage data
        queryClient.invalidateQueries({ queryKey: ["/api/session-usage/current"] });
        queryClient.invalidateQueries({ queryKey: ["/api/profile/subscription"] });
        queryClient.invalidateQueries({ queryKey: ["/api/session-minutes/status"] });
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/check-limits"] });
        console.log('⏱️ Session timer stopped - refreshing usage data');
      }
    }
  }, [isRunning, activeSessionId]);

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
    if (!isRunning && activeSessionId) {
      try {
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
    }
  }, [isRunning, activeSessionId, currentSessionTime]);

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
