/**
 * MessageBubble.jsx — Dark enterprise chat bubbles.
 * User: elevated surface with amber border. AI: surface with amber left border.
 */
import { Map, MapPin } from 'lucide-react';

export default function MessageBubble({ role, content, timestamp, routeStops, distanceText, durationText, onPreviewRoute }) {
    const isUser = role === 'user';

    const displayContent = isUser ? content : content.replace(/\s*\(-?\d+\.?\d*,\s*-?\d+\.?\d*\)\s*/g, ' ').trim();

    // Filter out numbered list from content if routeStops exist
    const textContent = (!isUser && routeStops && routeStops.length > 0)
        ? displayContent.split('\n').filter(line => !/^\s*\d+\.\s/.test(line)).join('\n').trim()
        : displayContent;

    let totalDistanceDetails = null;
    if (routeStops && routeStops.length > 1) {
        totalDistanceDetails = {
            distance: distanceText || 'N/A',
            time: durationText || 'N/A',
            stops: routeStops.length + ' stops'
        };
    }

    const hasRouteCard = !isUser && routeStops && routeStops.length > 0;

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 animate-fade-up`}>
            {/* AI avatar */}
            {!isUser && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center mr-2 mt-1 shrink-0" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', boxShadow: '0 0 8px rgba(245,158,11,0.15)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2"><circle cx="12" cy="10" r="3" /><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z" /></svg>
                </div>
            )}

            <div className={`max-w-[85%] rounded-[20px] relative ${isUser
                ? 'rounded-br-[4px] px-4 py-3'
                : `rounded-bl-[4px] ${hasRouteCard ? 'px-4 pt-4 pb-0 sm:px-5 sm:py-5 w-full sm:w-[400px]' : 'px-4 py-3'}`
                }`}
                style={isUser
                    ? {
                        background: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0.05) 100%)',
                        border: '1px solid rgba(245,158,11,0.25)',
                        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                        boxShadow: '0 4px 15px rgba(245,158,11,0.08)'
                    }
                    : {
                        background: 'rgba(13,17,23,0.7)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderLeft: '3px solid rgba(245,158,11,0.8)',
                        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                        boxShadow: hasRouteCard ? '0 0 25px rgba(245,158,11,0.15)' : '0 4px 20px rgba(0,0,0,0.3)'
                    }
                }
            >
                {textContent && (
                    <p className="text-base text-text-primary whitespace-pre-wrap break-words leading-relaxed">
                        {textContent}
                    </p>
                )}

                {timestamp && !hasRouteCard && (
                    <p className={`text-[11px] mt-1.5 font-mono ${isUser ? 'text-text-muted' : 'text-text-muted'}`}>
                        {new Date(timestamp).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                    </p>
                )}

                {hasRouteCard && (
                    <div className="mt-3 sm:mt-4 flex flex-col pt-0 w-full">
                        {/* Stops list */}
                        <div className="flex flex-col space-y-0 relative mb-3 sm:mb-5">
                            {routeStops.map((stop, idx) => {
                                const isFirst = idx === 0;
                                const isLast = idx === routeStops.length - 1;

                                return (
                                    <div key={idx} className="flex group relative pb-4 sm:pb-5 last:pb-0">
                                        {/* Timeline line */}
                                        {!isLast && (
                                            <div className="absolute left-[11px] top-[24px] bottom-[-4px] w-0.5 border-l-2 border-dashed border-amber-500/30"></div>
                                        )}

                                        {/* Timeline dot */}
                                        <div className="relative mr-3 sm:mr-4 flex flex-col items-center mt-1">
                                            {isFirst ? (
                                                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-500 flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.6)] z-10 shrink-0">
                                                    <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#0A0F1E]"></div>
                                                </div>
                                            ) : isLast ? (
                                                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-[#0A0F1E] flex items-center justify-center text-amber-500 rounded-full z-10 shadow-[0_0_12px_rgba(245,158,11,0.4)] shrink-0">
                                                    <MapPin size={14} className="sm:w-4 sm:h-4" fill="currentColor" strokeWidth={2} />
                                                </div>
                                            ) : (
                                                <div className="w-3 h-3 sm:w-4 sm:h-4 ml-[2px] sm:ml-1 rounded-full border-2 border-amber-500 bg-[#0A0F1E] z-10 shadow-[0_0_8px_rgba(245,158,11,0.4)] shrink-0"></div>
                                            )}
                                        </div>

                                        {/* Stop Details */}
                                        <div className="flex-1 pb-1">
                                            {isFirst && <div className="text-[9px] sm:text-[10px] uppercase font-bold text-amber-500 mb-0.5 tracking-wider">Start</div>}
                                            {isLast && <div className="text-[9px] sm:text-[10px] uppercase font-bold text-amber-500 mb-0.5 tracking-wider">End</div>}
                                            <div className="text-white font-bold text-base sm:text-lg leading-tight">
                                                {stop.label}
                                            </div>
                                            <div className="text-gray-400 text-[12px] sm:text-[13px] mt-0.5 sm:mt-1 leading-snug">
                                                {stop.resolved}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Divider */}
                        <div className="w-full h-px bg-amber-500/30 mb-3 sm:mb-5"></div>

                        {/* Summary Pills */}
                        {totalDistanceDetails && (
                            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-5">
                                <div className="flex flex-col items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 py-2 sm:py-2.5 shadow-inner">
                                    <span className="text-[8px] sm:text-[9px] uppercase font-bold text-amber-500/70 tracking-widest mb-0.5 sm:mb-1">Duration</span>
                                    <span className="text-amber-500 font-bold text-[13px] sm:text-[15px] tracking-tight">{totalDistanceDetails.time}</span>
                                </div>
                                <div className="flex flex-col items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 py-2 sm:py-2.5 shadow-inner">
                                    <span className="text-[8px] sm:text-[9px] uppercase font-bold text-amber-500/70 tracking-widest mb-0.5 sm:mb-1">Distance</span>
                                    <span className="text-amber-500 font-bold text-[13px] sm:text-[15px] tracking-tight">{totalDistanceDetails.distance}</span>
                                </div>
                                <div className="flex flex-col items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 py-2 sm:py-2.5 shadow-inner">
                                    <span className="text-[8px] sm:text-[9px] uppercase font-bold text-amber-500/70 tracking-widest mb-0.5 sm:mb-1">Stops</span>
                                    <span className="text-amber-500 font-bold text-[13px] sm:text-[15px] tracking-tight">{totalDistanceDetails.stops}</span>
                                </div>
                            </div>
                        )}

                        {/* Preview Button */}
                        <button
                            onClick={onPreviewRoute}
                            className="w-full group rounded-full text-white font-bold py-3 sm:py-3.5 px-4 flex items-center justify-center gap-2.5 transition-all overflow-hidden relative shadow-[0_4px_15px_rgba(245,158,11,0.3)] hover:shadow-[0_4px_25px_rgba(245,158,11,0.5)] bg-gradient-to-r from-amber-500 to-amber-600"
                        >
                            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <Map size={18} className="text-white drop-shadow-sm" />
                            <span className="uppercase tracking-wider text-sm drop-shadow-sm">Preview Route</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
