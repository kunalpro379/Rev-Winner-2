import { useState, useEffect, useCallback } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface SessionUsage {
  id: string;
  sessionId: string;
  startTime: string;
  endTime: string | null;
  durationSeconds: string | null;
  status: string;
  createdAt: string;
}

interface TotalUsageResponse {
  totalSessions: number;
  totalSeconds: number;
  totalMinutes: number;
  totalHours: number;
  sessions: SessionUsage[];
}

export function useSessionTimer() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentSessionTime, setCurrentSessionTime] = useState(0);
  const { toast } = useToast();

  // Query for total usage
  const { data: totalUsage } = useQuery<TotalUsageResponse>({
    queryKey: ["/api/session-usage/total"],
    refetchInterval: isRunning ? 60000 : false,
  });

  // Start session mutation
  const startSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/session-usage/start", {});
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentSessionId(data.sessionUsage.sessionId);
      setIsRunning(true);
      setCurrentSessionTime(0);
    },
    onError: (error: any) => {
      console.error("Failed to start session timer:", error);
    },
  });

  // Stop session mutation
  const stopSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await apiRequest("PUT", `/api/session-usage/${sessionId}/stop`);
      return response.json();
    },
    onSuccess: () => {
      setIsRunning(false);
      setCurrentSessionId(null);
      setCurrentSessionTime(0);
      queryClient.invalidateQueries({ queryKey: ["/api/session-usage/total"] });
      toast({
        title: "Session Ended",
        description: "Your session has been tracked successfully",
      });
    },
    onError: (error: any) => {
      console.error("Failed to stop session timer:", error);
      toast({
        title: "Session Tracking Error",
        description: "Failed to properly end session tracking",
        variant: "destructive",
      });
    },
  });

  // Timer tick effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setCurrentSessionTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const startTimer = useCallback(() => {
    if (!isRunning && !currentSessionId) {
      startSessionMutation.mutate();
    }
  }, [isRunning, currentSessionId, startSessionMutation]);

  const stopTimer = useCallback(() => {
    if (isRunning && currentSessionId) {
      stopSessionMutation.mutate(currentSessionId);
    }
  }, [isRunning, currentSessionId, stopSessionMutation]);

  // Auto-stop session on page unload/close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isRunning && currentSessionId) {
        // Use synchronous API call for page unload
        navigator.sendBeacon(
          `/api/session-usage/${currentSessionId}/stop`,
          JSON.stringify({})
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isRunning, currentSessionId]);

  return {
    isRunning,
    currentSessionTime,
    totalUsage,
    startTimer,
    stopTimer,
    currentSessionId,
  };
}
