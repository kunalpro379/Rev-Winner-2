import { createClient, DeepgramClient } from "@deepgram/sdk";
import { readFile } from "fs/promises";

export interface TranscriptionResult {
  content: string;
  duration: number;
  confidence: number;
  words: Array<{
    word: string;
    start: number;
    end: number;
    confidence: number;
  }>;
  metadata: {
    model: string;
    channels: number;
    sampleRate?: number;
  };
}

const SUPPORTED_AUDIO_TYPES = ['mp3', 'wav', 'm4a', 'ogg', 'webm', 'flac', 'aac', 'wma'];

export function isAudioFile(fileType: string): boolean {
  return SUPPORTED_AUDIO_TYPES.includes(fileType.toLowerCase());
}

export function getAudioMimeType(fileType: string): string {
  const mimeTypes: Record<string, string> = {
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    m4a: 'audio/mp4',
    ogg: 'audio/ogg',
    webm: 'audio/webm',
    flac: 'audio/flac',
    aac: 'audio/aac',
    wma: 'audio/x-ms-wma',
  };
  return mimeTypes[fileType.toLowerCase()] || 'audio/mpeg';
}

export async function transcribeAudioFile(filePath: string, fileType: string): Promise<TranscriptionResult> {
  const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
  
  if (!deepgramApiKey) {
    throw new Error("DEEPGRAM_API_KEY environment variable is not set");
  }

  const deepgram = createClient(deepgramApiKey);
  
  const audioBuffer = await readFile(filePath);
  const mimeType = getAudioMimeType(fileType);

  console.log(`🎵 Transcribing audio file: ${filePath} (${fileType}, ${mimeType})`);

  const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
    audioBuffer,
    {
      model: "nova-2",
      smart_format: true,
      punctuate: true,
      paragraphs: true,
      diarize: true,
      utterances: true,
      language: "en",
      mimetype: mimeType,
    }
  );

  if (error) {
    console.error("Deepgram transcription error:", error);
    throw new Error(`Transcription failed: ${error.message || 'Unknown error'}`);
  }

  if (!result || !result.results) {
    throw new Error("Transcription returned empty result");
  }

  const channel = result.results.channels[0];
  const alternatives = channel?.alternatives || [];
  const transcript = alternatives[0]?.transcript || "";
  const words = alternatives[0]?.words || [];
  const confidence = alternatives[0]?.confidence || 0;

  const duration = result.metadata?.duration || 0;
  const model = result.metadata?.model_info?.[Object.keys(result.metadata?.model_info || {})[0]]?.name || "nova-2";

  console.log(`✅ Transcription complete: ${transcript.length} chars, ${duration}s duration, ${(confidence * 100).toFixed(1)}% confidence`);

  return {
    content: transcript,
    duration: Math.round(duration),
    confidence,
    words: words.map((w: any) => ({
      word: w.word,
      start: w.start,
      end: w.end,
      confidence: w.confidence,
    })),
    metadata: {
      model,
      channels: result.results.channels.length,
      sampleRate: (result.metadata as any)?.sample_rate,
    },
  };
}

export async function transcribeAudioFromBuffer(
  buffer: Buffer,
  fileType: string
): Promise<TranscriptionResult> {
  const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
  
  if (!deepgramApiKey) {
    throw new Error("DEEPGRAM_API_KEY environment variable is not set");
  }

  const deepgram = createClient(deepgramApiKey);
  const mimeType = getAudioMimeType(fileType);

  console.log(`🎵 Transcribing audio buffer (${fileType}, ${mimeType}, ${buffer.length} bytes)`);

  const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
    buffer,
    {
      model: "nova-2",
      smart_format: true,
      punctuate: true,
      paragraphs: true,
      diarize: true,
      utterances: true,
      language: "en",
      mimetype: mimeType,
    }
  );

  if (error) {
    console.error("Deepgram transcription error:", error);
    throw new Error(`Transcription failed: ${error.message || 'Unknown error'}`);
  }

  if (!result || !result.results) {
    throw new Error("Transcription returned empty result");
  }

  const channel = result.results.channels[0];
  const alternatives = channel?.alternatives || [];
  const transcript = alternatives[0]?.transcript || "";
  const words = alternatives[0]?.words || [];
  const confidence = alternatives[0]?.confidence || 0;

  const duration = result.metadata?.duration || 0;
  const model = result.metadata?.model_info?.[Object.keys(result.metadata?.model_info || {})[0]]?.name || "nova-2";

  console.log(`✅ Transcription complete: ${transcript.length} chars, ${duration}s duration, ${(confidence * 100).toFixed(1)}% confidence`);

  return {
    content: transcript,
    duration: Math.round(duration),
    confidence,
    words: words.map((w: any) => ({
      word: w.word,
      start: w.start,
      end: w.end,
      confidence: w.confidence,
    })),
    metadata: {
      model,
      channels: result.results.channels.length,
      sampleRate: (result.metadata as any)?.sample_rate,
    },
  };
}

export function extractDomainFromEmail(email: string): string | null {
  if (!email || typeof email !== 'string') return null;
  
  const parts = email.split('@');
  if (parts.length !== 2) return null;
  
  const domain = parts[1].toLowerCase();
  
  const personalDomains = [
    'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 
    'live.com', 'icloud.com', 'aol.com', 'protonmail.com',
    'mail.com', 'zoho.com', 'yandex.com', 'gmx.com'
  ];
  
  if (personalDomains.includes(domain)) {
    return null;
  }
  
  return domain;
}

export function isSuperAdmin(email: string): boolean {
  return email === 'urhead1508@gmail.com';
}
