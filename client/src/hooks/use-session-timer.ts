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

  // Query for total usage from profile subscription endpoint
  // This gives us accurate usage based on transcriptionStartedAt
  const { data: subscriptionData } = useQuery<{
    sessionHistory?: SessionHistoryItem[];
    minutesUsed?: string;
    sessionsUsed?: string;
  }>({
    queryKey: ["/api/profile/subscription"],
    refetchInterval: isRunning ? 60000 : false,
  });

  // Calculate total usage from filtered session history
  const totalUsage: TotalUsageResponse | undefined = subscriptionData?.sessionHistory ? {
    totalSessions: parseInt(subscriptionData.sessionsUsed || '0'),
    totalMinutes: parseInt(subscriptionData.minutesUsed || '0'),
    totalSeconds: parseInt(subscriptionData.minutesUsed || '0') * 60,
    totalHours: Math.floor(parseInt(subscriptionData.minutesUsed || '0') / 60),
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

  const startTimer = useCallback(() => {
    if (!isRunning) {
      const now = new Date();
      setTranscriptionStartTime(now);
      setIsRunning(true);
      setCurrentSessionTime(0);
      console.log('⏱️ Session timer started at:', now.toISOString());
    }
  }, [isRunning]);

  const stopTimer = useCallback(() => {
    if (isRunning) {
      setIsRunning(false);
      setTranscriptionStartTime(null);
      setCurrentSessionTime(0);
      // Invalidate queries to refresh usage data
      queryClient.invalidateQueries({ queryKey: ["/api/profile/subscription"] });
      console.log('⏱️ Session timer stopped');
    }
  }, [isRunning]);

  return {
    isRunning,
    currentSessionTime,
    totalUsage,
    startTimer,
    stopTimer,
  };
}
