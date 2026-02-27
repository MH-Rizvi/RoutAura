/**
 * PreviewScreen.jsx — Route preview with drag-to-reorder stops.
 *
 * StopList with react-beautiful-dnd, MapPreview with Leaflet,
 * Open in Google Maps / Apple Maps buttons, Save This Trip button.
 */
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import StopList from '../components/StopList';
import MapPreview from '../components/MapPreview';
import SaveTripModal from '../components/SaveTripModal';
import { buildGoogleMapsUrl, buildAppleMapsUrl, isIOS } from '../utils/mapsLinks';
import useTripStore from '../store/tripStore';

export default function PreviewScreen() {
    const location = useLocation();
    const navigate = useNavigate();
    const { launchCurrentTrip } = useTripStore();

    // Stops come from router state (set by ChatScreen or TripDetailScreen)
    const initialStops = location.state?.stops || [];
    const tripId = location.state?.tripId || null;

    const [stops, setStops] = useState(initialStops);
    const [showSaveModal, setShowSaveModal] = useState(false);

    const handleReorder = (reordered) => {
        setStops(reordered);
    };

    const handleDeleteStop = (index) => {
        setStops((prev) => prev.filter((_, i) => i !== index));
    };

    const handleOpenGoogleMaps = async () => {
        if (tripId) {
            await launchCurrentTrip(tripId);
        }
        const url = buildGoogleMapsUrl(stops);
        if (url) window.open(url, '_blank');
    };

    const handleOpenAppleMaps = () => {
        const url = buildAppleMapsUrl(stops);
        if (url) window.open(url, '_blank');
    };

    const handleSaved = (savedTrip) => {
        setShowSaveModal(false);
        navigate(`/trips/${savedTrip.id}`);
    };

    // Warn if too many stops for Google Maps free tier
    const tooManyStops = stops.length > 10;

    return (
        <div className="min-h-full px-4 pt-4 pb-6">
            {/* Back button */}
            <button
                onClick={() => navigate(-1)}
                className="min-h-touch flex items-center gap-1 text-primary font-medium mb-3"
            >
                ← Back
            </button>

            <h1 className="text-2xl font-bold text-body mb-4">Route Preview</h1>

            {stops.length === 0 ? (
                <div className="text-center py-16">
                    <span className="text-5xl mb-4 block">📍</span>
                    <p className="text-secondary text-lg">No stops to preview</p>
                    <button
                        onClick={() => navigate('/chat')}
                        className="mt-4 min-h-touch px-6 rounded-xl bg-primary text-white font-semibold"
                    >
                        Plan a Route
                    </button>
                </div>
            ) : (
                <>
                    {/* Map preview */}
                    <MapPreview stops={stops} />

                    {/* Stop count */}
                    <div className="flex items-center justify-between mt-4 mb-2">
                        <h2 className="text-lg font-semibold text-body">
                            {stops.length} Stop{stops.length !== 1 ? 's' : ''}
                        </h2>
                        <p className="text-sm text-secondary">Drag to reorder</p>
                    </div>

                    {/* Too many stops warning */}
                    {tooManyStops && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-3">
                            <p className="text-sm text-yellow-800">
                                ⚠️ Google Maps free tier supports up to ~8 waypoints. Consider splitting into two routes.
                            </p>
                        </div>
                    )}

                    {/* Reorderable stop list */}
                    <StopList
                        stops={stops}
                        onReorder={handleReorder}
                        onDelete={handleDeleteStop}
                    />

                    {/* Action buttons */}
                    <div className="flex flex-col gap-3 mt-6">
                        <button
                            onClick={handleOpenGoogleMaps}
                            disabled={stops.length < 2}
                            className="w-full min-h-touch rounded-xl bg-primary hover:bg-blue-700 text-white font-semibold text-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
                        >
                            🧭 Open in Google Maps
                        </button>

                        {isIOS() && (
                            <button
                                onClick={handleOpenAppleMaps}
                                disabled={stops.length < 2}
                                className="w-full min-h-touch rounded-xl bg-gray-800 hover:bg-gray-900 text-white font-semibold text-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
                            >
                                🍎 Open in Apple Maps
                            </button>
                        )}

                        <button
                            onClick={() => setShowSaveModal(true)}
                            className="w-full min-h-touch rounded-xl bg-success hover:bg-green-700 text-white font-semibold text-lg flex items-center justify-center gap-2 transition-colors"
                        >
                            💾 Save This Trip
                        </button>
                    </div>
                </>
            )}

            {/* Save modal */}
            {showSaveModal && (
                <SaveTripModal
                    stops={stops}
                    onClose={() => setShowSaveModal(false)}
                    onSaved={handleSaved}
                />
            )}
        </div>
    );
}
