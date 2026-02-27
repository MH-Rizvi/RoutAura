/**
 * TripCard.jsx — Large, mobile-friendly card for a saved trip.
 *
 * Shows trip name (20px+), stop count, last used date,
 * and a "Navigate Now" button with 48px touch target.
 */
import { useNavigate } from 'react-router-dom';
import useTripStore from '../store/tripStore';
import { buildGoogleMapsUrl } from '../utils/mapsLinks';

export default function TripCard({ trip }) {
    const navigate = useNavigate();
    const { launchCurrentTrip } = useTripStore();

    const stopCount = trip.stops?.length || 0;
    const lastUsed = trip.last_used
        ? new Date(trip.last_used).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
        })
        : 'Never';

    const handleNavigate = async () => {
        if (!trip.stops || trip.stops.length < 2) {
            navigate(`/trips/${trip.id}`);
            return;
        }

        // Launch trip (update stats + history)
        await launchCurrentTrip(trip.id);

        // Open Google Maps
        const url = buildGoogleMapsUrl(trip.stops);
        if (url) window.open(url, '_blank');
    };

    const handleCardTap = () => {
        navigate(`/trips/${trip.id}`);
    };

    return (
        <div
            className="bg-card rounded-2xl shadow-md border border-gray-100 p-5 flex flex-col gap-3 active:scale-[0.98] transition-transform cursor-pointer"
            onClick={handleCardTap}
            role="button"
            tabIndex={0}
        >
            {/* Trip name */}
            <h3 className="text-xl font-semibold text-body truncate">{trip.name}</h3>

            {/* Meta info */}
            <div className="flex items-center gap-3 text-secondary text-sm">
                <span>📍 {stopCount} stop{stopCount !== 1 ? 's' : ''}</span>
                <span>•</span>
                <span>Last used: {lastUsed}</span>
            </div>

            {/* Navigate button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    handleNavigate();
                }}
                className="mt-1 w-full min-h-touch bg-primary hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl text-lg transition-colors flex items-center justify-center gap-2"
            >
                🧭 Navigate Now
            </button>
        </div>
    );
}
