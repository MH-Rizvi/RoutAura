/**
 * VoiceInputButton.jsx — Microphone button using Web Speech API.
 *
 * Shows animated recording indicator while listening.
 * Transcribes speech to text and passes it to parent via onTranscript.
 */
import { useState, useRef, useCallback } from 'react';

const SpeechRecognition =
    typeof window !== 'undefined'
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;

export default function VoiceInputButton({ onTranscript, disabled = false }) {
    const [listening, setListening] = useState(false);
    const recognitionRef = useRef(null);

    const toggleListening = useCallback(() => {
        if (!SpeechRecognition) {
            // Browser doesn't support speech recognition
            return;
        }

        if (listening) {
            recognitionRef.current?.stop();
            setListening(false);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.continuous = false;

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            onTranscript(transcript);
            setListening(false);
        };

        recognition.onerror = () => {
            setListening(false);
        };

        recognition.onend = () => {
            setListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
        setListening(true);
    }, [listening, onTranscript]);

    // Don't render if browser doesn't support Speech API
    if (!SpeechRecognition) return null;

    return (
        <button
            onClick={toggleListening}
            disabled={disabled}
            className={`min-w-touch min-h-touch rounded-xl flex items-center justify-center transition-colors ${listening
                    ? 'bg-danger text-white animate-pulse'
                    : 'bg-gray-100 text-secondary hover:bg-gray-200'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
            aria-label={listening ? 'Stop recording' : 'Start voice input'}
            title={listening ? 'Tap to stop' : 'Tap to speak'}
        >
            <span className="text-xl">{listening ? '⏹' : '🎤'}</span>
        </button>
    );
}
