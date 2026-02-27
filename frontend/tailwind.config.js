/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './index.html',
        './src/**/*.{js,jsx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: '#2563EB',
                success: '#16A34A',
                danger: '#DC2626',
                background: '#F9FAFB',
                card: '#FFFFFF',
                body: '#111827',
                secondary: '#6B7280',
            },
            fontSize: {
                // Enforce minimum 16px body text
                base: ['16px', '24px'],
                lg: ['18px', '28px'],
                xl: ['20px', '30px'],
            },
            minWidth: {
                touch: '48px',
            },
            minHeight: {
                touch: '48px',
            },
        },
    },
    plugins: [],
};
