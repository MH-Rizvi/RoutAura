import React, { useEffect, useState } from 'react';
import useToastStore from '../store/toastStore';

export default function Toast() {
    const { message, type, isVisible, hideToast } = useToastStore();
    const [render, setRender] = useState(isVisible);

    // Handle out-animation
    useEffect(() => {
        if (isVisible) {
            setRender(true);
        } else {
            const timer = setTimeout(() => setRender(false), 300); // 300ms transition time
            return () => clearTimeout(timer);
        }
    }, [isVisible]);

    if (!render) return null;

    const bgColors = {
        success: 'bg-green-600',
        error: 'bg-red-600',
        info: 'bg-blue-600',
    };

    const icons = {
        success: '✅',
        error: '⚠️',
        info: '🚌',
    };

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-11/12 max-w-sm pointer-events-none">
            <div
                className={`flex items-center justify-between px-4 py-3 rounded-xl shadow-lg text-white pointer-events-auto transition-all duration-300 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
                    } ${bgColors[type] || bgColors.info}`}
                role="alert"
            >
                <div className="flex items-center gap-3">
                    <span className="text-xl" aria-hidden="true">{icons[type] || icons.info}</span>
                    <span className="font-medium text-[15px] leading-tight">{message}</span>
                </div>
                <button
                    onClick={hideToast}
                    className="ml-4 p-1 rounded-full opacity-80 hover:opacity-100 hover:bg-white/20 transition-all active:scale-95"
                    aria-label="Close notification"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
