/**
 * PreviewScreen.jsx — Dark enterprise route preview.
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
    const { editTrip } = useTripStore();

    const initialStops = location.state?.stops || [];
    const tripId = location.state?.tripId || null;
    const [stops, setStops] = useState(initialStops);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleReorder = (reordered) => setStops(reordered);
    const handleDeleteStop = (index) => setStops((prev) => prev.filter((_, i) => i !== index));

    const handleOverwriteCurrent = async () => {
        if (!tripId || stops.length < 2) return;
        setIsSaving(true);
        const updated = await editTrip(tripId, { stops });
        setIsSaving(false);
        if (updated) {
            navigate(`/trips/${tripId}`);
        }
    };

    return (
        <div className="min-h-full pb-6">
            {/* Header */}
            <div className="h-14 flex items-center justify-between px-5 border-b border-[#1F2937] shrink-0">
                <div className="flex items-center gap-[10px]">
                    <img
                        src="/logo2_nobg.png"
                        alt="RouteEasy Icon"
                        className="w-[40px] h-[40px] object-contain"
                        style={{ filter: 'brightness(1.2) drop-shadow(0 0 4px rgba(245,158,11,0.3))' }}
                    />
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '20px' }}>
                        <span className="text-white font-bold tracking-tight">Route</span>
                        <span className="text-[#F59E0B] font-bold tracking-tight">Easy</span>
                    </div>
                </div>
                <button onClick={() => navigate(-1)} className="min-h-touch flex items-center gap-1 text-accent font-semibold text-sm">
                    ← Back
                </button>
            </div>

            <div className="px-5 mt-5">

                {stops.length === 0 ? (
                    <div className="text-center py-16 animate-fade-up">
                        <div className="w-14 h-14 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2"><circle cx="12" cy="10" r="3" /><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z" /></svg>
                        </div>
                        <p className="text-text-secondary">No stops to preview</p>
                        <button onClick={() => navigate('/chat')} className="mt-4 min-h-touch px-6 rounded-xl btn-accent">Plan a Route</button>
                    </div>
                ) : (
                    <>
                        <MapPreview stops={stops} />

                        <div className="flex items-center justify-between mt-4 mb-2">
                            <h2 className="text-sm font-bold text-text-primary font-mono">{stops.length} Stop{stops.length !== 1 ? 's' : ''}</h2>
                            <p className="text-xs text-text-muted">Drag to reorder</p>
                        </div>

                        {stops.length > 10 && (
                            <div className="card p-3 mb-3 border-accent/30">
                                <p className="text-xs text-accent">⚠ Google Maps supports ~8 waypoints on free tier.</p>
                            </div>
                        )}

                        <StopList stops={stops} onReorder={handleReorder} onDelete={handleDeleteStop} />

                        <div className="flex flex-col gap-3 mt-6">
                            {tripId ? (
                                <>
                                    <button onClick={handleOverwriteCurrent} disabled={stops.length < 2 || isSaving} className="w-full min-h-touch rounded-xl bg-success hover:bg-emerald-600 text-white font-bold text-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                                        {isSaving ? 'Saving...' : 'Overwrite Current'}
                                    </button>
                                    <button onClick={() => setShowSaveModal(true)} disabled={stops.length < 2 || isSaving} className="w-full min-h-touch rounded-xl btn-surface text-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-colors">
                                        Save as New
                                    </button>
                                </>
                            ) : (
                                <button onClick={() => setShowSaveModal(true)} disabled={stops.length < 2 || isSaving} className="w-full min-h-touch rounded-xl bg-success hover:bg-emerald-600 text-white font-bold text-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                                    Save Route
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>

            {showSaveModal && (
                <SaveTripModal stops={stops} onClose={() => setShowSaveModal(false)} onSaved={(s) => { setShowSaveModal(false); navigate(`/trips/${s.id}`); }} />
            )}
        </div>
    );
}
