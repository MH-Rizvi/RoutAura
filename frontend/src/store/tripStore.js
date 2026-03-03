/**
 * Trip Store — Zustand store for trips state.
 *
 * Manages: trips list, current trip, loading flags, error messages,
 * semantic search results, and trip history.
 */
import { create } from 'zustand';
import {
    getTrips,
    getTripById,
    createTrip,
    updateTrip,
    deleteTrip,
    launchTrip,
    searchTrips,
    getHistory,
    deleteHistoryItem,
    clearAllHistory,
} from '../api/client';

const useTripStore = create((set, get) => ({
    // ── State ──────────────────────────────────
    trips: [],
    currentTrip: null,
    history: [],
    searchResults: [],
    isSearchActive: false,
    loading: false,
    error: null,

    // ── Helpers ────────────────────────────────
    _startLoading: () => set({ loading: true, error: null }),
    _setError: (err) =>
        set({
            loading: false,
            error: err?.response?.data?.detail || 'Something went wrong. Please try again.',
        }),
    clearError: () => set({ error: null }),

    // ── Actions ────────────────────────────────

    /** Fetch all saved trips. */
    fetchTrips: async () => {
        get()._startLoading();
        try {
            const data = await getTrips();
            set({ trips: data, loading: false });
        } catch (err) {
            get()._setError(err);
        }
    },

    /** Fetch a single trip by ID (sets currentTrip). */
    fetchTrip: async (tripId) => {
        get()._startLoading();
        try {
            const data = await getTripById(tripId);
            set({ currentTrip: data, loading: false });
        } catch (err) {
            get()._setError(err);
        }
    },

    /** Save a new trip and refresh the list. */
    saveTrip: async (tripData) => {
        get()._startLoading();
        try {
            const saved = await createTrip(tripData);
            set((state) => ({
                trips: [saved, ...state.trips],
                currentTrip: saved,
                loading: false,
            }));
            return saved;
        } catch (err) {
            get()._setError(err);
            return null;
        }
    },

    /** Update an existing trip. */
    editTrip: async (tripId, tripData) => {
        get()._startLoading();
        try {
            const updated = await updateTrip(tripId, tripData);
            set((state) => ({
                trips: state.trips.map((t) => (t.id === tripId ? updated : t)),
                currentTrip: updated,
                loading: false,
            }));
            return updated;
        } catch (err) {
            get()._setError(err);
            return null;
        }
    },

    /** Delete a trip and remove it from local state. */
    removeTrip: async (tripId) => {
        get()._startLoading();
        try {
            await deleteTrip(tripId);
            set((state) => ({
                trips: state.trips.filter((t) => t.id !== tripId),
                currentTrip: state.currentTrip?.id === tripId ? null : state.currentTrip,
                loading: false,
            }));
        } catch (err) {
            get()._setError(err);
        }
    },

    /** Launch a trip — records in history and opens navigation. */
    launchCurrentTrip: async (tripId) => {
        get()._startLoading();
        try {
            const result = await launchTrip(tripId);
            // Refresh trips and history state so it's instantly available without remounting
            get().fetchTrips();
            get().fetchHistory();
            set({ loading: false });
            return result;
        } catch (err) {
            get()._setError(err);
            return null;
        }
    },

    /** Local normal word matching search. */
    searchTrips: (query) => {
        if (!query || !query.trim()) {
            set({ searchResults: [], isSearchActive: false });
            return;
        }
        const q = query.trim().toLowerCase();
        const trips = get().trips || [];
        const results = trips.filter(t => {
            const nameMatch = (t.trip_name || '').toLowerCase().includes(q);
            const stopsMatch = (t.stops_json || '').toLowerCase().includes(q);
            return nameMatch || stopsMatch;
        });
        set({ searchResults: results, isSearchActive: true });
    },

    clearSearch: () => set({ searchResults: [], isSearchActive: false }),

    /** Fetch recent launch history. */
    fetchHistory: async () => {
        get()._startLoading();
        try {
            const data = await getHistory();
            // API returns { items: [...] } — extract the array
            const items = Array.isArray(data) ? data : (data?.items || []);
            set({ history: items, loading: false });
        } catch (err) {
            get()._setError(err);
        }
    },

    /** Remove a specific history item. */
    removeHistoryItem: async (historyId) => {
        get()._startLoading();
        try {
            await deleteHistoryItem(historyId);
            set((state) => ({
                history: state.history.filter((h) => h.id !== historyId),
                loading: false,
            }));
        } catch (err) {
            get()._setError(err);
        }
    },

    /** Clear entire history. */
    clearHistory: async () => {
        get()._startLoading();
        try {
            await clearAllHistory();
            set({ history: [], loading: false });
        } catch (err) {
            get()._setError(err);
        }
    },

    /** Clear current trip selection. */
    clearCurrentTrip: () => set({ currentTrip: null }),

    /** Reset the store entirely. */
    reset: () =>
        set({
            trips: [],
            currentTrip: null,
            history: [],
            searchResults: [],
            loading: false,
            error: null,
        }),
    // ── Optimistic Undo Deletes ────────────────
    removeTripOptimistic: (tripId) => {
        const deletedTrip = get().trips.find(t => t.id === tripId);
        set((state) => ({
            trips: state.trips.filter((t) => t.id !== tripId),
            currentTrip: state.currentTrip?.id === tripId ? null : state.currentTrip,
        }));
        return deletedTrip;
    },
    undoRemoveTrip: (trip) => {
        if (!trip) return;
        set((state) => ({ trips: [trip, ...state.trips] }));
    },
    commitRemoveTrip: async (tripId) => {
        try { await deleteTrip(tripId); } catch (err) { get()._setError(err); }
    },

    removeHistoryOptimistic: (historyId) => {
        const deleted = get().history.find(t => t.id === historyId);
        set((state) => ({ history: state.history.filter((t) => t.id !== historyId) }));
        return deleted;
    },
    undoRemoveHistory: (historyObj) => {
        if (!historyObj) return;
        set((state) => ({ history: [historyObj, ...state.history].sort((a, b) => new Date(b.launched_at) - new Date(a.launched_at)) }));
    },
    commitRemoveHistory: async (historyId) => {
        try { await deleteHistoryItem(historyId); } catch (err) { get()._setError(err); }
    },

    clearAllHistoryOptimistic: () => {
        const all = get().history;
        set({ history: [] });
        return all;
    },
    undoClearAllHistory: (allHistory) => {
        set({ history: allHistory || [] });
    },
    commitClearAllHistory: async () => {
        try { await clearAllHistory(); } catch (err) { get()._setError(err); }
    }
}));

export default useTripStore;
