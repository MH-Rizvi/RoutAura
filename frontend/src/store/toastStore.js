import { create } from 'zustand';

const useToastStore = create((set, get) => ({
    message: '',
    type: 'info', // 'success', 'error', 'info'
    isVisible: false,
    timeoutId: null,

    showToast: (message, type = 'info') => {
        const currentTimeout = get().timeoutId;
        if (currentTimeout) {
            clearTimeout(currentTimeout);
        }

        const newTimeoutId = setTimeout(() => {
            set({ isVisible: false });
        }, 3000);

        set({
            message,
            type,
            isVisible: true,
            timeoutId: newTimeoutId,
        });
    },

    hideToast: () => {
        const currentTimeout = get().timeoutId;
        if (currentTimeout) {
            clearTimeout(currentTimeout);
        }
        set({ isVisible: false, timeoutId: null });
    }
}));

export default useToastStore;
