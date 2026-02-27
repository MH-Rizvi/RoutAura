/**
 * Chat Store — Zustand store for agent chat messages
 * and conversation history.
 *
 * Manages the chat UI state, sends messages through the
 * LangChain agent endpoint, and tracks pending stops for
 * confirmation.
 */
import { create } from 'zustand';
import { sendAgentMessage, queryRAG } from '../api/client';

// Generate a stable session ID per browser session
const SESSION_ID = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36);

const useChatStore = create((set, get) => ({
    // ── State ──────────────────────────────────
    messages: [],                // UI message objects: { id, role, content, timestamp }
    conversationHistory: [],     // LangChain format: [{ role, content }]
    pendingStops: null,          // Stops returned by agent awaiting driver confirmation
    pendingTripId: null,         // Trip ID if agent found an existing trip
    needsConfirmation: false,    // Whether agent is waiting for "yes / no"
    loading: false,
    error: null,

    // ── Helpers ────────────────────────────────
    _addMessage: (role, content) => {
        const msg = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2),
            role,
            content,
            timestamp: new Date().toISOString(),
        };
        set((state) => ({
            messages: [...state.messages, msg],
            conversationHistory: [
                ...state.conversationHistory,
                { role, content },
            ],
        }));
        return msg;
    },

    clearError: () => set({ error: null }),

    // ── Actions ────────────────────────────────

    /**
     * Send a message to the LangChain agent.
     * Handles the full async flow: add user bubble → call API →
     * add assistant bubble → track pending stops.
     */
    sendMessage: async (text) => {
        if (!text.trim()) return;

        const { _addMessage, conversationHistory } = get();
        _addMessage('user', text);

        set({ loading: true, error: null });

        try {
            const response = await sendAgentMessage(text, conversationHistory, SESSION_ID);

            _addMessage('assistant', response.reply);

            // Track stops for confirmation flow
            set({
                loading: false,
                pendingStops: response.stops || null,
                pendingTripId: response.trip_id || null,
                needsConfirmation: response.needs_confirmation || false,
            });
        } catch (err) {
            set({
                loading: false,
                error: err?.response?.data?.detail || 'Something went wrong. Please try again.',
            });
        }
    },

    /**
     * Ask a RAG question about trip history.
     * Uses the separate /rag/query endpoint.
     */
    askRAGQuestion: async (question) => {
        if (!question.trim()) return null;

        const { _addMessage } = get();
        _addMessage('user', question);

        set({ loading: true, error: null });

        try {
            const response = await queryRAG(question);
            const answerText = response.sources_used
                ? `${response.answer}\n\n📚 Based on ${response.sources_used} source(s).`
                : response.answer;

            _addMessage('assistant', answerText);
            set({ loading: false });
            return response;
        } catch (err) {
            set({
                loading: false,
                error: err?.response?.data?.detail || 'Something went wrong. Please try again.',
            });
            return null;
        }
    },

    /** Clear pending stops (after user confirms or dismisses). */
    clearPendingStops: () =>
        set({ pendingStops: null, pendingTripId: null, needsConfirmation: false }),

    /** Reset entire chat (new conversation). */
    resetChat: () =>
        set({
            messages: [],
            conversationHistory: [],
            pendingStops: null,
            pendingTripId: null,
            needsConfirmation: false,
            loading: false,
            error: null,
        }),
}));

export default useChatStore;
