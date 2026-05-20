"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface UseVoiceRecorderReturn {
  isRecording: boolean;
  duration: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  cancelRecording: () => void;
  isSupported: boolean;
  error: string | null;
}

/**
 * Voice recorder with dual approach:
 * 1. Primary: Web Speech API (real-time transcription)
 * 2. Fallback: MediaRecorder → send audio to Gemini for transcription
 */
export function useVoiceRecorder(): UseVoiceRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptRef = useRef<string>("");
  const useFallbackRef = useRef(false);

  useEffect(() => {
    // Check for either Web Speech API or MediaRecorder support
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    const hasMediaRecorder = typeof MediaRecorder !== "undefined";
    setIsSupported(!!SpeechRecognition || hasMediaRecorder);
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    transcriptRef.current = "";
    audioChunksRef.current = [];
    useFallbackRef.current = false;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    // Try Web Speech API first
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        let interimTranscript = "";

        recognition.onresult = (event: any) => {
          let finalText = "";
          let interim = "";
          for (let i = 0; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
              finalText += result[0].transcript + " ";
            } else {
              interim += result[0].transcript;
            }
          }
          if (finalText) {
            transcriptRef.current = finalText.trim();
          } else if (interim) {
            interimTranscript = interim;
          }
        };

        recognition.onerror = (event: any) => {
          // If speech recognition fails, fall back to MediaRecorder
          if (event.error === "not-allowed" || event.error === "aborted") {
            useFallbackRef.current = true;
            startMediaRecorder();
          }
        };

        recognition.onend = () => {
          // If it ends early without error and we have no transcript, it may have aborted
          if (!transcriptRef.current && !useFallbackRef.current) {
            // Keep recording state if user hasn't stopped
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
        setIsRecording(true);
        setDuration(0);

        timerRef.current = setInterval(() => {
          setDuration((d) => d + 1);
        }, 1000);

        return;
      } catch {
        // Fall through to MediaRecorder
      }
    }

    // Fallback: MediaRecorder
    await startMediaRecorder();
  }, []);

  const startMediaRecorder = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4",
      });

      audioChunksRef.current = [];
      useFallbackRef.current = true;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(1000); // Collect in 1s chunks
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setDuration(0);

      if (!timerRef.current) {
        timerRef.current = setInterval(() => {
          setDuration((d) => d + 1);
        }, 1000);
      }
    } catch (err: any) {
      setError("Microphone access denied. Please allow microphone permission.");
      setIsRecording(false);
    }
  };

  const stopRecording = useCallback(async (): Promise<string | null> => {
    // Stop speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      // Stop all tracks
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsRecording(false);
    setDuration(0);

    // Wait for final results
    await new Promise((resolve) => setTimeout(resolve, 500));

    // If we used MediaRecorder fallback, transcribe via Gemini
    if (useFallbackRef.current && audioChunksRef.current.length > 0) {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const transcript = await transcribeWithGemini(audioBlob);
      return transcript;
    }

    return transcriptRef.current || null;
  }, []);

  const cancelRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    transcriptRef.current = "";
    audioChunksRef.current = [];
    setIsRecording(false);
    setDuration(0);
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return {
    isRecording,
    duration,
    startRecording,
    stopRecording,
    cancelRecording,
    isSupported,
    error,
  };
}

/** Transcribe audio using Gemini via our API */
async function transcribeWithGemini(audioBlob: Blob): Promise<string | null> {
  try {
    const base64 = await blobToBase64(audioBlob);

    const response = await fetch("/api/transcribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        audioBase64: base64,
        mimeType: audioBlob.type || "audio/webm",
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.text || null;
  } catch {
    return null;
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
