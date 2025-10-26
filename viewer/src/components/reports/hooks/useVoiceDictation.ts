import { useState, useEffect, useRef, useCallback } from 'react';

interface UseVoiceDictationOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onTranscript?: (transcript: string) => void;
  onError?: (error: string) => void;
}

interface UseVoiceDictationReturn {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

// Check browser support for Web Speech API
const isSpeechRecognitionSupported = (): boolean => {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
};

// Get SpeechRecognition constructor
const getSpeechRecognition = (): any => {
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
};

/**
 * Custom hook for voice dictation using Web Speech API
 * Provides real-time speech-to-text transcription
 */
export const useVoiceDictation = (options: UseVoiceDictationOptions = {}): UseVoiceDictationReturn => {
  const {
    language = 'en-US',
    continuous = true,
    interimResults = true,
    onTranscript,
    onError
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported] = useState(isSpeechRecognitionSupported());

  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef('');

  // Initialize speech recognition
  useEffect(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser');
      return;
    }

    const SpeechRecognition = getSpeechRecognition();
    const recognition = new SpeechRecognition();

    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    // Handle results
    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcriptText = result[0].transcript;

        if (result.isFinal) {
          final += transcriptText + ' ';
        } else {
          interim += transcriptText;
        }
      }

      if (final) {
        // Process punctuation commands
        final = processPunctuationCommands(final);
        finalTranscriptRef.current += final;
        setTranscript(finalTranscriptRef.current);
        
        if (onTranscript) {
          onTranscript(final.trim());
        }
      }

      setInterimTranscript(interim);
    };

    // Handle errors
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      
      let errorMessage = 'Speech recognition error';
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'Microphone not found or not accessible.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone access denied. Please allow microphone access.';
          break;
        case 'network':
          errorMessage = 'Network error. Please check your connection.';
          break;
        case 'aborted':
          errorMessage = 'Speech recognition aborted.';
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
      }

      setError(errorMessage);
      setIsListening(false);
      
      if (onError) {
        onError(errorMessage);
      }
    };

    // Handle end
    recognition.onend = () => {
      setIsListening(false);
    };

    // Handle start
    recognition.onstart = () => {
      setError(null);
      setIsListening(true);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isSupported, language, continuous, interimResults, onTranscript, onError]);

  // Start listening
  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser');
      return;
    }

    if (!recognitionRef.current) {
      setError('Speech recognition not initialized');
      return;
    }

    try {
      setError(null);
      recognitionRef.current.start();
    } catch (err: any) {
      // Already started
      if (err.message?.includes('already started')) {
        console.warn('Speech recognition already started');
      } else {
        setError('Failed to start speech recognition');
        console.error('Start error:', err);
      }
    }
  }, [isSupported]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error('Stop error:', err);
      }
    }
  }, [isListening]);

  // Reset transcript
  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    finalTranscriptRef.current = '';
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript
  };
};

/**
 * Process punctuation commands in transcript
 * Converts spoken commands to actual punctuation
 */
const processPunctuationCommands = (text: string): string => {
  let processed = text;

  // Punctuation commands
  const commands: Record<string, string> = {
    'period': '.',
    'comma': ',',
    'question mark': '?',
    'exclamation point': '!',
    'exclamation mark': '!',
    'colon': ':',
    'semicolon': ';',
    'new line': '\n',
    'new paragraph': '\n\n',
    'open parenthesis': '(',
    'close parenthesis': ')',
    'open bracket': '[',
    'close bracket': ']',
    'dash': '-',
    'hyphen': '-'
  };

  // Replace commands with punctuation
  Object.entries(commands).forEach(([command, punctuation]) => {
    const regex = new RegExp(`\\s*${command}\\s*`, 'gi');
    processed = processed.replace(regex, punctuation + ' ');
  });

  // Clean up extra spaces
  processed = processed.replace(/\s+/g, ' ').trim();

  // Capitalize first letter after sentence-ending punctuation
  processed = processed.replace(/([.!?]\s+)([a-z])/g, (match, p1, p2) => {
    return p1 + p2.toUpperCase();
  });

  // Capitalize first letter of text
  if (processed.length > 0) {
    processed = processed.charAt(0).toUpperCase() + processed.slice(1);
  }

  return processed;
};

export default useVoiceDictation;
