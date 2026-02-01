import { Clock, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface SessionUsage {
  totalSessions: number;
  totalSeconds: number;
  totalMinutes: number;
  totalHours: number;
}

interface SessionTimerProps {
  currentSessionTime: number;
  totalUsage?: SessionUsage;
  isRunning: boolean;
}

export function SessionTimer({ currentSessionTime, totalUsage, isRunning }: SessionTimerProps) {
  const formatTime = (seconds: number) => {
    const safeSeconds = Number.isFinite(seconds) ? seconds : 0;
    const hrs = Math.floor(safeSeconds / 3600);
    const mins = Math.floor((safeSeconds % 3600) / 60);
    const secs = safeSeconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDuration = (seconds: number) => {
    const safeSeconds = Number.isFinite(seconds) ? seconds : 0;
    const hrs = Math.floor(safeSeconds / 3600);
    const mins = Math.floor((safeSeconds % 3600) / 60);
    const secs = safeSeconds % 60;
    
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    if (mins > 0) {
      return `${mins}m`;
    }
    return `${secs}s`;
  };

  return (
    <Card className="border-border/50 bg-gradient-to-br from-background to-muted/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Current Session Timer */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Current Session</p>
                <p 
                  className={`text-lg font-mono font-semibold ${isRunning ? "text-primary" : "text-muted-foreground"}`}
                  data-testid="timer-current-session"
                >
                  {formatTime(currentSessionTime)}
                </p>
              </div>
            </div>
          </div>

          {/* Total Usage */}
          {totalUsage && (
            <div className="flex items-center gap-2 border-l border-border/50 pl-4">
              <TrendingUp className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Total Usage</p>
                <p className="text-lg font-semibold text-foreground" data-testid="timer-total-usage">
                  {formatDuration(totalUsage.totalSeconds)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(Number.isFinite(totalUsage.totalSessions) ? totalUsage.totalSessions : 0)} session{(Number.isFinite(totalUsage.totalSessions) ? totalUsage.totalSessions : 0) !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
