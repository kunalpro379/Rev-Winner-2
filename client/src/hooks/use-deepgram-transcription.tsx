import { useState, useEffect, useRef, useCallback } from "react";

interface SpeakerSegment {
  speaker: number;
  text: string;
}

interface TranscriptionResult {
  transcript: string;
  isFinal: boolean;
  confidence: number;
  speakerSegments?: SpeakerSegment[];
}

interface UseDeepgramTranscriptionOptions {
  onResult: (result: TranscriptionResult) => void;
  onError?: (error: string) => void;
  enabled?: boolean;
}

export function useDeepgramTranscription({
  onResult,
  onError,
  enabled = false
}: UseDeepgramTranscriptionOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const tabStreamRef = useRef<MediaStream | null>(null);
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);
  const keepaliveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isReconnectingRef = useRef(false);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/transcribe-stream`;
      
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('📡 Deepgram WebSocket connected');
        setIsConnected(true);
        isReconnectingRef.current = false;
        
        // Start keepalive ping every 10 seconds to prevent connection timeout
        if (keepaliveIntervalRef.current) {
          clearInterval(keepaliveIntervalRef.current);
        }
        keepaliveIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            // Send empty buffer as keepalive
            ws.send(new ArrayBuffer(0));
          }
        }, 10000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'transcript') {
            const { transcript, is_final, confidence, speaker_segments } = data;
            
            // Debug: Log speaker segments received from server
            if (is_final && speaker_segments && speaker_segments.length > 0) {
              const speakers = speaker_segments.map((s: { speaker: number }) => s.speaker);
              console.log(`🎙️ Received speaker segments: speakers=[${speakers.join(', ')}], text="${transcript?.substring(0, 30)}..."`);
            }
            
            if (transcript && transcript.trim()) {
              onResultRef.current({
                transcript: transcript.trim(),
                isFinal: is_final || false,
                confidence: confidence || 0,
                speakerSegments: speaker_segments
              });
            }
          } else if (data.type === 'error') {
            console.error('Transcription error:', data.error);
            onErrorRef.current?.(data.error || 'Transcription error occurred');
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        onErrorRef.current?.('Connection error. Please check your internet connection.');
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log('📡 Deepgram WebSocket disconnected');
        setIsConnected(false);
        
        // Clear keepalive
        if (keepaliveIntervalRef.current) {
          clearInterval(keepaliveIntervalRef.current);
          keepaliveIntervalRef.current = null;
        }
        
        // Auto-reconnect if still transcribing and not already reconnecting
        if (isTranscribing && !isReconnectingRef.current) {
          isReconnectingRef.current = true;
          console.log('🔄 Connection lost, attempting to reconnect in 2 seconds...');
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isTranscribing) {
              console.log('🔄 Reconnecting WebSocket...');
              connectWebSocket();
            }
          }, 2000);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      onErrorRef.current?.('Failed to connect to transcription service');
    }
  }, [isTranscribing]);

  const disconnectWebSocket = useCallback(() => {
    // Clear keepalive and reconnect timers
    if (keepaliveIntervalRef.current) {
      clearInterval(keepaliveIntervalRef.current);
      keepaliveIntervalRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    isReconnectingRef.current = false;
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const stopTranscription = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }

    if (tabStreamRef.current) {
      tabStreamRef.current.getTracks().forEach(track => track.stop());
      tabStreamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setAudioStream(null);
    disconnectWebSocket();
    setIsTranscribing(false);
    console.log('🛑 Transcription stopped');
  }, [disconnectWebSocket]);

  const startTranscription = useCallback(async (includeMic = true, includeTab = false) => {
    try {
      console.log(`🎤 startTranscription called with: includeMic=${includeMic}, includeTab=${includeTab}`);
      console.log(`🖥️ Device detection: isIOS=${/iPhone|iPad|iPod/i.test(navigator.userAgent)}, isMobile=${/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)}`);
      console.log(`📺 getDisplayMedia available: ${typeof navigator.mediaDevices?.getDisplayMedia === 'function'}`);
      
      if (!enabled) {
        onErrorRef.current?.('Transcription service not enabled');
        return;
      }

      // Check if on iOS/mobile and trying to capture meeting audio
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      console.log(`🔍 Capture check: includeTab=${includeTab}, isIOS=${isIOS}, isMobile=${isMobile}`);
      
      if (includeTab && (isIOS || isMobile)) {
        const errorMsg = isIOS 
          ? 'Meeting audio capture is not supported on iPhone/iPad. iOS Safari blocks screen/tab audio sharing. Please use Rev Winner on a desktop browser (Chrome, Edge, or Firefox) to capture Google Meet or Zoom audio.'
          : 'Meeting audio capture is not available on mobile devices. Please use a desktop browser (Chrome, Edge, or Firefox) to capture meeting audio from Google Meet or Zoom.';
        onErrorRef.current?.(errorMsg);
        return;
      }
      
      // Detect Safari and provide guidance for better speaker detection
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      const isMac = /Macintosh|MacIntel|MacPPC|Mac68K/i.test(navigator.userAgent);
      
      if (includeTab && isSafari && isMac) {
        console.warn('⚠️ Safari detected on Mac - audio mixing may affect speaker detection quality');
        console.log('💡 Recommendation: For best speaker detection, use Chrome or Edge on Mac');
      }

      connectWebSocket();

      // Wait for WebSocket to actually connect
      await new Promise<void>((resolve, reject) => {
        const checkConnection = () => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            resolve();
          } else if (wsRef.current?.readyState === WebSocket.CLOSED) {
            reject(new Error('WebSocket connection failed'));
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
        setTimeout(() => reject(new Error('WebSocket connection timeout')), 5000);
      });

      // Use 48kHz sample rate for better speaker diarization quality
      // Higher sample rate preserves more voice characteristics for speaker identification
      const sampleRate = 48000;
      
      console.log(`🎤 Creating AudioContext with sample rate: ${sampleRate}Hz (iOS: ${isIOS}, Mobile: ${isMobile})`);
      
      // @ts-ignore - Safari may need webkitAudioContext
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass({ sampleRate });
      audioContextRef.current = audioContext;
      
      // Safari requires user gesture to start AudioContext
      if (audioContext.state === 'suspended') {
        console.log('🔊 Resuming suspended AudioContext...');
        await audioContext.resume();
      }

      const sources: MediaStreamAudioSourceNode[] = [];

      if (includeMic) {
        console.log('🎤 Requesting microphone access...');
        const micStream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: sampleRate,
            sampleSize: 16,
            channelCount: 1
          } 
        });
        micStreamRef.current = micStream;
        console.log('Microphone access granted, tracks:', micStream.getAudioTracks().length);
        
        const micSource = audioContext.createMediaStreamSource(micStream);
        sources.push(micSource);
        console.log('Microphone source created');
      }

      if (includeTab) {
        if (!navigator.mediaDevices.getDisplayMedia) {
          console.warn('⚠️ Screen sharing not supported on this device');
          throw new Error('Meeting audio capture is only available on desktop browsers');
        }
        
        console.log('📺 Requesting tab/meeting audio access...');
        const tabStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 48000,  // High-quality 48kHz (was 16kHz)
            sampleSize: 16,     // 16-bit audio
            channelCount: 1     // Mono
          }
        });
        
        const audioTracks = tabStream.getAudioTracks();
        if (audioTracks.length === 0) {
          console.warn('⚠️ No audio track in selected tab/window');
          throw new Error('No audio in selected tab. Please select a tab with audio and check "Share audio".');
        }

        tabStreamRef.current = tabStream;
        const tabSource = audioContext.createMediaStreamSource(tabStream);
        sources.push(tabSource);
        console.log('Tab/meeting audio captured');
      }

      if (sources.length === 0) {
        throw new Error('No audio sources available');
      }

      const destination = audioContext.createMediaStreamDestination();
      let finalAudioNode: AudioNode = destination; // Track the final node to connect processor to
      
      if (sources.length === 1) {
        // Single source - direct connection for best quality
        sources[0].connect(destination);
        finalAudioNode = sources[0]; // Use source as final node
        console.log('🎵 Single audio source connected directly');
      } else {
        // Multiple sources - use proper mixing with gain control for better speaker separation
        console.log('🎵 Mixing multiple audio sources with gain control for speaker diarization');
        const merger = audioContext.createChannelMerger(2); // Stereo for better separation
        
        sources.forEach((source, index) => {
          // Add gain node for level control
          const gainNode = audioContext.createGain();
          gainNode.gain.value = 1.0; // Unity gain
          
          // Connect: source -> gain -> merger (different channels for separation)
          source.connect(gainNode);
          gainNode.connect(merger, 0, index % 2); // Alternate L/R channels
          console.log(`  Source ${index} -> Gain -> Channel ${index % 2}`);
        });
        
        // Convert stereo back to mono for Deepgram (preserves speaker characteristics)
        const splitter = audioContext.createChannelSplitter(2);
        const mergerMono = audioContext.createChannelMerger(1);
        
        merger.connect(splitter);
        splitter.connect(mergerMono, 0, 0); // Left channel
        splitter.connect(mergerMono, 1, 0); // Right channel (mixed)
        mergerMono.connect(destination);
        finalAudioNode = mergerMono; // Use mergerMono as final node
        console.log('🎵 Stereo mixed to mono while preserving speaker characteristics');
      }
      
      setAudioStream(destination.stream);

      // Larger buffer size for better audio quality and speaker diarization
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      finalAudioNode.connect(processor); // Connect from the correct final node
      processor.connect(audioContext.destination);

      processor.onaudioprocess = (e) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          const pcmData = new Int16Array(inputData.length);
          
          for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]));
            pcmData[i] = s < 0 ? s * 32768 : s * 32767;
          }
          
          wsRef.current.send(pcmData.buffer);
        }
      };

      processorRef.current = processor;
      setIsTranscribing(true);
      console.log('🎤 Transcription started with sources:', { mic: includeMic, tab: includeTab });
    } catch (error: any) {
      console.error('❌ Error starting transcription:', error);
      console.error('Error details:', error.message, error.stack);
      
      // Provide iOS-specific guidance for microphone access errors
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      
      // Safari throws errors inconsistently - check multiple properties
      const errorName = error?.name?.toLowerCase() || '';
      const errorCode = error?.code;
      const isPermissionError = errorName.includes('notallowed') || 
                                errorName.includes('permission') ||
                                errorCode === 20; // Safari's NOT_ALLOWED_ERR code
      const isDeviceError = errorName.includes('notreadable') ||
                           errorCode === 15; // Safari's NOT_READABLE_ERR code
      
      if (isIOS && (isPermissionError || isDeviceError)) {
        onErrorRef.current?.('⚠️ iPhone/iPad Limitation: Safari cannot access your microphone while another app (like Google Meet) or browser tab is using it. To use Rev Winner during meetings, please switch to a desktop browser (Chrome, Edge, or Firefox) where you can capture both your microphone and meeting audio simultaneously.');
      } else {
        onErrorRef.current?.(error.message || 'Failed to start transcription');
      }
      
      stopTranscription();
    }
  }, [enabled, connectWebSocket, stopTranscription]);

  useEffect(() => {
    return () => {
      stopTranscription();
    };
  }, [stopTranscription]);

  return {
    isConnected,
    isTranscribing,
    startTranscription,
    stopTranscription,
    audioStream
  };
}
