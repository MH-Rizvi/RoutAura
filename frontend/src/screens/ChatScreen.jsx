/**
 * ChatScreen.jsx — Agent chat interface.
 *
 * MessageBubble components (user right/blue, agent left/grey),
 * ChatInput at bottom, example prompt chips on empty chat,
 * "Preview Route →" button when agent returns stops.
 */
import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useChatStore from '../store/chatStore';
import MessageBubble from '../components/MessageBubble';
import ChatInput from '../components/ChatInput';

const EXAMPLE_PROMPTS = [
    '🚌 Morning school run',
    '🗺️ My usual Monday route',
    '📋 What did I drive last week?',
    '📍 From depot to Oak Avenue',
];

export default function ChatScreen() {
    const navigate = useNavigate();
    const {
        messages,
        pendingStops,
        needsConfirmation,
        loading,
        error,
        sendMessage,
        clearError,
        clearPendingStops,
        resetChat,
    } = useChatStore();

    const scrollRef = useRef(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const handleSend = (text) => {
        sendMessage(text);
    };

    const handlePreviewRoute = () => {
        if (!pendingStops) return;
        // Navigate to preview with stops data in router state
        navigate('/preview', { state: { stops: pendingStops } });
        clearPendingStops();
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-card">
                <h1 className="text-lg font-semibold text-body">Chat with RouteEasy</h1>
                {messages.length > 0 && (
                    <button
                        onClick={resetChat}
                        className="min-h-touch px-3 text-sm text-primary hover:underline"
                    >
                        New Chat
                    </button>
                )}
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
                {/* Empty state: example prompt chips */}
                {messages.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <span className="text-5xl mb-4">💬</span>
                        <h2 className="text-xl font-semibold text-body mb-2">
                            Tell me where you need to go
                        </h2>
                        <p className="text-secondary mb-6 max-w-xs">
                            Describe your route in plain language and I'll plan it for you
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center max-w-sm">
                            {EXAMPLE_PROMPTS.map((prompt) => (
                                <button
                                    key={prompt}
                                    onClick={() => handleSend(prompt.replace(/^[^\s]+\s/, ''))}
                                    className="min-h-touch px-4 py-2 rounded-full bg-blue-50 text-primary text-sm font-medium hover:bg-blue-100 transition-colors"
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Message bubbles */}
                {messages.map((msg) => (
                    <MessageBubble
                        key={msg.id}
                        role={msg.role}
                        content={msg.content}
                        timestamp={msg.timestamp}
                    />
                ))}

                {/* Loading indicator */}
                {loading && (
                    <div className="flex justify-start mb-3">
                        <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                            <span className="text-base animate-pulse">Thinking…</span>
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3">
                        <p className="text-danger text-sm">⚠️ {error}</p>
                        <button
                            onClick={clearError}
                            className="text-xs text-primary mt-1 underline min-h-touch"
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                {/* Preview Route button when agent returns stops */}
                {pendingStops && pendingStops.length > 0 && (
                    <div className="mb-3">
                        <button
                            onClick={handlePreviewRoute}
                            className="w-full min-h-touch rounded-xl bg-success hover:bg-green-700 text-white font-semibold text-lg flex items-center justify-center gap-2 transition-colors"
                        >
                            🗺️ Preview Route →
                        </button>
                    </div>
                )}

                <div ref={scrollRef} />
            </div>

            {/* Input at bottom */}
            <ChatInput onSend={handleSend} loading={loading} />
        </div>
    );
}
