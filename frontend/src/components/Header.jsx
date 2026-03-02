import { useNavigate } from 'react-router-dom';

export default function Header({ rightElement }) {
    const navigate = useNavigate();

    return (
        <div className="h-[72px] flex items-center justify-between px-5 border-b border-white/5 shrink-0 bg-[#0A0F1E]/60 backdrop-blur-2xl sticky top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
            <div
                className="flex items-center gap-[12px] cursor-pointer group"
                onClick={() => navigate('/')}
            >
                <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-accent/30 blur-xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-500 mix-blend-screen" />
                    <img
                        src="/logo2_nobg.png"
                        alt="RouteEasy Icon"
                        className="w-[42px] h-[42px] object-contain relative z-10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6"
                        style={{ filter: 'drop-shadow(0 0 12px rgba(245,158,11,0.5))' }}
                    />
                </div>
                <div className="flex flex-col justify-center translate-y-[1px]">
                    <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="text-[24px] leading-none flex items-baseline tracking-tight">
                        <span className="text-white font-extrabold group-hover:text-gray-100 transition-colors">Route</span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600 font-extrabold ml-[1px] group-hover:from-orange-400 group-hover:to-red-500 transition-all duration-500">Easy</span>
                    </div>
                </div>
            </div>
            {rightElement && (
                <div className="flex flex-col items-end justify-center">
                    {rightElement}
                </div>
            )}
        </div>
    );
}
