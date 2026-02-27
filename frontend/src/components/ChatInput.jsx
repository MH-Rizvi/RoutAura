/**
 * ChatInput.jsx — Full-width text input + send button.
 *
 * Disabled while loading. Send on Enter or button tap.
 * Both input and button meet 48px touch target minimum.
 */
import { useState } from 'react';
import VoiceInputButton from './VoiceInputButton';

export default function ChatInput({ onSend, loading = false }) {
    const [text, setText] = useState('');

    const handleSubmit = () => {
        const trimmed = text.trim();
        if (!trimmed || loading) return;
        onSend(trimmed);
        setText('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="flex items-end gap-2 p-3 bg-card border-t border-gray-200">
            {/* Voice input */}
            <VoiceInputButton
                onTranscript={(transcript) => setText((prev) => prev + transcript)}
                disabled={loading}
            />

            {/* Text field */}
            <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={loading ? 'Thinking…' : 'Describe your route…'}
                disabled={loading}
                className="flex-1 min-h-touch rounded-xl border border-gray-300 px-4 py-3 text-base text-body bg-background placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
            />

            {/* Send button */}
            <button
                onClick={handleSubmit}
                disabled={loading || !text.trim()}
                className="min-w-touch min-h-touch rounded-xl bg-primary hover:bg-blue-700 active:bg-blue-800 text-white flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Send message"
            >
                {loading ? (
                    <span className="animate-spin text-xl">⏳</span>
                ) : (
                    <span className="text-xl">➤</span>
                )}
            </button>
        </div>
    );
}
