/**
 * ChatInput.jsx — Polished dark enterprise input with embedded send button.
 */
import { useState } from 'react';
import VoiceInputButton from './VoiceInputButton';

export default function ChatInput({ onSend, loading = false }) {
    const [text, setText] = useState('');
    const [isTranscribing, setIsTranscribing] = useState(false);

    const handleSubmit = () => {
        const trimmed = text.trim();
        if (!trimmed || loading) return;
        onSend(trimmed);
        setText('');
    };

    return (
        <div className="p-3 sm:p-4 border-t border-white/[0.06]" style={{ background: 'rgba(13,17,23,0.92)', backdropFilter: 'blur(20px)' }}>
            <div className="flex items-end gap-2 max-w-3xl mx-auto">
                <VoiceInputButton
                    onTranscript={(t) => setText((p) => p + (p && !p.endsWith(' ') ? ' ' : '') + t)}
                    disabled={loading || isTranscribing}
                    onTranscribing={setIsTranscribing}
                />
                <div className="flex-1 relative flex items-center bg-[#111827] border border-[#1F2937] focus-within:border-[#F59E0B]/60 focus-within:shadow-[0_0_15px_rgba(245,158,11,0.1)] rounded-2xl transition-all duration-200">
                    <input
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                        placeholder={loading ? 'Thinking…' : isTranscribing ? 'Transcribing audio…' : 'Describe your route…'}
                        disabled={loading || isTranscribing}
                        className="w-full bg-transparent py-3 pl-4 pr-12 text-[15px] text-white placeholder:text-white/25 outline-none disabled:opacity-50"
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={loading || isTranscribing || !text.trim()}
                        className="absolute right-1.5 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-20"
                        style={{
                            background: text.trim() && !loading ? '#F59E0B' : 'rgba(245,158,11,0.15)',
                            boxShadow: text.trim() && !loading ? '0 0 12px rgba(245,158,11,0.3)' : 'none',
                        }}
                        aria-label="Send"
                    >
                        {loading ? (
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={text.trim() ? '#0A0F1E' : '#F59E0B'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13" />
                                <polygon points="22 2 15 22 11 13 2 9 22 2" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
