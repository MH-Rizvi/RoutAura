/**
 * TripCard.jsx — Dark enterprise trip card with amber accent.
 */
import { useNavigate } from 'react-router-dom';
import useTripStore from '../store/tripStore';
import { buildGoogleMapsUrl, buildAppleMapsUrl, openMapLink } from '../utils/mapsLinks';
import useToastStore from '../store/toastStore';

export default function TripCard({ trip }) {
    const navigate = useNavigate();
    const { launchCurrentTrip } = useTripStore();

    const stopCount = trip.stops?.length || 0;
    const lastUsed = trip.last_used
        ? new Date(trip.last_used).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        : 'Never';

    const handleGoogleMaps = (e) => {
        e.stopPropagation();
        if (!trip.stops || trip.stops.length < 2) { navigate(`/trips/${trip.id}`); return; }

        launchCurrentTrip(trip.id).catch(err => console.error("Failed to track launch", err));
        useToastStore.getState().showToast('Opening Google Maps...', 'google');

        const url = buildGoogleMapsUrl(trip.stops);
        if (url) openMapLink(url);
    };

    const handleAppleMaps = (e) => {
        e.stopPropagation();
        if (!trip.stops || trip.stops.length < 2) { navigate(`/trips/${trip.id}`); return; }

        launchCurrentTrip(trip.id).catch(err => console.error("Failed to track launch", err));
        useToastStore.getState().showToast('Opening Apple Maps...', 'apple');

        const url = buildAppleMapsUrl(trip.stops);
        if (url) openMapLink(url);
    };

    return (
        <div
            className="card card-accent p-4 flex items-center gap-4 cursor-pointer hover:border-accent/50 transition-all group"
            onClick={() => navigate(`/trips/${trip.id}`)}
            role="button"
            tabIndex={0}
        >
            {/* Route dots visualization */}
            <div className="flex flex-col items-center gap-1 shrink-0 py-1">
                <span className="w-2.5 h-2.5 rounded-full bg-accent" />
                {stopCount > 2 && <span className="w-px h-3 bg-border-hl" />}
                {stopCount > 2 && <span className="w-1.5 h-1.5 rounded-full bg-border-hl" />}
                <span className="w-px h-3 bg-border-hl" />
                <span className="w-2.5 h-2.5 rounded-full border-2 border-accent bg-transparent" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-text-primary truncate">{trip.name}</h3>
                <div className="flex items-center gap-3 text-sm text-text-muted mt-1">
                    <span className="font-mono">{stopCount} stops</span>
                    <span className="text-border-hl">•</span>
                    <span>{lastUsed}</span>
                </div>
            </div>

            {/* Maps Options */}
            <div className="flex items-center gap-2 shrink-0">
                <button
                    onClick={handleAppleMaps}
                    title="Open in Apple Maps"
                    className="w-10 h-10 rounded-full bg-surface border border-border-hl flex items-center justify-center text-text-primary hover:bg-border-hl transition-colors"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.05 2.53.81 3.19.81.79 0 2.21-1.01 3.84-.86 1.63.13 3.13.84 4.02 2.11-3.41 1.98-2.88 6.51.35 7.84-.79 1.83-2.09 3.85-3.4 5.07zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.28-1.9 4.2-3.74 4.25z" />
                    </svg>
                </button>
                <button
                    onClick={handleGoogleMaps}
                    title="Open in Google Maps"
                    className="w-10 h-10 rounded-full bg-accent border border-accent/70 flex items-center justify-center text-base hover:brightness-110 transition-colors"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
