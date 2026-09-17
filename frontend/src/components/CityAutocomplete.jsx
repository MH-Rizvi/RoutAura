/**
 * CityAutocomplete — city input with Google Places suggestions dropdown.
 * Disabled until a state is selected. User can pick from suggestions or enter manually.
 */
import { useState, useRef, useEffect } from 'react';
import { autocompleteCities } from '../api/client';

export default function CityAutocomplete({ value, onChange, stateAbbr, disabled, className = '', inputClassName = '' }) {
    const [query, setQuery] = useState(value || '');
    const [suggestions, setSuggestions] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef(null);
    const wrapperRef = useRef(null);
    const requestIdRef = useRef(0);
    const [picked, setPicked] = useState(!!value);

    // Sync external value changes (e.g. form reset or pre-population)
    useEffect(() => {
        setQuery(value || '');
        setPicked(!!value);
    }, [value]);

    // Reset autocomplete state if selected state changes
    useEffect(() => {
        if (!stateAbbr) {
            setSuggestions([]);
            setShowDropdown(false);
            setLoading(false);
            if (debounceRef.current) clearTimeout(debounceRef.current);
        }
    }, [stateAbbr]);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const fetchSuggestions = (text) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        const currentReqId = ++requestIdRef.current;

        const trimmedText = text.trim();
        if (trimmedText.length < 2 || !stateAbbr) {
            setSuggestions([]);
            setShowDropdown(false);
            setLoading(false);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const results = await autocompleteCities(trimmedText, stateAbbr);
                if (currentReqId === requestIdRef.current) {
                    setSuggestions(results || []);
                    setShowDropdown(Array.isArray(results) && results.length > 0);
                }
            } catch (err) {
                if (currentReqId === requestIdRef.current) {
                    setSuggestions([]);
                    setShowDropdown(false);
                }
            } finally {
                if (currentReqId === requestIdRef.current) {
                    setLoading(false);
                }
            }
        }, 300);
    };

    const handleInputChange = (e) => {
        const text = e.target.value;
        setQuery(text);
        setPicked(false);
        // Allow manual typing fallback so form validation is satisfied as user types
        onChange(text);
        fetchSuggestions(text);
    };

    const handleSelect = (city) => {
        setQuery(city);
        setPicked(true);
        onChange(city);
        setSuggestions([]);
        setShowDropdown(false);
        setLoading(false);
    };

    const handleBlur = () => {
        // Small delay so dropdown clicks fire before dropdown hides
        setTimeout(() => {
            setShowDropdown(false);
        }, 200);
    };

    const isDisabled = disabled || !stateAbbr;

    return (
        <div ref={wrapperRef} className={`relative ${className}`}>
            <input
                type="text"
                value={query}
                onChange={handleInputChange}
                onBlur={handleBlur}
                onFocus={() => { if (suggestions.length > 0 && !picked) setShowDropdown(true); }}
                disabled={isDisabled}
                placeholder={isDisabled ? 'Select a state first' : 'Start typing a city...'}
                className={inputClassName}
                autoComplete="off"
            />
            {loading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <div className="w-4 h-4 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                </div>
            )}
            {showDropdown && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-[#111827] border border-white/[0.1] rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-50 overflow-hidden">
                    {suggestions.map((s, i) => (
                        <button
                            key={s.place_id || i}
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault(); // Prevent blur before select
                                handleSelect(s.city);
                            }}
                            onClick={() => handleSelect(s.city)}
                            className="w-full text-left px-4 py-3 text-[14px] text-white/80 hover:bg-amber-500/10 hover:text-white transition-colors flex items-center gap-2 border-b border-white/[0.04] last:border-0"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500/60 shrink-0">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                            </svg>
                            <span>{s.description}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

