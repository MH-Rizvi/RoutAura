/**
 * PreviewScreen.jsx — Dark enterprise route preview.
 */
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import StopList from '../components/StopList';
import MapPreview from '../components/MapPreview';
import SaveTripModal from '../components/SaveTripModal';
import { buildGoogleMapsUrl, buildAppleMapsUrl, isIOS, openMapLink } from '../utils/mapsLinks';
import useTripStore from '../store/tripStore';
import useToastStore from '../store/toastStore';
import Header from '../components/Header';

export default function PreviewScreen() {
    const location = useLocation();
    const navigate = useNavigate();
    const { editTrip, recordAdHocHistory } = useTripStore();

    const initialStops = location.state?.stops || [];
    const tripId = location.state?.tripId || null;
    const [stops, setStops] = useState(initialStops);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const needsLocation = initialStops.some(stop =>
            stop.label?.toLowerCase() === 'current location' || stop.lat == null || stop.lng == null
        );

        if (needsLocation && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setStops(prev => prev.map(stop => {
                        if (stop.label?.toLowerCase() === 'current location' || stop.lat == null || stop.lng == null) {
                            return {
                                ...stop,
                                lat: latitude,
                                lng: longitude,
                                resolved: 'Your Location'
                            };
                        }
                        return stop;
                    }));
                },
                (error) => {
                    console.error("Geolocation error:", error);
                    let message = "Could not secure location. Please enable location services.";
                    if (error.code === 1) { // PERMISSION_DENIED
                        message = "Location access is blocked. Please enable location in your browser settings to use current location.";
                    } else if (error.code === 2) { // POSITION_UNAVAILABLE
                        message = "Unable to get your location. Please try again.";
                    } else if (error.code === 3) { // TIMEOUT
                        message = "Location request timed out. Please try again.";
                    }
                    useToastStore.getState().showToast(message, "error");
                },
                { timeout: 10000 }
            );
        }
    }, [initialStops]);

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
        <div className="min-h-full pb-6 animate-page-enter">
            <Header
                rightElement={
                    <button onClick={() => navigate(-1)} className="min-h-touch flex items-center gap-[4px] text-accent font-bold tracking-wide text-sm hover:opacity-80 transition-opacity">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
                        Back
                    </button>
                }
            />

            <div className="px-4 sm:px-5 mt-4 sm:mt-5 pb-24 lg:max-w-5xl lg:mx-auto lg:w-full">
                {/* Desktop back button */}
                <button onClick={() => navigate(-1)} className="hidden lg:flex items-center gap-1.5 text-accent font-bold text-sm mb-4 hover:opacity-80 transition-opacity">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
                    Back
                </button>

                {stops.length === 0 ? (
                    <div className="text-center py-16 animate-fade-up">
                        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', boxShadow: '0 0 15px rgba(245,158,11,0.1)' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2"><circle cx="12" cy="10" r="3" /><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z" /></svg>
                        </div>
                        <p className="text-text-secondary">No stops to preview</p>
                        <button onClick={() => navigate('/chat')} className="mt-4 min-h-touch px-6 rounded-xl btn-accent">Plan a Route</button>
                    </div>
                ) : (
                    <>
                        <div className="animate-fade-in"><MapPreview stops={stops} /></div>

                        <div className="flex items-center justify-between mt-4 mb-2 animate-fade-up" style={{ animationDelay: '50ms' }}>
                            <h2 className="text-sm font-bold text-text-primary font-mono">{stops.length} Stop{stops.length !== 1 ? 's' : ''}</h2>
                            <p className="text-xs text-text-muted">Drag to reorder</p>
                        </div>

                        {stops.length > 10 && (
                            <div className="rounded-2xl p-3 mb-3" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
                                <p className="text-xs text-accent">⚠ Google Maps supports ~8 waypoints on free tier.</p>
                            </div>
                        )}

                        <div className="animate-fade-up" style={{ animationDelay: '100ms' }}>
                            <StopList stops={stops} onReorder={handleReorder} onDelete={handleDeleteStop} />
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-6 animate-fade-up" style={{ animationDelay: '150ms' }}>
                            <button onClick={() => {
                                const needsLocation = stops.some(s => s.label?.toLowerCase() === 'current location' && (s.lat == null || s.lng == null));
                                if (needsLocation && navigator.geolocation) {
                                    navigator.geolocation.getCurrentPosition(
                                        (pos) => {
                                            const { latitude, longitude } = pos.coords;
                                            const newStops = stops.map(s => {
                                                if (s.label?.toLowerCase() === 'current location') return { ...s, lat: latitude, lng: longitude, resolved: 'Your Location' };
                                                return s;
                                            });
                                            setStops(newStops);
                                            useToastStore.getState().showToast('Opening Apple Maps...', 'apple');
                                            recordAdHocHistory(newStops, 'chat_preview', tripId);
                                            const url = buildAppleMapsUrl(newStops);
                                            if (url) openMapLink(url);
                                        },
                                        (error) => {
                                            console.error("Geolocation error:", error);
                                            let message = "Could not secure location. Please enable location services.";
                                            if (error.code === 1) message = "Location access is blocked. Please enable location in your browser settings to use current location.";
                                            else if (error.code === 2) message = "Unable to get your location. Please try again.";
                                            else if (error.code === 3) message = "Location request timed out. Please try again.";
                                            useToastStore.getState().showToast(message, "error");
                                        },
                                        { timeout: 10000 }
                                    );
                                    return;
                                }

                                useToastStore.getState().showToast('Opening Apple Maps...', 'apple');
                                recordAdHocHistory(stops, 'chat_preview', tripId);
                                const url = buildAppleMapsUrl(stops);
                                if (url) openMapLink(url);
                            }} disabled={stops.length < 2 || isSaving} className="w-full h-16 rounded-xl text-text-primary text-sm font-semibold flex flex-col items-center justify-center gap-1 transition-all disabled:opacity-30" style={{ background: 'linear-gradient(135deg, rgba(30,41,59,0.5) 0%, rgba(13,17,23,0.8) 100%)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.05 2.53.81 3.19.81.79 0 2.21-1.01 3.84-.86 1.63.13 3.13.84 4.02 2.11-3.41 1.98-2.88 6.51.35 7.84-.79 1.83-2.09 3.85-3.4 5.07zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.28-1.9 4.2-3.74 4.25z" /></svg>
                                Apple Maps
                            </button>
                            <button onClick={() => {
                                const needsLocation = stops.some(s => s.label?.toLowerCase() === 'current location' && (s.lat == null || s.lng == null));
                                if (needsLocation && navigator.geolocation) {
                                    navigator.geolocation.getCurrentPosition(
                                        (pos) => {
                                            const { latitude, longitude } = pos.coords;
                                            const newStops = stops.map(s => {
                                                if (s.label?.toLowerCase() === 'current location') return { ...s, lat: latitude, lng: longitude, resolved: 'Your Location' };
                                                return s;
                                            });
                                            setStops(newStops);
                                            useToastStore.getState().showToast('Opening Google Maps...', 'google');
                                            recordAdHocHistory(newStops, 'chat_preview', tripId);
                                            const url = buildGoogleMapsUrl(newStops);
                                            if (url) openMapLink(url);
                                        },
                                        (error) => {
                                            console.error("Geolocation error:", error);
                                            let message = "Could not secure location. Please enable location services.";
                                            if (error.code === 1) message = "Location access is blocked. Please enable location in your browser settings to use current location.";
                                            else if (error.code === 2) message = "Unable to get your location. Please try again.";
                                            else if (error.code === 3) message = "Location request timed out. Please try again.";
                                            useToastStore.getState().showToast(message, "error");
                                        },
                                        { timeout: 10000 }
                                    );
                                    return;
                                }

                                useToastStore.getState().showToast('Opening Google Maps...', 'google');
                                recordAdHocHistory(stops, 'chat_preview', tripId);
                                const url = buildGoogleMapsUrl(stops);
                                if (url) openMapLink(url);
                            }} disabled={stops.length < 2 || isSaving} className="w-full h-16 rounded-xl text-sm font-semibold text-[#0D1117] flex flex-col items-center justify-center gap-1 disabled:opacity-30 transition-all" style={{ background: '#F59E0B', boxShadow: '0 0 20px rgba(245,158,11,0.3)' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" /></svg>
                                Google Maps
                            </button>
                        </div>

                        <div className="flex flex-col gap-3 mt-4 animate-fade-up" style={{ animationDelay: '200ms' }}>
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
