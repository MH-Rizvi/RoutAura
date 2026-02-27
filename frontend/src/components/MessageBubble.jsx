/**
 * MessageBubble.jsx — Chat message bubble.
 *
 * User messages: right-aligned, primary blue background, white text.
 * Agent messages: left-aligned, grey background, dark text.
 */
export default function MessageBubble({ role, content, timestamp }) {
    const isUser = role === 'user';

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
            <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${isUser
                        ? 'bg-primary text-white rounded-br-md'
                        : 'bg-gray-100 text-body rounded-bl-md'
                    }`}
            >
                {/* Message text — preserve newlines */}
                <p className="text-base whitespace-pre-wrap break-words leading-relaxed">
                    {content}
                </p>

                {/* Timestamp */}
                {timestamp && (
                    <p
                        className={`text-xs mt-1 ${isUser ? 'text-blue-100' : 'text-secondary'
                            }`}
                    >
                        {new Date(timestamp).toLocaleTimeString(undefined, {
                            hour: 'numeric',
                            minute: '2-digit',
                        })}
                    </p>
                )}
            </div>
        </div>
    );
}
