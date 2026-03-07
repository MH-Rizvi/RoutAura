/**
 * SaveTripModal.jsx — Dark enterprise save modal.
 */
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import useTripStore from '../store/tripStore';
import useToastStore from '../store/toastStore';

export default function SaveTripModal({ stops, onClose, onSaved }) {
    const { saveTrip, loading } = useTripStore();
    const defaultName = stops?.length >= 2 ? `${stops[0].label} → ${stops[stops.length - 1].label}` : 'My Trip';
    const [name, setName] = useState(defaultName);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        // Disable scroll on mount
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            // Restore scroll on unmount
            document.body.style.overflow = originalOverflow;
        };
    }, []);

    const handleSave = async () => {
        if (!name.trim()) {
            useToastStore.getState().showToast('Please enter a trip name.', 'error');
            return;
        }
        const tripData = {
            name: name.trim(), notes: notes.trim() || null,
            stops: stops.map((s, i) => ({ label: s.label, resolved: s.resolved, lat: s.lat, lng: s.lng, note: s.note || null, position: i })),
        };
        const saved = await saveTrip(tripData);
        if (saved) {
            useToastStore.getState().showToast('Trip saved successfully!', 'success');
            onSaved?.(saved);
        } else {
            useToastStore.getState().showToast('Something went wrong.', 'error');
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center px-4 py-8 pointer-events-auto" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
            <div className="w-full max-w-md animate-slide-up overflow-hidden relative z-[1000000] rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(30,41,59,0.95) 0%, rgba(13,17,23,0.98) 100%)', border: '1px solid rgba(245,158,11,0.15)', boxShadow: '0 0 40px rgba(0,0,0,0.5), 0 0 20px rgba(245,158,11,0.05)' }}>
                <div className="h-1 bg-gradient-to-r from-[#F59E0B] via-[#FBBF24] to-[#F59E0B]" />
                <div className="p-6">
                    <h2 className="text-xl font-bold text-text-primary mb-4">Save This Trip</h2>

                    <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">Trip Name</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                        className="w-full min-h-touch rounded-xl px-4 py-3 text-base text-text-primary placeholder:text-text-muted mb-4"
                        style={{ background: 'rgba(10,15,30,0.6)', border: '1px solid rgba(245,158,11,0.1)' }}
                        placeholder="e.g. Morning School Run" />

                    <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">Notes (optional)</label>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
                        className="w-full rounded-xl px-4 py-3 text-base text-text-primary placeholder:text-text-muted mb-4 resize-none"
                        style={{ background: 'rgba(10,15,30,0.6)', border: '1px solid rgba(245,158,11,0.1)' }}
                        placeholder="Any notes about this route…" />

                    <div className="flex gap-3 mt-2">
                        <button onClick={onClose} disabled={loading} className="flex-1 min-h-touch rounded-xl btn-surface text-base">Cancel</button>
                        <button onClick={handleSave} disabled={loading} className="flex-1 min-h-touch rounded-xl bg-success hover:bg-emerald-600 text-white font-bold text-base transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                            {loading ? <span className="typing-dots"><span /><span /><span /></span> : 'Save Trip'}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
