import { useState, useEffect, useRef, useCallback } from "react";

interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
  confidence: number;
}

interface UseSpeechRecognitionOptions {
  onResult: (result: SpeechRecognitionResult) => void;
  onError?: (error: string) => void;
  continuous?: boolean;
  interimResults?: boolean;
}

export function useSpeechRecognition({
  onResult,
  onError,
  continuous = true,
  interimResults = true
}: UseSpeechRecognitionOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);
  const intentionallyPausedRef = useRef(false);
  const restartCountRef = useRef(0);
  const lastErrorRef = useRef<string | null>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isDestroyedRef = useRef(false);

  // Update refs when callbacks change
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  // Initialize speech recognition only once
  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      
      const recognition = new SpeechRecognition();
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      // Auto-detect language - supports all languages
      // Browser will use system language or auto-detect from speech
      recognition.maxAlternatives = 1;
      
      // Speed up recognition for faster response
      if ('sensitivity' in recognition) {
        recognition.sensitivity = 0.7; // More sensitive to pick up speech faster
      }
      if ('speechTimeout' in recognition) {
        recognition.speechTimeout = 5000; // Shorter timeout for faster response
      }
      
      // Enhanced settings for noise resistance and responsiveness
      // Don't set grammars to allow unrestricted recognition
      if ('localService' in recognition) {
        recognition.localService = false; // Use cloud for better noise handling
      }
      if ('allowCloudFallback' in recognition) {
        recognition.allowCloudFallback = true; // Allow cloud processing for accuracy
      }
      
      recognition.onstart = () => {
        setIsListening(true);
        setIsPaused(false);
        // Reset restart count on successful start for reliable recovery
        restartCountRef.current = 0;
        lastErrorRef.current = null;
      };
      
      recognition.onend = () => {
        setIsListening(false);
        
        // Clear any existing restart timeout
        if (restartTimeoutRef.current) {
          clearTimeout(restartTimeoutRef.current);
          restartTimeoutRef.current = null;
        }
        
        // Auto-restart recognition only if it was not intentionally stopped and continuous mode is enabled
        if (!intentionallyPausedRef.current && continuous) {
          // Check if we should restart based on recent errors
          const shouldRestart = lastErrorRef.current !== 'aborted' && 
                               lastErrorRef.current !== 'not-allowed' &&
                               lastErrorRef.current !== 'audio-capture' &&
                               lastErrorRef.current !== 'service-not-allowed' &&
                               restartCountRef.current < 3; // Reduced restart attempts to prevent endless loops
          
          if (shouldRestart) {
            // Longer delays to prevent aggressive restarting
            const delay = Math.min(1000 * Math.pow(2, restartCountRef.current), 5000);
            
            restartTimeoutRef.current = setTimeout(() => {
              // Triple check before restarting: not paused, not destroyed, and recognition exists
              if (!intentionallyPausedRef.current && !isDestroyedRef.current && recognitionRef.current) {
                try {
                  console.log(`Auto-restarting speech recognition (attempt ${restartCountRef.current + 1})...`);
                  recognitionRef.current.start();
                  restartCountRef.current++;
                } catch (error) {
                  console.error('Failed to auto-restart speech recognition:', error);
                  // Stop trying after startup errors
                  restartCountRef.current = 999;
                  onErrorRef.current?.('Speech recognition encountered an error. Please try starting again or use the text input below.');
                }
              }
              restartTimeoutRef.current = null;
            }, delay);
          } else {
            // Too many restarts or permanent error, stop trying
            console.log('Speech recognition auto-restart disabled after multiple failures');
          }
        }
      };
      
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          
          if (result.isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          onResultRef.current({
            transcript: finalTranscript.trim(),
            isFinal: true,
            confidence: event.results[event.results.length - 1][0].confidence || 0
          });
        } else if (interimTranscript) {
          onResultRef.current({
            transcript: interimTranscript.trim(),
            isFinal: false,
            confidence: 0
          });
        }
      };
      
      recognition.onerror = (event: any) => {
        lastErrorRef.current = event.error;
        let errorMessage = event.error || 'Speech recognition error';
        
        // Clear any pending restart timeout on error
        if (restartTimeoutRef.current) {
          clearTimeout(restartTimeoutRef.current);
          restartTimeoutRef.current = null;
        }
        
        // Provide clearer error messages for common issues
        if (event.error === 'not-allowed' || event.error === 'audio-capture') {
          errorMessage = 'Microphone access denied. Please tap the microphone icon in your browser and allow access, then try again.';
          restartCountRef.current = 999; // Prevent auto-restart
        } else if (event.error === 'aborted') {
          errorMessage = 'Speech recognition was interrupted. Please try starting again or use the text input below.';
          // Don't show error for aborted - this is usually intentional
          return;
        } else if (event.error === 'no-speech') {
          // Don't show error for no-speech, just reset and continue
          lastErrorRef.current = null;
          return;
        } else if (event.error === 'network') {
          errorMessage = 'Network error occurred. Please check your connection or use the text input below.';
        } else if (event.error === 'service-not-allowed') {
          errorMessage = 'Speech recognition not available. Please use the text input below instead.';
          restartCountRef.current = 999; // Prevent auto-restart
        } else if (event.error === 'language-not-supported') {
          errorMessage = 'Language not supported. Please use the text input below.';
          restartCountRef.current = 999; // Prevent auto-restart
        }
        
        onErrorRef.current?.(errorMessage);
        setIsListening(false);
        setIsPaused(false);
      };
      
      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
      onErrorRef.current?.('Speech recognition not supported in this browser');
    }
    
    return () => {
      // Mark as destroyed to prevent any further operations
      isDestroyedRef.current = true;
      intentionallyPausedRef.current = true;
      
      // Clear any pending restart timeout
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
      
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [continuous, interimResults]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening && !isPaused) {
      // Reset flags when manually starting
      intentionallyPausedRef.current = false;
      restartCountRef.current = 0;
      lastErrorRef.current = null;
      
      // Clear any pending restart timeout
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
      
      try {
        console.log('Attempting to start speech recognition...');
        recognitionRef.current.start();
      } catch (error: any) {
        console.error('Error starting speech recognition:', error);
        // Set a high restart count to prevent auto-restart loops on startup failures
        restartCountRef.current = 999;
        onErrorRef.current?.(`Cannot start speech recognition: ${error.message || 'Unknown error'}. Please use the text input below instead.`);
      }
    } else if (isPaused) {
      // Resume from pause
      intentionallyPausedRef.current = false;
      setIsPaused(false);
      
      // Reset restart count when resuming
      restartCountRef.current = 0;
      lastErrorRef.current = null;
      
      try {
        console.log('Attempting to resume speech recognition...');
        recognitionRef.current?.start();
      } catch (error: any) {
        console.error('Error resuming speech recognition:', error);
        onErrorRef.current?.(`Cannot resume speech recognition: ${error.message || 'Unknown error'}. Please try again.`);
      }
    }
  }, [isListening, isPaused]);

  const pauseListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      intentionallyPausedRef.current = true;
      recognitionRef.current.stop();
      setIsPaused(true);
      setIsListening(false);
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && (isListening || isPaused)) {
      // Mark as intentionally stopped to prevent auto-restart
      intentionallyPausedRef.current = true;
      
      // Clear any pending restart timeout
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
      
      // Reset restart count to prevent further auto-restarts
      restartCountRef.current = 999;
      
      // Stop the recognition
      recognitionRef.current.stop();
      setIsPaused(false);
      setIsListening(false);
      
      console.log('Speech recognition manually stopped');
    }
  }, [isListening, isPaused]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      pauseListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, pauseListening]);

  return {
    isListening,
    isPaused,
    isSupported,
    startListening,
    pauseListening,
    stopListening,
    toggleListening
  };
}
