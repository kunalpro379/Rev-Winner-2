import { useState, useEffect, useRef, useCallback } from "react";

interface VoiceFeatures {
  pitch: number;
  energy: number;
  spectralCentroid: number;
  zeroCrossingRate: number;
}

interface SpeakerFingerprint {
  id: string;
  features: VoiceFeatures[];
  lastSeen: number;
  speechCount: number;
}

interface VoiceFingerprintingOptions {
  onSpeakerChange?: (speakerId: string) => void;
  sensitivity?: number;
  minConfidence?: number;
}

export function useVoiceFingerprinting({
  onSpeakerChange,
  sensitivity = 0.6,
  minConfidence = 0.6
}: VoiceFingerprintingOptions) {
  const [currentSpeaker, setCurrentSpeaker] = useState<string>("speaker1");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [confidence, setConfidence] = useState<number>(0);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const speakersRef = useRef<Map<string, SpeakerFingerprint>>(new Map());
  const speakerCountRef = useRef<number>(0);
  const lastSpeakerRef = useRef<string>("speaker1");
  const lastSwitchTimeRef = useRef<number>(0);
  const consecutiveMatchesRef = useRef<{ speakerId: string; count: number }>({ speakerId: "", count: 0 });

  const startAnalysis = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1,
          sampleRate: 48000
        } 
      });
      mediaStreamRef.current = stream;

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0.3;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      setIsAnalyzing(true);
      console.log("🎙️ Voice analysis active - speaker re-identification enabled");

    } catch (error) {
      console.error("Failed to start voice analysis:", error);
    }
  }, []);

  const stopAnalysis = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setIsAnalyzing(false);
  }, []);

  const extractFeatures = useCallback((): VoiceFeatures | null => {
    if (!analyserRef.current) return null;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const timeData = new Uint8Array(bufferLength);
    
    analyser.getByteFrequencyData(dataArray);
    analyser.getByteTimeDomainData(timeData);

    // Energy
    let energy = 0;
    for (let i = 0; i < bufferLength; i++) {
      energy += dataArray[i];
    }
    energy = energy / bufferLength;

    if (energy < 8) return null;

    // Spectral centroid
    let numerator = 0;
    let denominator = 0;
    for (let i = 0; i < bufferLength; i++) {
      numerator += i * dataArray[i];
      denominator += dataArray[i];
    }
    const spectralCentroid = denominator > 0 ? numerator / denominator : 0;

    // Pitch (voice range: 80-600Hz)
    let maxAmp = 0;
    let maxIndex = 0;
    const voiceStart = Math.floor(bufferLength * 0.02);
    const voiceEnd = Math.floor(bufferLength * 0.15);
    for (let i = voiceStart; i < voiceEnd; i++) {
      if (dataArray[i] > maxAmp) {
        maxAmp = dataArray[i];
        maxIndex = i;
      }
    }
    const sampleRate = audioContextRef.current?.sampleRate || 48000;
    const pitch = (maxIndex * sampleRate) / (bufferLength * 2);

    // Zero crossing rate
    let zeroCrossings = 0;
    for (let i = 1; i < timeData.length; i++) {
      if ((timeData[i] - 128) * (timeData[i - 1] - 128) < 0) {
        zeroCrossings++;
      }
    }
    const zeroCrossingRate = zeroCrossings / timeData.length;

    return { pitch, energy, spectralCentroid, zeroCrossingRate };
  }, []);

  // Compare features and return similarity (0-1)
  const compareFeatures = useCallback((f1: VoiceFeatures, f2: VoiceFeatures): number => {
    // Normalize differences
    const pitchDiff = Math.abs(f1.pitch - f2.pitch) / Math.max(f1.pitch, f2.pitch, 100);
    const spectralDiff = Math.abs(f1.spectralCentroid - f2.spectralCentroid) / Math.max(f1.spectralCentroid, f2.spectralCentroid, 100);
    const zcrDiff = Math.abs(f1.zeroCrossingRate - f2.zeroCrossingRate);
    const energyDiff = Math.abs(f1.energy - f2.energy) / Math.max(f1.energy, f2.energy, 10);

    // Calculate similarity (higher = more similar)
    const pitchSim = Math.max(0, 1 - pitchDiff * 0.8);
    const spectralSim = Math.max(0, 1 - spectralDiff * 0.8);
    const zcrSim = Math.max(0, 1 - zcrDiff * 2.0);
    const energySim = Math.max(0, 1 - energyDiff * 0.5);

    return (pitchSim * 0.40 + spectralSim * 0.35 + zcrSim * 0.15 + energySim * 0.10);
  }, []);

  // Find best matching speaker from all known speakers
  const findBestMatch = useCallback((features: VoiceFeatures): { speakerId: string; similarity: number } => {
    const speakers = speakersRef.current;
    let bestMatch = { speakerId: "", similarity: 0 };

    speakers.forEach((speaker) => {
      if (speaker.features.length === 0) return;

      // Compare against speaker's recent features
      let totalSimilarity = 0;
      speaker.features.forEach(f => {
        totalSimilarity += compareFeatures(features, f);
      });
      const avgSimilarity = totalSimilarity / speaker.features.length;

      if (avgSimilarity > bestMatch.similarity) {
        bestMatch = { speakerId: speaker.id, similarity: avgSimilarity };
      }
    });

    return bestMatch;
  }, [compareFeatures]);

  const analyzeOnSpeech = useCallback(() => {
    const features = extractFeatures();
    if (!features) return;

    const speakers = speakersRef.current;
    const now = Date.now();

    // First speaker initialization
    if (speakers.size === 0) {
      const speakerId = "speaker1";
      speakers.set(speakerId, {
        id: speakerId,
        features: [features],
        lastSeen: now,
        speechCount: 1
      });
      speakerCountRef.current = 1;
      lastSpeakerRef.current = speakerId;
      setCurrentSpeaker(speakerId);
      setConfidence(1.0);
      onSpeakerChange?.(speakerId);
      console.log(`✨ Speaker 1 initialized`);
      return;
    }

    // Find best matching speaker from ALL speakers
    const bestMatch = findBestMatch(features);

    // Prevent rapid switching - require cooldown period (1 second for faster detection)
    const timeSinceLastSwitch = now - lastSwitchTimeRef.current;
    const canSwitch = timeSinceLastSwitch > 1000;

    // Decision logic: 
    // - If good match (>60%) with ANY speaker → use that speaker
    // - If no good match and can switch → create new speaker
    // - Require 2 consecutive matches before switching
    
    if (bestMatch.similarity > sensitivity) {
      // Good match found
      if (bestMatch.speakerId === lastSpeakerRef.current) {
        // Same speaker, update profile
        const speaker = speakers.get(bestMatch.speakerId)!;
        speaker.features.push(features);
        if (speaker.features.length > 12) speaker.features.shift();
        speaker.lastSeen = now;
        speaker.speechCount++;
        setConfidence(bestMatch.similarity);
      } else {
        // Different speaker matched
        if (consecutiveMatchesRef.current.speakerId === bestMatch.speakerId) {
          consecutiveMatchesRef.current.count++;
        } else {
          consecutiveMatchesRef.current = { speakerId: bestMatch.speakerId, count: 1 };
        }

        // Switch only if we have 2+ consecutive matches and cooldown passed
        if (consecutiveMatchesRef.current.count >= 2 && canSwitch) {
          console.log(`🔄 Switching: ${lastSpeakerRef.current} → ${bestMatch.speakerId} (${(bestMatch.similarity * 100).toFixed(1)}% match)`);
          
          lastSpeakerRef.current = bestMatch.speakerId;
          lastSwitchTimeRef.current = now;
          setCurrentSpeaker(bestMatch.speakerId);
          setConfidence(bestMatch.similarity);
          onSpeakerChange?.(bestMatch.speakerId);
          consecutiveMatchesRef.current = { speakerId: "", count: 0 };

          // Update matched speaker
          const speaker = speakers.get(bestMatch.speakerId)!;
          speaker.features.push(features);
          if (speaker.features.length > 12) speaker.features.shift();
          speaker.lastSeen = now;
          speaker.speechCount++;
        }
      }
    } else {
      // No good match - might be new speaker
      // Create new speaker more readily for meeting scenarios
      if (canSwitch && (speakers.size < 2 || timeSinceLastSwitch > 3000)) {
        const nextSpeakerId = `speaker${speakerCountRef.current + 1}`;
        speakerCountRef.current++;
        
        speakers.set(nextSpeakerId, {
          id: nextSpeakerId,
          features: [features],
          lastSeen: now,
          speechCount: 1
        });

        console.log(`👤 New speaker detected: ${nextSpeakerId} (best match was ${(bestMatch.similarity * 100).toFixed(1)}%)`);
        
        lastSpeakerRef.current = nextSpeakerId;
        lastSwitchTimeRef.current = now;
        setCurrentSpeaker(nextSpeakerId);
        setConfidence(1.0);
        onSpeakerChange?.(nextSpeakerId);
        consecutiveMatchesRef.current = { speakerId: "", count: 0 };
      }
    }
  }, [extractFeatures, findBestMatch, sensitivity, onSpeakerChange]);

  const reset = useCallback(() => {
    speakersRef.current.clear();
    speakerCountRef.current = 0;
    lastSpeakerRef.current = "speaker1";
    lastSwitchTimeRef.current = 0;
    consecutiveMatchesRef.current = { speakerId: "", count: 0 };
    setCurrentSpeaker("speaker1");
    setConfidence(0);
    console.log("🔄 Speaker detection reset");
  }, []);

  useEffect(() => {
    return () => {
      stopAnalysis();
    };
  }, [stopAnalysis]);

  return {
    currentSpeaker,
    confidence,
    isAnalyzing,
    startAnalysis,
    stopAnalysis,
    analyzeOnSpeech,
    reset
  };
}
