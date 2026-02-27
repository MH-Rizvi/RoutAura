/**
 * HomeScreen.jsx — Quick launch grid of saved trips.
 *
 * Shows top 6 trips sorted by last_used, large TripCard
 * components, empty state, and floating "+" button to /chat.
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useTripStore from '../store/tripStore';
import TripCard from '../components/TripCard';

export default function HomeScreen() {
    const navigate = useNavigate();
    const { trips, loading, error, fetchTrips, clearError } = useTripStore();

    useEffect(() => {
        fetchTrips();
    }, [fetchTrips]);

    // Sort by last_used descending, show top 6
    const topTrips = [...trips]
        .sort((a, b) => {
            if (!a.last_used && !b.last_used) return 0;
            if (!a.last_used) return 1;
            if (!b.last_used) return -1;
            return new Date(b.last_used) - new Date(a.last_used);
        })
        .slice(0, 6);

    return (
        <div className="min-h-full px-4 pt-6 pb-4">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-body">RouteEasy</h1>
                <p className="text-secondary text-base mt-1">Your saved routes, ready to go</p>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                    <p className="text-danger text-sm">⚠️ {error}</p>
                    <button
                        onClick={clearError}
                        className="text-sm text-primary mt-1 underline min-h-touch"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* Loading */}
            {loading && trips.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16">
                    <span className="text-4xl animate-spin mb-3">⏳</span>
                    <p className="text-secondary">Loading your trips…</p>
                </div>
            )}

            {/* Empty state */}
            {!loading && trips.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <span className="text-5xl mb-4">🗺️</span>
                    <h2 className="text-xl font-semibold text-body mb-2">No trips yet</h2>
                    <p className="text-secondary mb-6 max-w-xs">
                        Tap the + button to describe your first route to the AI assistant
                    </p>
                    <button
                        onClick={() => navigate('/chat')}
                        className="min-h-touch px-8 rounded-xl bg-primary text-white font-semibold text-lg hover:bg-blue-700 transition-colors"
                    >
                        + Plan a Route
                    </button>
                </div>
            )}

            {/* Trip grid */}
            {topTrips.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {topTrips.map((trip) => (
                        <TripCard key={trip.id} trip={trip} />
                    ))}
                </div>
            )}

            {/* Floating + button */}
            {trips.length > 0 && (
                <button
                    onClick={() => navigate('/chat')}
                    className="fixed bottom-24 right-5 z-40 w-14 h-14 rounded-full bg-primary hover:bg-blue-700 active:bg-blue-800 text-white text-3xl shadow-lg flex items-center justify-center transition-transform active:scale-90"
                    aria-label="Plan a new route"
                >
                    +
                </button>
            )}
        </div>
    );
}
