/**
 * TripsScreen.jsx — Dark enterprise trips library with semantic search.
 */
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useTripStore from '../store/tripStore';
import SemanticSearchBar from '../components/SemanticSearchBar';
import { buildGoogleMapsUrl, buildAppleMapsUrl, openMapLink } from '../utils/mapsLinks';
import useToastStore from '../store/toastStore';
import Header from '../components/Header';

function TripRow({ trip, onDelete, onTap }) {
    const [offset, setOffset] = useState(0);
    const [swiping, setSwiping] = useState(false);
    const startX = useRef(0);

    const getClientX = (e) => e.touches ? e.touches[0].clientX : e.clientX;

    const handleDragStart = (e) => {
        startX.current = getClientX(e);
        setSwiping(true);
    };

    const handleDragMove = (e) => {
        if (!swiping) return;
        const d = startX.current - getClientX(e);
        if (d > 0) setOffset(Math.min(d, 100));
    };

    const handleDragEnd = () => {
        if (!swiping) return;
        setSwiping(false);
        if (offset > 60) onDelete(trip.id);
        setOffset(0);
    };

    const stopCount = trip.stops?.length || trip.stop_count || 0;
    const lastUsed = trip.last_used
        ? new Date(trip.last_used).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        : null;

    return (
        <div className="relative overflow-hidden rounded-2xl w-full group/card transition-all duration-300 hover:shadow-[0_8px_30px_rgba(245,158,11,0.15)] hover:-translate-y-1">
            <div className="absolute inset-0 bg-accent/0 group-hover/card:bg-accent/5 transition-colors duration-500 rounded-2xl pointer-events-none z-0" />

            <div
                className="absolute inset-0 bg-danger flex items-center justify-end pr-6 rounded-2xl transition-opacity duration-200"
                style={{ opacity: offset > 0 ? 1 : 0 }}
            >
                <span className="text-white font-bold text-sm">Delete</span>
            </div>

            <div
                className="relative rounded-2xl p-5 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10 transition-colors border border-transparent group-hover/card:border-accent/40"
                style={{
                    transform: `translateX(-${offset}px)`,
                    background: 'linear-gradient(135deg, rgba(20,26,45,0.6) 0%, rgba(13,17,23,0.8) 100%)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                }}
                onTouchStart={handleDragStart}
                onTouchMove={handleDragMove}
                onTouchEnd={handleDragEnd}
                onMouseDown={handleDragStart}
                onMouseMove={handleDragMove}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
                onClick={() => onTap(trip.id)}
                role="button"
                tabIndex={0}
            >
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-amber-400 to-amber-600 rounded-l-2xl opacity-80 group-hover/card:opacity-100 transition-opacity" />

                <div className="flex-1 min-w-0 pl-3">
                    <h3 className="text-[20px] sm:text-[22px] font-bold text-white truncate drop-shadow-sm group-hover/card:text-accent transition-colors">
                        {trip.name}
                    </h3>
                    <div className="flex items-center gap-3 text-[14px] text-white/50 mt-1.5 font-medium">
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-white/80">
                            {stopCount} stops
                        </span>
                        {lastUsed && <span>• {lastUsed}</span>}
                    </div>
                </div>

                {/* Visual Route Representation */}
                {trip.stops && trip.stops.length >= 2 && (
                    <div className="hidden md:flex items-center justify-center flex-1 px-6 opacity-50 group-hover/card:opacity-100 transition-opacity">
                        <div className="w-2.5 h-2.5 rounded-full bg-accent relative z-10 shadow-[0_0_8px_rgba(245,158,11,0.8)] shrink-0" />
                        <div className="h-[2px] w-12 bg-gradient-to-r from-accent to-white/20" />
                        <div className="w-1.5 h-1.5 rounded-full bg-white/40 shrink-0" />
                        <div className="h-[2px] w-4 border-t border-dashed border-white/20" />
                        <div className="w-1.5 h-1.5 rounded-full bg-white/40 shrink-0" />
                        <div className="h-[2px] w-12 bg-gradient-to-r from-white/20 to-emerald-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 relative z-10 shadow-[0_0_8px_rgba(52,211,153,0.8)] shrink-0" />
                    </div>
                )}

                <div className="flex items-center justify-end shrink-0 sm:pl-4 mt-2 sm:mt-0">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!trip.stops || trip.stops.length < 2) return;
                            useTripStore.getState().launchCurrentTrip(trip.id).catch(err => console.error(err));
                            useToastStore.getState().showToast('Launching Route...', 'google');
                            const url = buildGoogleMapsUrl(trip.stops);
                            if (url) openMapLink(url);
                        }}
                        title="Launch Route"
                        className="px-6 py-3 rounded-xl flex items-center justify-center text-[14px] font-bold text-[#0D1117] transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:shadow-[0_0_25px_rgba(245,158,11,0.6)]"
                        style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', border: '1px solid rgba(255,255,255,0.2)' }}
                    >
                        Launch
                        <svg className="ml-2 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function TripsScreen() {
    const navigate = useNavigate();
    const { trips, searchResults, isSearchActive, loading, error, fetchTrips, removeTripOptimistic, undoRemoveTrip, commitRemoveTrip, clearError } = useTripStore();

    useEffect(() => { fetchTrips(); }, [fetchTrips]);

    useEffect(() => {
        if (error) {
            useToastStore.getState().showToast(error, 'error');
            clearError();
        }
    }, [error, clearError]);

    const isSearching = isSearchActive;
    const displayTrips = isSearching ? searchResults : trips;

    const tripsThisWeek = displayTrips.filter((t) => {
        if (!t.last_used) return false;
        const diff = Date.now() - new Date(t.last_used).getTime();
        return diff < 7 * 24 * 60 * 60 * 1000;
    });

    const olderTrips = displayTrips.filter(t => !tripsThisWeek.includes(t));

    return (
        <div className="min-h-full pb-6 flex flex-col animate-page-enter lg:px-8 lg:pt-6">
            <Header rightElement={null} />

            <div className="px-4 sm:px-5 lg:px-8 mt-4 sm:mt-6 flex-1 pb-24 lg:max-w-6xl lg:mx-auto w-full">

                {/* ── Page Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-8 animate-fade-up">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-white flex items-center gap-4 drop-shadow-md tracking-tight">
                            <span className="p-3 rounded-2xl bg-accent/10 border border-accent/20 shadow-[0_0_20px_rgba(245,158,11,0.15)] flex items-center justify-center">
                                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>
                            </span>
                            My Trips
                        </h1>
                        <p className="text-text-muted text-[15px] mt-2 font-medium">Manage and access your saved routes.</p>
                    </div>

                    <button
                        onClick={() => navigate('/chat')}
                        className="px-6 py-3.5 rounded-2xl flex items-center justify-center text-[15px] font-bold text-[#0D1117] transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.6)] group shrink-0"
                        style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', border: '1px solid rgba(255,255,255,0.2)' }}
                    >
                        <span className="mr-2 text-xl font-black group-hover:rotate-90 transition-transform duration-300">+</span> New Route
                    </button>
                </div>

                <div className="mb-8 lg:max-w-3xl animate-fade-up" style={{ animationDelay: '50ms' }}><SemanticSearchBar /></div>

                {loading && displayTrips.length === 0 && (
                    <div className="space-y-5 lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="rounded-2xl h-[120px] bg-white/5 animate-pulse border border-white/10" style={{ backdropFilter: 'blur(12px)' }} />
                        ))}
                    </div>
                )}

                {!loading && displayTrips.length === 0 && (
                    <div className="text-center py-20 animate-fade-up rounded-3xl mt-10 transition-all border border-accent/20 shadow-[0_10px_40px_rgba(0,0,0,0.4)]" style={{ background: 'linear-gradient(180deg, rgba(20,26,45,0.4) 0%, rgba(13,17,23,0.8) 100%)', backdropFilter: 'blur(16px)' }}>
                        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 relative overflow-hidden" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', boxShadow: '0 0 30px rgba(245,158,11,0.15)' }}>
                            <div className="absolute inset-0 bg-accent/20 animate-ping rounded-full" />
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5" className="relative z-10"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                        </div>
                        <h3 className="text-2xl font-black text-white mb-2 drop-shadow-md">{isSearching ? 'No routes found' : 'No saved routes yet'}</h3>
                        <p className="text-text-muted text-[15px] max-w-sm mx-auto">{isSearching ? 'Try adjusting your search terms.' : 'Your completed routes will appear here for easy access. Chat with the AI to map something new!'}</p>
                    </div>
                )}

                {isSearching && displayTrips.length > 0 && (
                    <div className="mb-6 flex items-center justify-between animate-fade-up">
                        <h2 className="text-[14px] font-bold text-white tracking-wide">Search Results</h2>
                        <span className="text-xs text-accent bg-accent/10 border border-accent/20 px-3 py-1.5 rounded-lg font-mono font-bold">{displayTrips.length} Found</span>
                    </div>
                )}

                {!isSearching && displayTrips.length > 0 && tripsThisWeek.length > 0 && (
                    <div className="mb-10 animate-fade-up">
                        <h2 className="text-[13px] font-black text-white/50 uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
                            <span className="flex w-2.5 h-2.5 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full w-2.5 h-2.5 bg-success shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                            </span>
                            Active This Week
                        </h2>
                        <div className="space-y-4 xl:grid xl:grid-cols-2 xl:gap-5 xl:space-y-0">
                            {tripsThisWeek.map((trip, i) => (
                                <div key={trip.id} className="animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                                    <TripRow trip={trip} onDelete={async (id) => {
                                        const deletedData = removeTripOptimistic(id);
                                        let isUndoing = false;
                                        useToastStore.getState().showToast('Trip deleted', 'success', { label: 'Undo', onClick: () => { isUndoing = true; undoRemoveTrip(deletedData); } }, 5000);
                                        setTimeout(() => { if (!isUndoing) commitRemoveTrip(id); }, 5000);
                                    }} onTap={(id) => navigate(`/trips/${id}`)} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {(isSearching || olderTrips.length > 0) && displayTrips.length > 0 && (
                    <div className="animate-fade-up" style={{ animationDelay: '100ms' }}>
                        {!isSearching && tripsThisWeek.length > 0 && (
                            <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-8" />
                        )}
                        {!isSearching && (
                            <h2 className="text-[13px] font-black text-white/50 uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
                                <span className="w-2.5 h-2.5 rounded-full bg-border-hl border border-white/20" />
                                All Saved Routes
                            </h2>
                        )}
                        <div className="space-y-4 xl:grid xl:grid-cols-2 xl:gap-5 xl:space-y-0">
                            {(isSearching ? displayTrips : olderTrips).map((trip, i) => (
                                <div key={trip.id} className="animate-fade-up" style={{ animationDelay: `${(tripsThisWeek.length + i) * 30}ms` }}>
                                    <TripRow trip={trip} onDelete={async (id) => {
                                        const deletedData = removeTripOptimistic(id);
                                        let isUndoing = false;
                                        useToastStore.getState().showToast('Trip deleted', 'success', { label: 'Undo', onClick: () => { isUndoing = true; undoRemoveTrip(deletedData); } }, 5000);
                                        setTimeout(() => { if (!isUndoing) commitRemoveTrip(id); }, 5000);
                                    }} onTap={(id) => navigate(`/trips/${id}`)} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {!isSearching && trips.length > 0 && (
                    <div className="flex justify-center mt-12 mb-4 opacity-60 lg:hidden pointer-events-none">
                        <p className="text-[11px] font-mono text-white flex items-center gap-2 px-5 py-2.5 rounded-full" style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)' }}>
                            <span className="tracking-[0.1em] font-medium uppercase">Swipe left on a card to delete</span>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
