import { useState, useEffect, useCallback } from "react";
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

export function useSessionTimer() {
  const [isRunning, setIsRunning] = useState(false);
  const [transcriptionStartTime, setTranscriptionStartTime] = useState<Date | null>(null);
  const [currentSessionTime, setCurrentSessionTime] = useState(0);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Query for total usage from profile subscription endpoint
  // This gives us accurate usage based on transcriptionStartedAt
  const { data: subscriptionData } = useQuery<{
    sessionHistory?: SessionHistoryItem[];
    minutesUsed?: string;
    sessionsUsed?: string;
  }>({
    queryKey: ["/api/profile/subscription"],
    refetchInterval: isRunning ? 5000 : false, // Refetch every 5 seconds when running for real-time updates
  });

  // Calculate total usage from filtered session history
  // Add current session time for real-time display
  const totalUsage: TotalUsageResponse | undefined = subscriptionData ? {
    totalSessions: parseInt(subscriptionData.sessionsUsed || '0'),
    totalMinutes: parseInt(subscriptionData.minutesUsed || '0') + (isRunning ? Math.floor(currentSessionTime / 60) : 0),
    totalSeconds: parseInt(subscriptionData.minutesUsed || '0') * 60 + (isRunning ? currentSessionTime : 0),
    totalHours: Math.floor((parseInt(subscriptionData.minutesUsed || '0') + (isRunning ? Math.floor(currentSessionTime / 60) : 0)) / 60),
  } : undefined;

  // Timer tick effect - counts from transcription start
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && transcriptionStartTime) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsedSeconds = Math.floor((now.getTime() - transcriptionStartTime.getTime()) / 1000);
        setCurrentSessionTime(elapsedSeconds);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, transcriptionStartTime]);

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
        
        const now = new Date();
        setTranscriptionStartTime(now);
        setIsRunning(true);
        setCurrentSessionTime(0);
        setActiveSessionId(data.sessionUsage.sessionId);
        console.log('⏱️ Session timer started at:', now.toISOString(), 'Session ID:', data.sessionUsage.sessionId);
        
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
        setTranscriptionStartTime(null);
        setCurrentSessionTime(0);
        setActiveSessionId(null);
        
        // Invalidate queries to refresh usage data
        queryClient.invalidateQueries({ queryKey: ["/api/profile/subscription"] });
        queryClient.invalidateQueries({ queryKey: ["/api/session-minutes/status"] });
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/check-limits"] });
        console.log('⏱️ Session timer stopped - refreshing usage data');
      }
    }
  }, [isRunning, activeSessionId]);

  return {
    isRunning,
    currentSessionTime,
    totalUsage,
    startTimer,
    stopTimer,
  };
}
