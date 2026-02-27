/**
 * SaveTripModal.jsx — Modal to name and save a trip.
 *
 * Pre-fills name with "first stop → last stop".
 * Only one modal open at a time (CLAUDE.md rule 5).
 */
import { useState } from 'react';
import useTripStore from '../store/tripStore';

export default function SaveTripModal({ stops, onClose, onSaved }) {
    const { saveTrip, loading } = useTripStore();

    // Pre-fill name: "first stop → last stop"
    const defaultName =
        stops && stops.length >= 2
            ? `${stops[0].label} → ${stops[stops.length - 1].label}`
            : 'My Trip';

    const [name, setName] = useState(defaultName);
    const [notes, setNotes] = useState('');
    const [error, setError] = useState(null);

    const handleSave = async () => {
        if (!name.trim()) {
            setError('Please enter a trip name.');
            return;
        }

        setError(null);
        const tripData = {
            name: name.trim(),
            notes: notes.trim() || null,
            stops: stops.map((s, i) => ({
                label: s.label,
                resolved: s.resolved,
                lat: s.lat,
                lng: s.lng,
                note: s.note || null,
                position: i,
            })),
        };

        const saved = await saveTrip(tripData);
        if (saved) {
            onSaved?.(saved);
        } else {
            setError('Something went wrong saving your trip. Please try again.');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
            <div className="bg-card rounded-2xl w-full max-w-md p-6 shadow-xl animate-slide-up">
                <h2 className="text-xl font-semibold text-body mb-4">Save This Trip</h2>

                {/* Trip name */}
                <label className="block text-sm font-medium text-secondary mb-1">
                    Trip Name
                </label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full min-h-touch rounded-xl border border-gray-300 px-4 py-3 text-base text-body bg-background focus:outline-none focus:ring-2 focus:ring-primary mb-4"
                    placeholder="e.g. Morning School Run"
                />

                {/* Notes */}
                <label className="block text-sm font-medium text-secondary mb-1">
                    Notes (optional)
                </label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base text-body bg-background focus:outline-none focus:ring-2 focus:ring-primary mb-4 resize-none"
                    placeholder="Any notes about this route…"
                />

                {/* Error */}
                {error && (
                    <p className="text-danger text-sm mb-3">⚠️ {error}</p>
                )}

                {/* Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 min-h-touch rounded-xl border border-gray-300 text-body font-medium text-base hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex-1 min-h-touch rounded-xl bg-success hover:bg-green-700 text-white font-semibold text-base transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <span className="animate-spin">⏳</span>
                        ) : (
                            '💾 Save Trip'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
