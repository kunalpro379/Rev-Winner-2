import { Router } from "express";
import { WebSocketServer, WebSocket } from "ws";
import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import type { Server } from "http";

export function setupTranscriptionRoutes(server: Server): Router {
  const router = Router();

  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    if (request.url === '/api/transcribe-stream') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', async (clientWs: WebSocket) => {
    console.log('🎤 Client connected to transcription stream');

    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) {
      clientWs.send(JSON.stringify({ 
        type: 'error', 
        error: 'Transcription service not configured. Please contact administrator.' 
      }));
      clientWs.close();
      return;
    }

    try {
      const deepgram = createClient(apiKey);
      
      // ENHANCED TRANSCRIPTION QUALITY SETTINGS FOR MEETING AUDIO
      // Using nova-2-meeting model optimized for multi-speaker meetings
      // Note: Diarization has a 20-30s "cold start" - needs audio to build speaker profiles
      const dgConnection = deepgram.listen.live({
        model: 'nova-2-meeting',        // MEETING-OPTIMIZED: Better multi-speaker detection
        language: 'en-US',              // US English for better accuracy
        smart_format: true,             // Automatic formatting of dates, times, numbers
        punctuate: true,                // Automatic punctuation
        diarize: true,                  // Multi-speaker identification (requires 20-30s warmup)
        utterances: true,               // IMPROVED: Semantic segments with speaker labels
        interim_results: true,          // Real-time partial results for low latency
        endpointing: 300,               // 300ms pause detection for speaker turns
        vad_events: true,               // Voice Activity Detection events for better flow
        encoding: 'linear16',           // PCM16 encoding
        sample_rate: 16000,             // Use 16kHz for broader compatibility (Safari/iOS)
        channels: 1,                    // Mono audio (meeting audio is pre-mixed)
        filler_words: false,            // Skip filler words for cleaner output
        utterance_end_ms: 1000,         // 1s for faster turnaround
        numerals: true,                 // Convert numbers to numerals
        profanity_filter: false,        // Keep original speech
        redact: false,                  // No redaction
        detect_entities: false          // Disable entity detection for faster processing
      });
      
      console.log('🎙️ Deepgram configured with nova-2-meeting model for multi-speaker diarization');

      dgConnection.on(LiveTranscriptionEvents.Open, () => {
        console.log('Deepgram connection opened with nova-2-meeting model and diarization');
        console.log('ℹ️ Note: Diarization needs 20-30 seconds of audio to build speaker profiles');
        
        dgConnection.on(LiveTranscriptionEvents.Transcript, (data) => {
          const transcript = data.channel?.alternatives?.[0]?.transcript;
          const words = data.channel?.alternatives?.[0]?.words || [];
          const isFinal = data.is_final;
          const confidence = data.channel?.alternatives?.[0]?.confidence || 0;
          
          // Extract detected entities (emails, names, phones, dates, locations, etc.)
          const entities = (data as any).channel?.alternatives?.[0]?.entities || [];

          // Debug: Log diarization data (only on final transcripts with content)
          if (isFinal && words.length > 0) {
            const speakersFound = new Set(words.map((w: any) => w.speaker).filter((s: any) => s !== undefined));
            console.log(`🎙️ Final transcript: "${transcript?.substring(0, 50)}..." - Speakers: [${Array.from(speakersFound).join(', ')}]`);
          }

          // Group words by speaker to create speaker-labeled segments
          const speakerSegments: { speaker: number; text: string }[] = [];
          let currentSpeaker: number | null = null;
          let currentText = '';

          // Track if any word has valid speaker info (not just undefined or all 0s)
          const speakerValues = words.map((w: any) => w.speaker).filter((s: any) => s !== undefined);
          const hasSpeakerInfo = speakerValues.length > 0;
          const hasMultipleSpeakers = new Set(speakerValues).size > 1;
          
          // Log when multiple speakers detected
          if (isFinal && hasMultipleSpeakers) {
            console.log(`👥 Multiple speakers detected in this segment!`);
          }

          words.forEach((word: any) => {
            // Use speaker from word, defaulting to 0 only if no diarization available
            const speaker = word.speaker !== undefined ? word.speaker : 0;
            const wordText = word.punctuated_word || word.word || '';

            if (currentSpeaker === null || currentSpeaker === speaker) {
              // Same speaker or first word
              currentSpeaker = speaker;
              currentText += (currentText ? ' ' : '') + wordText;
            } else {
              // Speaker changed, save current segment and start new one
              if (currentText.trim()) {
                speakerSegments.push({ speaker: currentSpeaker, text: currentText.trim() });
              }
              currentSpeaker = speaker;
              currentText = wordText;
            }
          });

          // Add the last segment
          if (currentText.trim() && currentSpeaker !== null) {
            speakerSegments.push({ speaker: currentSpeaker, text: currentText.trim() });
          }

          if (transcript && clientWs.readyState === WebSocket.OPEN) {
            // Send speaker_segments if we have diarization data
            // Even if all speaker=0 during cold start, send segments so client can display properly
            const sendSegments = hasSpeakerInfo && speakerSegments.length > 0 ? speakerSegments : undefined;
            
            clientWs.send(JSON.stringify({
              type: 'transcript',
              transcript,
              is_final: isFinal,
              confidence,
              speaker_segments: sendSegments,
              entities: entities.length > 0 ? entities : undefined
            }));
          }
        });
        
        // Handle utterance end events for better speaker segmentation
        dgConnection.on(LiveTranscriptionEvents.UtteranceEnd, (data) => {
          console.log('🎤 Utterance ended - speaker turn complete');
        });

        dgConnection.on(LiveTranscriptionEvents.Error, (error) => {
          console.error('❌ Deepgram error:', error);
          console.error('❌ Deepgram error details:', JSON.stringify(error, null, 2));
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ 
              type: 'error', 
              error: 'Transcription service error. Please try again.' 
            }));
          }
        });

        dgConnection.on(LiveTranscriptionEvents.Close, () => {
          console.log('🔌 Deepgram connection closed');
        });

        clientWs.on('message', (data: Buffer | ArrayBuffer | Buffer[]) => {
          if (dgConnection.getReadyState() === 1) {
            // Convert Buffer to ArrayBuffer for Deepgram
            if (Buffer.isBuffer(data)) {
              dgConnection.send(new Uint8Array(data).buffer);
            } else if (data instanceof ArrayBuffer) {
              dgConnection.send(data);
            } else if (Array.isArray(data)) {
              const combined = Buffer.concat(data);
              dgConnection.send(new Uint8Array(combined).buffer);
            }
          }
        });

        clientWs.on('close', () => {
          console.log('👋 Client disconnected from transcription stream');
          dgConnection.finish();
        });

        clientWs.on('error', (error) => {
          console.error('Client WebSocket error:', error);
          dgConnection.finish();
        });
      });

    } catch (error: any) {
      console.error('Failed to setup Deepgram connection:', error);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ 
          type: 'error', 
          error: 'Failed to initialize transcription service' 
        }));
      }
      clientWs.close();
    }
  });

  return router;
}
