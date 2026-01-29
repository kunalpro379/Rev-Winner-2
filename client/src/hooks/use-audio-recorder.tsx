import { useState, useRef, useCallback } from "react";

export interface RecordingData {
  blob: Blob;
  url: string;
  duration: number;
  fileName: string;
}

interface UseAudioRecorderOptions {
  onRecordingComplete?: (data: RecordingData) => void;
  onError?: (error: string) => void;
}

export function useAudioRecorder({ onRecordingComplete, onError }: UseAudioRecorderOptions = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isSupported, setIsSupported] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasStoppedRef = useRef<boolean>(false);
  const isCancelledRef = useRef<boolean>(false);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now() - duration * 1000;
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setDuration(elapsed);
    }, 1000);
  }, [duration]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      // Check if MediaRecorder is supported
      if (!window.MediaRecorder) {
        setIsSupported(false);
        onError?.("Audio recording is not supported in your browser");
        return;
      }

      // Get audio stream from microphone
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      streamRef.current = stream;
      chunksRef.current = [];

      // Create MediaRecorder instance
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000
      });

      mediaRecorderRef.current = mediaRecorder;

      // Handle data available event
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        // Only process if not already stopped
        if (hasStoppedRef.current) {
          return;
        }
        hasStoppedRef.current = true;
        
        stopTimer();
        
        // Only save recording if not cancelled
        if (!isCancelledRef.current && chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: mimeType });
          const url = URL.createObjectURL(blob);
          const fileName = `recording_${Date.now()}.${mimeType.split('/')[1].split(';')[0]}`;

          const recordingData: RecordingData = {
            blob,
            url,
            duration,
            fileName
          };

          onRecordingComplete?.(recordingData);
        }

        // Cleanup
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        setIsRecording(false);
        setIsPaused(false);
        setDuration(0);
        chunksRef.current = [];
        mediaRecorderRef.current = null;
        hasStoppedRef.current = false;
        isCancelledRef.current = false;
      };

      // Handle errors
      mediaRecorder.onerror = (event: any) => {
        console.error("MediaRecorder error:", event.error);
        onError?.(event.error?.message || "An error occurred during recording");
        stopRecording();
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      hasStoppedRef.current = false;
      isCancelledRef.current = false;
      setIsRecording(true);
      setIsPaused(false);
      startTimer();

      console.log("Audio recording started");
    } catch (error: any) {
      console.error("Error starting audio recording:", error);
      let errorMessage = "Failed to start audio recording";
      
      if (error.name === 'NotAllowedError') {
        errorMessage = "Microphone access denied. Please allow microphone access and try again.";
      } else if (error.name === 'NotFoundError') {
        errorMessage = "No microphone found. Please connect a microphone and try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      onError?.(errorMessage);
    }
  }, [duration, onError, onRecordingComplete, startTimer, stopTimer]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused && 
        mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
        stopTimer();
        pausedTimeRef.current = Date.now();
        console.log("Audio recording paused");
      } catch (error) {
        console.error("Error pausing recording:", error);
      }
    }
  }, [isRecording, isPaused, stopTimer]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isPaused && 
        mediaRecorderRef.current.state === 'paused') {
      try {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
        startTimer();
        console.log("Audio recording resumed");
      } catch (error) {
        console.error("Error resuming recording:", error);
      }
    }
  }, [isPaused, startTimer]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && (isRecording || isPaused) &&
        (mediaRecorderRef.current.state === 'recording' || mediaRecorderRef.current.state === 'paused')) {
      try {
        mediaRecorderRef.current.stop();
        console.log("Audio recording stopped");
      } catch (error) {
        console.error("Error stopping recording:", error);
      }
    }
  }, [isRecording, isPaused]);

  const cancelRecording = useCallback(() => {
    stopTimer();
    
    // Mark as cancelled to prevent upload
    isCancelledRef.current = true;
    chunksRef.current = [];
    
    if (mediaRecorderRef.current && !hasStoppedRef.current &&
        (mediaRecorderRef.current.state === 'recording' || mediaRecorderRef.current.state === 'paused')) {
      try {
        mediaRecorderRef.current.stop();
        // Don't null mediaRecorderRef here - let onstop handle cleanup
      } catch (error) {
        console.error("Error stopping recording during cancel:", error);
        // Force cleanup on error
        hasStoppedRef.current = false;
        isCancelledRef.current = false;
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        mediaRecorderRef.current = null;
      }
    }

    setIsRecording(false);
    setIsPaused(false);
    setDuration(0);
    
    console.log("Audio recording cancelled");
  }, [stopTimer]);

  return {
    isRecording,
    isPaused,
    duration,
    isSupported,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording
  };
}
