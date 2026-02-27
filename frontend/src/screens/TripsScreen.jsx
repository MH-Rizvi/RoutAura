/**
 * TripsScreen.jsx — Full trips library with semantic search.
 *
 * SemanticSearchBar with 300ms debounce, similarity score badges,
 * swipe-to-delete via touch gesture, loading/error states.
 */
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useTripStore from '../store/tripStore';
import SemanticSearchBar from '../components/SemanticSearchBar';

function SwipeableTripRow({ trip, onDelete, onTap }) {
    const [offset, setOffset] = useState(0);
    const [swiping, setSwiping] = useState(false);
    const startX = useRef(0);

    const handleTouchStart = (e) => {
        startX.current = e.touches[0].clientX;
        setSwiping(true);
    };

    const handleTouchMove = (e) => {
        if (!swiping) return;
        const diff = startX.current - e.touches[0].clientX;
        if (diff > 0) setOffset(Math.min(diff, 100));
    };

    const handleTouchEnd = () => {
        setSwiping(false);
        if (offset > 60) {
            onDelete(trip.id);
        }
        setOffset(0);
    };

    const stopCount = trip.stops?.length || trip.stop_count || 0;
    const lastUsed = trip.last_used
        ? new Date(trip.last_used).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
        })
        : null;

    return (
        <div className="relative overflow-hidden rounded-xl">
            {/* Delete backdrop */}
            <div className="absolute inset-0 bg-danger flex items-center justify-end pr-6 rounded-xl">
                <span className="text-white font-semibold">Delete</span>
            </div>

            {/* Card */}
            <div
                className="relative bg-card border border-gray-100 rounded-xl p-4 cursor-pointer active:bg-gray-50 transition-transform"
                style={{ transform: `translateX(-${offset}px)` }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={() => onTap(trip.id)}
                role="button"
                tabIndex={0}
            >
                <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-semibold text-body truncate">{trip.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-secondary mt-1">
                            <span>📍 {stopCount} stop{stopCount !== 1 ? 's' : ''}</span>
                            {lastUsed && <span>• {lastUsed}</span>}
                        </div>
                    </div>

                    {/* Similarity badge (shown in search results) */}
                    {trip.similarity !== undefined && (
                        <span className="shrink-0 ml-3 px-2.5 py-1 rounded-full bg-blue-50 text-primary text-sm font-semibold">
                            {Math.round(trip.similarity * 100)}% match
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function TripsScreen() {
    const navigate = useNavigate();
    const { trips, searchResults, loading, error, fetchTrips, removeTrip, clearError } =
        useTripStore();

    useEffect(() => {
        fetchTrips();
    }, [fetchTrips]);

    // Show search results if available, otherwise show all trips
    const isSearching = searchResults.length > 0;
    const displayTrips = isSearching ? searchResults : trips;

    const handleDelete = async (tripId) => {
        await removeTrip(tripId);
    };

    const handleTap = (tripId) => {
        navigate(`/trips/${tripId}`);
    };

    return (
        <div className="min-h-full px-4 pt-6 pb-4">
            <h1 className="text-2xl font-bold text-body mb-4">My Trips</h1>

            {/* Search bar */}
            <div className="mb-4">
                <SemanticSearchBar />
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                    <p className="text-danger text-sm">⚠️ {error}</p>
                    <button onClick={clearError} className="text-sm text-primary mt-1 underline min-h-touch">
                        Dismiss
                    </button>
                </div>
            )}

            {/* Loading */}
            {loading && displayTrips.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16">
                    <span className="text-4xl animate-spin mb-3">⏳</span>
                    <p className="text-secondary">Loading trips…</p>
                </div>
            )}

            {/* Empty state */}
            {!loading && displayTrips.length === 0 && (
                <div className="text-center py-16">
                    <span className="text-5xl mb-4 block">📭</span>
                    <p className="text-secondary text-lg">
                        {isSearching ? 'No trips match your search' : 'No saved trips yet'}
                    </p>
                </div>
            )}

            {/* Search results label */}
            {isSearching && displayTrips.length > 0 && (
                <p className="text-sm text-secondary mb-2">
                    {displayTrips.length} result{displayTrips.length !== 1 ? 's' : ''} found
                </p>
            )}

            {/* Trip list */}
            <div className="flex flex-col gap-3">
                {displayTrips.map((trip) => (
                    <SwipeableTripRow
                        key={trip.id}
                        trip={trip}
                        onDelete={handleDelete}
                        onTap={handleTap}
                    />
                ))}
            </div>

            {/* Swipe hint */}
            {!isSearching && trips.length > 0 && (
                <p className="text-center text-xs text-secondary mt-6">
                    ← Swipe left on a trip to delete
                </p>
            )}
        </div>
    );
}
