import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, Trash2, FileAudio, FileText, Calendar, Clock, AlertCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface CallRecording {
  id: string;
  sessionId: string;
  fileName: string;
  fileSize: number;
  duration: number;
  recordingData: string;
  createdAt: string;
  expiresAt: string;
}

interface MeetingMinutes {
  id: string;
  sessionId: string;
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  participants: string[];
  minutesText: string;
  createdAt: string;
  expiresAt: string;
}

export default function CallRecordingsPage() {
  const { toast } = useToast();
  const [deleteRecordingId, setDeleteRecordingId] = useState<string | null>(null);
  const [deleteMinutesId, setDeleteMinutesId] = useState<string | null>(null);

  // Fetch call recordings
  const { data: recordingsData, isLoading: recordingsLoading } = useQuery<{ recordings: CallRecording[] }>({
    queryKey: ["/api/call-recordings"],
  });

  // Fetch meeting minutes
  const { data: minutesData, isLoading: minutesLoading } = useQuery<{ minutes: MeetingMinutes[] }>({
    queryKey: ["/api/meeting-minutes"],
  });

  // Delete recording mutation
  const deleteRecordingMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/call-recordings/${id}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/call-recordings"] });
      toast({
        title: "Recording Deleted",
        description: "Call recording has been permanently deleted.",
      });
      setDeleteRecordingId(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete recording",
        variant: "destructive",
      });
    },
  });

  // Delete minutes mutation
  const deleteMinutesMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/meeting-minutes/${id}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meeting-minutes"] });
      toast({
        title: "Minutes Deleted",
        description: "Meeting minutes have been permanently deleted.",
      });
      setDeleteMinutesId(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete meeting minutes",
        variant: "destructive",
      });
    },
  });

  const handleDownloadRecording = (recording: CallRecording) => {
    try {
      // Decode base64 to binary string
      const binaryString = atob(recording.recordingData);
      
      // Convert binary string to Uint8Array
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Create blob from binary data
      const blob = new Blob([bytes], { type: 'audio/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = recording.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download Started",
        description: `Downloading ${recording.fileName}`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download recording",
        variant: "destructive",
      });
    }
  };

  const handleDownloadMinutes = (minutes: MeetingMinutes) => {
    try {
      const blob = new Blob([minutes.minutesText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meeting-minutes-${minutes.id}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download Started",
        description: "Downloading meeting minutes",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download meeting minutes",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDaysUntilExpiry = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const recordings = recordingsData?.recordings || [];
  const minutes = minutesData?.minutes || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 dark:from-slate-950 dark:via-purple-950/20 dark:to-blue-950/20 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
            Call Recordings & Minutes
          </h1>
          <p className="text-muted-foreground mt-2">
            View and manage your saved call recordings and meeting minutes. All items are stored for 7 days.
          </p>
        </div>

        {/* Info Banner */}
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  7-Day Retention Policy
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  All recordings and meeting minutes are automatically deleted after 7 days. Download important files before they expire.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call Recordings Section */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
                <FileAudio className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle>Call Recordings</CardTitle>
                <CardDescription>
                  {recordings.length} recording{recordings.length !== 1 ? 's' : ''} saved
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {recordingsLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading recordings...
              </div>
            ) : recordings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileAudio className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No call recordings found</p>
                <p className="text-sm mt-1">Enable call recording in your Sales Assistant settings to start saving calls</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recordings.map((recording) => {
                  const daysLeft = getDaysUntilExpiry(recording.expiresAt);
                  const isExpiringSoon = daysLeft <= 2;
                  
                  return (
                    <div key={recording.id} className="border rounded-lg p-4 hover:bg-muted/50 transition">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium truncate" data-testid={`text-recording-name-${recording.id}`}>
                              {recording.fileName}
                            </h3>
                            {isExpiringSoon && (
                              <Badge variant="destructive" className="text-xs">
                                Expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDuration(recording.duration)}
                            </span>
                            <span>{formatFileSize(recording.fileSize)}</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDistanceToNow(new Date(recording.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadRecording(recording)}
                            data-testid={`button-download-recording-${recording.id}`}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteRecordingId(recording.id)}
                            data-testid={`button-delete-recording-${recording.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Meeting Minutes Section */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle>Meeting Minutes</CardTitle>
                <CardDescription>
                  {minutes.length} minute{minutes.length !== 1 ? 's' : ''} saved
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {minutesLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading meeting minutes...
              </div>
            ) : minutes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No meeting minutes found</p>
                <p className="text-sm mt-1">AI-generated meeting minutes will appear here after your calls</p>
              </div>
            ) : (
              <div className="space-y-4">
                {minutes.map((minute) => {
                  const daysLeft = getDaysUntilExpiry(minute.expiresAt);
                  const isExpiringSoon = daysLeft <= 2;
                  
                  return (
                    <div key={minute.id} className="border rounded-lg p-4 hover:bg-muted/50 transition">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium" data-testid={`text-minutes-summary-${minute.id}`}>
                              {minute.summary || "Meeting Minutes"}
                            </h3>
                            {isExpiringSoon && (
                              <Badge variant="destructive" className="text-xs">
                                Expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                          <div className="mt-2 space-y-2">
                            {minute.keyPoints && minute.keyPoints.length > 0 && (
                              <div className="text-sm">
                                <span className="font-medium text-muted-foreground">Key Points: </span>
                                <span className="text-muted-foreground">{minute.keyPoints.length} items</span>
                              </div>
                            )}
                            {minute.actionItems && minute.actionItems.length > 0 && (
                              <div className="text-sm">
                                <span className="font-medium text-muted-foreground">Action Items: </span>
                                <span className="text-muted-foreground">{minute.actionItems.length} items</span>
                              </div>
                            )}
                            {minute.participants && minute.participants.length > 0 && (
                              <div className="text-sm">
                                <span className="font-medium text-muted-foreground">Participants: </span>
                                <span className="text-muted-foreground">{minute.participants.join(", ")}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {formatDistanceToNow(new Date(minute.createdAt), { addSuffix: true })}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadMinutes(minute)}
                            data-testid={`button-download-minutes-${minute.id}`}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteMinutesId(minute.id)}
                            data-testid={`button-delete-minutes-${minute.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Recording Confirmation Dialog */}
      <AlertDialog open={!!deleteRecordingId} onOpenChange={(open) => !open && setDeleteRecordingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Call Recording?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the call recording. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-recording">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteRecordingId && deleteRecordingMutation.mutate(deleteRecordingId)}
              className="bg-destructive hover:bg-destructive/90"
              data-testid="button-confirm-delete-recording"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Minutes Confirmation Dialog */}
      <AlertDialog open={!!deleteMinutesId} onOpenChange={(open) => !open && setDeleteMinutesId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Meeting Minutes?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the meeting minutes. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-minutes">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMinutesId && deleteMinutesMutation.mutate(deleteMinutesId)}
              className="bg-destructive hover:bg-destructive/90"
              data-testid="button-confirm-delete-minutes"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
