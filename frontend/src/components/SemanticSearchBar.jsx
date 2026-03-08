/**
 * SemanticSearchBar.jsx — Dark enterprise search with amber focus ring.
 */
import { useState, useRef, useCallback } from 'react';
import useTripStore from '../store/tripStore';

export default function SemanticSearchBar() {
    const { searchTrips, clearSearch } = useTripStore();
    const [query, setQuery] = useState('');
    const timerRef = useRef(null);

    const handleChange = useCallback((e) => {
        const value = e.target.value;
        setQuery(value);
        clearTimeout(timerRef.current);
        if (!value.trim()) { clearSearch(); return; }
        timerRef.current = setTimeout(() => searchTrips(value.trim()), 300);
    }, [searchTrips, clearSearch]);

    return (
        <div className="relative w-full group">
            {/* Soft amber background glow behind the input */}
            <div className="absolute inset-0 bg-accent/5 blur-xl group-focus-within:bg-accent/20 transition-all duration-500 rounded-2xl pointer-events-none" />

            <div
                className="relative rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-all duration-300 group-focus-within:shadow-[0_8px_30px_rgba(245,158,11,0.2)] group-focus-within:-translate-y-0.5"
                style={{
                    background: 'rgba(13, 17, 26, 0.7)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: '1px solid rgba(245,158,11,0.2)',
                }}
            >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-accent to-amber-600 opacity-80 group-focus-within:opacity-100 transition-opacity" />

                <svg className="absolute left-5 top-1/2 -translate-y-1/2 text-accent transition-colors group-focus-within:text-amber-400" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>

                <input
                    type="text" value={query} onChange={handleChange}
                    placeholder="Search your saved routes..."
                    className="w-full h-14 bg-transparent outline-none pl-14 pr-12 text-[16px] text-white placeholder:text-white/30 font-medium tracking-wide"
                />

                {query && (
                    <button onClick={() => { setQuery(''); clearSearch(); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-all hover:bg-white/10"
                        title="Clear search"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                )}
            </div>
        </div>
    );
}
