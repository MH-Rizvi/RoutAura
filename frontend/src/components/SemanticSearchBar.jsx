/**
 * SemanticSearchBar.jsx — Debounced search input for trips.
 *
 * Calls GET /trips/search?q=... with 300ms debounce.
 * Shows similarity score badges on results.
 */
import { useState, useEffect, useRef } from 'react';
import useTripStore from '../store/tripStore';

export default function SemanticSearchBar() {
    const [query, setQuery] = useState('');
    const { searchTrips, searchResults, loading } = useTripStore();
    const debounceRef = useRef(null);

    useEffect(() => {
        // Clear previous timer
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (!query.trim()) {
            // Clear results when query is empty
            useTripStore.getState().searchTrips('');
            return;
        }

        // 300ms debounce per CLAUDE.md
        debounceRef.current = setTimeout(() => {
            searchTrips(query.trim());
        }, 300);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query, searchTrips]);

    return (
        <div className="w-full">
            {/* Search input */}
            <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary text-lg">
                    🔍
                </span>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search trips… (e.g. school run)"
                    className="w-full min-h-touch rounded-xl border border-gray-300 pl-11 pr-4 py-3 text-base text-body bg-card placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                {loading && query && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-lg">
                        ⏳
                    </span>
                )}
            </div>
        </div>
    );
}
