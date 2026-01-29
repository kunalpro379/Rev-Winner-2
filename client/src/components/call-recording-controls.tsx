import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAudioRecorder, RecordingData } from "@/hooks/use-audio-recorder";
import { Mic, Square, Pause, Play, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface CallRecordingControlsProps {
  sessionId?: string;
  conversationId?: string;
  isEnabled: boolean;
  isTranscribing: boolean;
}

export function CallRecordingControls({ 
  sessionId, 
  conversationId,
  isEnabled,
  isTranscribing
}: CallRecordingControlsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadedRecordingId, setUploadedRecordingId] = useState<string | null>(null);

  const uploadRecordingMutation = useMutation({
    mutationFn: async (data: RecordingData) => {
      // Size validation
      const maxSize = 50 * 1024 * 1024; // 50MB limit
      const warnSize = 10 * 1024 * 1024; // 10MB warning
      
      if (data.blob.size > maxSize) {
        throw new Error(`Recording too large (${(data.blob.size / (1024 * 1024)).toFixed(1)}MB). Maximum size is 50MB. Consider using shorter recordings.`);
      }
      
      if (data.blob.size > warnSize) {
        console.warn(`Large recording detected: ${(data.blob.size / (1024 * 1024)).toFixed(1)}MB. This may take time to upload.`);
      }
      
      // Convert blob to base64
      const reader = new FileReader();
      return new Promise<any>((resolve, reject) => {
        reader.onloadend = async () => {
          const base64data = reader.result as string;
          
          try {
            const response = await apiRequest("POST", "/api/call-recordings", {
              fileName: data.fileName,
              fileSize: data.blob.size,
              duration: data.duration,
              recordingUrl: base64data,
              conversationId: conversationId || null,
            });
            
            const result = await response.json();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        };
        
        reader.onerror = () => reject(new Error("Failed to read recording file"));
        reader.readAsDataURL(data.blob);
      });
    },
    onSuccess: (data) => {
      setUploadedRecordingId(data.recording?.id || null);
      queryClient.invalidateQueries({ queryKey: ["/api/call-recordings"] });
      toast({
        title: "Recording Saved",
        description: "Your call recording has been saved successfully (7-day retention)",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload recording",
        variant: "destructive"
      });
    }
  });

  const {
    isRecording,
    isPaused,
    duration,
    isSupported,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording
  } = useAudioRecorder({
    onRecordingComplete: (data) => {
      console.log("Recording completed:", {
        fileName: data.fileName,
        size: data.blob.size,
        duration: data.duration
      });
      
      // Upload to backend
      uploadRecordingMutation.mutate(data);
    },
    onError: (error) => {
      toast({
        title: "Recording Error",
        description: error,
        variant: "destructive"
      });
    }
  });

  // Format duration as MM:SS
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Cancel recording if session ends while recording
  useEffect(() => {
    if (!isTranscribing && (isRecording || isPaused)) {
      cancelRecording();
    }
  }, [isTranscribing, isRecording, isPaused, cancelRecording]);

  if (!isEnabled) {
    return (
      <Card className="shadow-md border-border/40 bg-gradient-to-br from-red-50/30 to-pink-50/20 dark:from-red-950/20 dark:to-pink-950/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg">
              <Video className="h-4 w-4 text-white" />
            </div>
            <span className="bg-gradient-to-r from-red-600 to-pink-600 dark:from-red-400 dark:to-pink-400 bg-clip-text text-transparent">
              Call Recording
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Recording disabled. Enable in profile settings to save calls.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!isSupported) {
    return (
      <Card className="shadow-md border-border/40 bg-gradient-to-br from-red-50/30 to-pink-50/20 dark:from-red-950/20 dark:to-pink-950/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg">
              <Video className="h-4 w-4 text-white" />
            </div>
            <span className="bg-gradient-to-r from-red-600 to-pink-600 dark:from-red-400 dark:to-pink-400 bg-clip-text text-transparent">
              Call Recording
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Audio recording not supported in your browser
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md border-border/40 bg-gradient-to-br from-red-50/30 to-pink-50/20 dark:from-red-950/20 dark:to-pink-950/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg">
            <Video className="h-4 w-4 text-white" />
          </div>
          <span className="bg-gradient-to-r from-red-600 to-pink-600 dark:from-red-400 dark:to-pink-400 bg-clip-text text-transparent">
            Call Recording
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Recording Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isRecording && !isPaused && (
                <span className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">Recording</span>
                </span>
              )}
              {isPaused && (
                <span className="flex items-center gap-2">
                  <Pause className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Paused</span>
                </span>
              )}
              {!isRecording && !isPaused && (
                <span className="text-sm font-medium text-muted-foreground">Ready</span>
              )}
            </div>
            
            {/* Duration */}
            {(isRecording || isPaused) && (
              <span className="text-sm font-mono font-semibold text-foreground">
                {formatDuration(duration)}
              </span>
            )}
          </div>

          {/* Recording Controls */}
          <div className="flex gap-2">
            {!isRecording && !isPaused && (
              <Button
                onClick={startRecording}
                disabled={!isTranscribing || uploadRecordingMutation.isPending}
                className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white"
                data-testid="button-start-recording"
              >
                <Mic className="h-4 w-4 mr-2" />
                Start Recording
              </Button>
            )}

            {isRecording && !isPaused && (
              <>
                <Button
                  onClick={pauseRecording}
                  variant="outline"
                  className="flex-1 border-yellow-500 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                  data-testid="button-pause-recording"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
                <Button
                  onClick={stopRecording}
                  variant="outline"
                  className="flex-1 border-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-700 dark:text-red-300"
                  data-testid="button-stop-recording"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              </>
            )}

            {isPaused && (
              <>
                <Button
                  onClick={resumeRecording}
                  variant="outline"
                  className="flex-1 border-green-500 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-700 dark:text-green-300"
                  data-testid="button-resume-recording"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </Button>
                <Button
                  onClick={stopRecording}
                  variant="outline"
                  className="flex-1 border-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-700 dark:text-red-300"
                  data-testid="button-stop-recording"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              </>
            )}
          </div>

          {/* Upload Status */}
          {uploadRecordingMutation.isPending && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 dark:border-red-400 mx-auto mb-1"></div>
              <p className="text-xs text-muted-foreground">Saving recording...</p>
            </div>
          )}

          {/* Help Text */}
          {!isRecording && !isPaused && !uploadRecordingMutation.isPending && (
            <p className="text-xs text-muted-foreground text-center">
              7-day retention • {isTranscribing ? 'Start recording your call' : 'Start a session first'}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
