/**
 * StopItem.jsx — Single stop row in a stop list.
 *
 * Shows position number, resolved address, optional note,
 * and a delete button. Designed for use inside StopList
 * with drag-to-reorder support (react-beautiful-dnd provides wrapper).
 */
export default function StopItem({ stop, index, onDelete, dragHandleProps }) {
    return (
        <div className="flex items-center gap-3 bg-card rounded-xl px-4 py-3 border border-gray-100 shadow-sm">
            {/* Drag handle + position number */}
            <div
                {...(dragHandleProps || {})}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold text-sm shrink-0 cursor-grab active:cursor-grabbing"
            >
                {index + 1}
            </div>

            {/* Stop info */}
            <div className="flex-1 min-w-0">
                <p className="text-base font-medium text-body truncate">
                    {stop.label || stop.resolved}
                </p>
                {stop.resolved && stop.resolved !== stop.label && (
                    <p className="text-sm text-secondary truncate">{stop.resolved}</p>
                )}
                {stop.note && (
                    <p className="text-xs text-secondary italic mt-0.5">📝 {stop.note}</p>
                )}
            </div>

            {/* Delete button */}
            {onDelete && (
                <button
                    onClick={() => onDelete(index)}
                    className="min-w-touch min-h-touch flex items-center justify-center text-danger hover:bg-red-50 rounded-xl transition-colors shrink-0"
                    aria-label={`Remove stop ${index + 1}`}
                >
                    <span className="text-xl">✕</span>
                </button>
            )}
        </div>
    );
}
