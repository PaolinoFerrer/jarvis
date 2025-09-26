import { useState, useRef, useCallback, useEffect } from 'react';

// FIX: Define types for the Web Speech API to resolve TypeScript errors,
// as they are not included in default DOM typings.
// These are minimal interfaces to match the usage in this hook.
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}

interface SpeechRecognitionStatic {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionStatic;
    webkitSpeechRecognition: SpeechRecognitionStatic;
  }
}


// FIX: Renamed variable to avoid conflict with the SpeechRecognition interface type.
const SpeechRecognitionAPI =
  window.SpeechRecognition || window.webkitSpeechRecognition;

interface UseVoiceToTextProps {
  onTranscriptReady: (transcript: string) => void;
}

export const useVoiceToText = ({ onTranscriptReady }: UseVoiceToTextProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  // FIX: Use the defined SpeechRecognition interface.
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef<string>('');

  useEffect(() => {
    if (!SpeechRecognitionAPI) {
      console.error("Speech Recognition API non è supportata da questo browser.");
      return;
    }

    // FIX: Use the renamed constructor.
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'it-IT';

    recognition.onstart = () => {
      setIsRecording(true);
      finalTranscriptRef.current = '';
      setInterimTranscript('');
    };

    // FIX: Add type to event parameter.
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      finalTranscriptRef.current += final;
      setInterimTranscript(interim);
    };

    recognition.onend = () => {
      setIsRecording(false);
      onTranscriptReady(finalTranscriptRef.current);
      setInterimTranscript('');
    };

    // FIX: Add type to event parameter.
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error', event.error);
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onTranscriptReady]);

  const startRecording = useCallback(() => {
    if (recognitionRef.current && !isRecording) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Error starting recognition:", e);
      }
    }
  }, [isRecording]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
    }
  }, [isRecording]);

  return { isRecording, startRecording, stopRecording, transcript: finalTranscriptRef.current, interimTranscript };
};
