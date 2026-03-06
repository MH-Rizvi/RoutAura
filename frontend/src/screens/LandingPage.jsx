/**
 * LandingPage.jsx — Premium public marketing page with live AI demo.
 * Uses the project's amber/gold (#F59E0B) accent + dark (#0A0F1E) theme.
 */
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendDemoMessage } from '../api/client';

/* ──────────────────────────────────────────────
   SVG ICON COMPONENTS
   ────────────────────────────────────────────── */
const IconChat = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
);
const IconMapPin = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
);
const IconNavigation = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>
);
const IconSparkle = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>
);
const IconSend = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
);
const IconChevron = ({ open }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9" /></svg>
);

/* Feature SVG icons — minimal stroke style */
const IconBrain = () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a4 4 0 0 1 4 4c0 1.1-.9 2-2 2" /><path d="M12 2a4 4 0 0 0-4 4c0 1.1.9 2 2 2" /><path d="M16 6a4 4 0 0 1 2 7" /><path d="M8 6a4 4 0 0 0-2 7" /><path d="M18 13a4 4 0 0 1-1.5 5.5" /><path d="M6 13a4 4 0 0 0 1.5 5.5" /><path d="M12 22v-6" /><path d="M12 8v2" /><circle cx="12" cy="12" r="1" /></svg>
);
const IconLayers = () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>
);
const IconHistory = () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /><path d="M4.93 4.93l2.83 2.83" /></svg>
);
const IconNavArrow = () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>
);
const IconWifiOff = () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23" /><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" /><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" /><path d="M10.71 5.05A16 16 0 0 1 22.56 9" /><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><line x1="12" y1="20" x2="12.01" y2="20" /></svg>
);
const IconBarChart = () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
);


/* ──────────────────────────────────────────────
   DEMO CHAT WIDGET (lives inside the hero)
   ────────────────────────────────────────────── */
function DemoChat({ onRequiresAuth }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const scrollRef = useRef(null);

    const CHIPS = [
        'Morning school run',
        'From depot to Oak Avenue',
        'My usual Monday route',
    ];

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, loading]);

    const send = async (text) => {
        if (!text.trim() || loading) return;
        const userMsg = { role: 'user', content: text.trim() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        const newHistory = [...history, userMsg];

        try {
            const data = await sendDemoMessage(text.trim(), newHistory);

            if (data.requires_auth) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
                onRequiresAuth();
                return;
            }

            const assistantMsg = { role: 'assistant', content: data.reply, stops: data.stops || [] };
            setMessages(prev => [...prev, assistantMsg]);
            setHistory([...newHistory, { role: 'assistant', content: data.reply }]);
        } catch (err) {
            const errMsg = err.response?.status === 429
                ? 'Demo limit reached — sign up for unlimited access!'
                : 'Something went wrong. Try again.';
            setMessages(prev => [...prev, { role: 'assistant', content: errMsg }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-[680px] mx-auto rounded-3xl border border-white/[0.08] bg-surface/80 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.6),0_0_40px_rgba(245,158,11,0.1)] overflow-hidden flex flex-col transition-shadow duration-500 hover:shadow-[0_20px_80px_rgba(0,0,0,0.6),0_0_60px_rgba(245,158,11,0.2)]" style={{ height: 'min(500px, 60vh)' }}>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.02]">
                <div className="w-9 h-9 rounded-full bg-white/[0.05] border border-white/[0.1] flex items-center justify-center overflow-hidden shadow-lg shadow-amber-500/10">
                    <img src="/logo3_nobg.png" alt="AI Agent" className="w-[140%] h-[140%] max-w-none object-cover rounded-full" />
                </div>
                <div>
                    <p className="text-white text-[13px] font-semibold tracking-tight">Routigo AI Agent</p>
                    <p className="text-emerald-400 text-[11px] flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" /> Online</p>
                </div>
            </div>

            {/* Messages area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 hide-scrollbar">
                {messages.length === 0 && (
                    <div className="text-center pt-6">
                        <p className="text-white/40 text-[13px] mb-4">Try asking the AI agent:</p>
                        <div className="flex flex-wrap justify-center gap-2">
                            {CHIPS.map(chip => (
                                <button
                                    key={chip}
                                    onClick={() => send(chip)}
                                    className="px-3.5 py-2 rounded-full bg-white/[0.06] border border-white/[0.08] text-white/70 text-[12px] hover:bg-amber-600/20 hover:border-amber-500/30 hover:text-white transition-all duration-200 cursor-pointer"
                                >
                                    {chip}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed whitespace-pre-wrap ${msg.role === 'user'
                            ? 'bg-amber-600 text-white rounded-br-md'
                            : 'bg-white/[0.06] text-white/90 rounded-bl-md border border-white/[0.06]'
                            }`}>
                            {msg.content}
                            {msg.stops?.length > 0 && (
                                <button
                                    onClick={() => onRequiresAuth()}
                                    className="mt-3 w-full py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-white text-[12px] font-bold hover:brightness-110 transition-all active:scale-95"
                                >
                                    Preview Route →
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white/[0.06] border border-white/[0.06] px-4 py-3 rounded-2xl rounded-bl-md">
                            <div className="flex gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-amber-400/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-2 h-2 rounded-full bg-amber-400/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-2 h-2 rounded-full bg-amber-400/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-center gap-2 px-4 py-3 border-t border-white/[0.06] bg-white/[0.02]">
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Describe your route..."
                    className="flex-1 bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-2.5 text-[13px] text-white placeholder-white/30 outline-none focus:border-amber-500/40 transition-colors"
                    disabled={loading}
                />
                <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center text-white disabled:opacity-30 hover:bg-amber-500 transition-colors active:scale-90 shrink-0"
                >
                    <IconSend />
                </button>
            </form>
        </div>
    );
}


/* ──────────────────────────────────────────────
   SIGNUP GATE MODAL
   ────────────────────────────────────────────── */
function SignupGateModal({ onClose }) {
    const navigate = useNavigate();
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-surface border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="w-16 h-16 rounded-full bg-white/[0.03] border border-white/[0.08] flex items-center justify-center overflow-hidden mx-auto mb-5 shadow-lg shadow-amber-500/10">
                    <img src="/logo3_nobg.png" alt="AI Agent" className="w-[140%] h-[140%] max-w-none object-cover rounded-full drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]" />
                </div>
                <h3 className="text-white text-xl font-bold mb-2">Create a free account</h3>
                <p className="text-white/50 text-sm mb-6 leading-relaxed">Save your routes, launch in Google Maps, and get unlimited AI access.</p>
                <button
                    onClick={() => navigate('/login')}
                    className="w-full py-3.5 rounded-2xl bg-accent text-base font-bold text-[15px] hover:brightness-110 transition-colors active:scale-95 mb-3"
                >
                    Sign Up Free
                </button>
                <button
                    onClick={() => navigate('/login')}
                    className="w-full py-3 rounded-2xl bg-white/[0.05] border border-white/10 text-white/70 font-medium text-[14px] hover:bg-white/[0.08] transition-colors"
                >
                    I already have an account
                </button>
            </div>
        </div>
    );
}


/* ──────────────────────────────────────────────
   FAQ ACCORDION / FLIP CARD
   ────────────────────────────────────────────── */
function FAQItem({ q, a }) {
    const [open, setOpen] = useState(false);
    return (
        <>
            {/* Mobile / Tablet: Accordion */}
            <div className="lg:hidden rounded-3xl border border-white/[0.06] bg-white/[0.02] overflow-hidden transition-all duration-300 hover:border-amber-500/20 hover:bg-white/[0.04] mb-4">
                <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-6 sm:p-8 text-left group">
                    <span className="text-white text-[16px] sm:text-[18px] font-medium pr-4 group-hover:text-accent transition-colors">{q}</span>
                    <div className="w-8 h-8 rounded-full bg-white/[0.05] flex items-center justify-center shrink-0 group-hover:bg-amber-500/10 transition-colors">
                        <IconChevron open={open} />
                    </div>
                </button>
                <div className={`overflow-hidden transition-all duration-500 ${open ? 'max-h-64 pb-8 px-6 sm:px-8 opacity-100' : 'max-h-0 px-6 sm:px-8 opacity-0'}`}>
                    <p className="text-white/50 text-[15px] leading-relaxed">{a}</p>
                </div>
            </div>

            {/* Desktop: Flash Card */}
            <div
                className={`hidden lg:block relative w-full h-56 cursor-pointer perspective-1000 ${!open ? 'group' : ''}`}
                onClick={() => setOpen(!open)}
            >
                <div className={`relative w-full h-full transition-all duration-700 transform-style-3d rounded-3xl ${open ? 'rotate-y-180' : 'group-hover:-translate-y-1 group-hover:shadow-[0_15px_40px_rgba(245,158,11,0.15)]'}`}>
                    {/* Front */}
                    <div className="absolute inset-0 backface-hidden rounded-3xl border border-white/[0.06] border-t-amber-500/40 bg-white/[0.02] p-8 flex flex-col items-center justify-center group-hover:border-amber-500/30 group-hover:bg-amber-500/[0.03] transition-colors shadow-lg overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center text-[160px] font-black text-amber-500/[0.06] pointer-events-none select-none">
                            ?
                        </div>
                        <span className="text-white text-[20px] font-bold text-center relative z-10 group-hover:text-accent transition-colors leading-tight px-4">{q}</span>
                        <span className="absolute bottom-5 text-amber-500/40 text-[11px] font-bold tracking-widest uppercase">Tap to reveal</span>
                    </div>
                    {/* Back */}
                    <div className="absolute inset-0 backface-hidden rounded-3xl border border-amber-500/30 bg-[#161008] p-8 flex flex-col items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.05)] rotate-y-180">
                        <div className="absolute top-5 right-5 text-amber-500">
                            <IconSparkle />
                        </div>
                        <p className="text-white/90 text-[16px] leading-relaxed text-center">{a}</p>
                    </div>
                </div>
            </div>
        </>
    );
}


/* ──────────────────────────────────────────────
   SCROLL ANIMATION WRAPPER
   ────────────────────────────────────────────── */
function RevealOnScroll({ children, className = '', activeClass = 'reveal-fade-up', delay = 0 }) {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const currentRef = ref.current;
        if (!currentRef) return;

        // Check if element is already in the viewport on mount
        const rect = currentRef.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            setIsVisible(true);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(currentRef);
                }
            },
            {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            }
        );

        observer.observe(currentRef);

        return () => {
            if (currentRef) observer.unobserve(currentRef);
        };
    }, []);

    // On mobile (< 768px), cap stagger delay at 100ms
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const effectiveDelay = isMobile ? Math.min(delay, 100) : delay;

    return (
        <div
            ref={ref}
            className={`reveal-base ${activeClass} ${isVisible ? 'is-revealed' : ''} ${className}`}
            style={{ transitionDelay: `${effectiveDelay}ms` }}
        >
            {children}
        </div>
    );
}


/* ──────────────────────────────────────────────
   MAIN LANDING PAGE
   ────────────────────────────────────────────── */
export default function LandingPage() {
    const navigate = useNavigate();
    const [showGateModal, setShowGateModal] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const FEATURES = [
        { icon: <IconBrain />, title: 'LangChain AI Agent', desc: 'Reasons through your request step by step using the ReAct architecture.' },
        { icon: <IconLayers />, title: 'Semantic Memory', desc: "Remembers your stops. Say \"the co-op\" and it knows exactly where you mean." },
        { icon: <IconHistory />, title: 'RAG Trip History', desc: 'Ask "have I been to Oak Ave before?" and get a real answer from your history.' },
        { icon: <IconNavArrow />, title: 'One-Tap Navigation', desc: 'Opens Google Maps or Apple Maps with all stops pre-loaded, ready to drive.' },
        { icon: <IconWifiOff />, title: 'Works Offline', desc: 'Saved trips available even without signal. Perfect for tunnels and rural areas.' },
        { icon: <IconBarChart />, title: 'Driving Stats', desc: 'Track your daily and weekly mileage, trip count, and driving patterns over time.' },
    ];

    const FAQ = [
        { q: 'Is Routigo free to use?', a: 'Yes, sign up free. No credit card needed.' },
        { q: 'Do I need to type exact addresses?', a: 'No. Just describe stops in plain language like "the school on Oak Avenue" — the AI figures it out.' },
        { q: 'Does it work on my phone?', a: 'Yes. Routigo is a Progressive Web App — add it to your home screen for a native app experience on iOS and Android.' },
        { q: 'What if I drive the same route every day?', a: 'Save it once, re-launch it in one tap. The AI also recognises it if you just say "my usual morning run."' },
        { q: 'Is my data private?', a: 'Yes. All your trips and history are private to your account and never shared.' },
    ];

    return (
        <div className="min-h-screen bg-base text-white overflow-x-hidden">

            {/* ═══ NAVBAR ═══ */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 pt-[max(env(safe-area-inset-top),0px)] ${scrolled ? 'bg-base/90 backdrop-blur-xl border-b border-white/[0.06] shadow-lg' : ''}`}>
                <div className="max-w-6xl mx-auto px-5 sm:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center border border-white/[0.1] shadow-lg shadow-amber-500/20 bg-white/[0.03] group-hover:scale-105 group-hover:rotate-6 transition-transform duration-500">
                            <img src="/logo3_nobg.png" alt="Routigo" className="w-[140%] h-[140%] max-w-none object-cover rounded-full" />
                        </div>
                        <span className="text-accent font-bold text-2xl tracking-tight">Routigo</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate('/login')} className="hidden sm:block text-white/60 hover:text-white text-[13px] font-medium transition-colors px-3 py-2">
                            Sign In
                        </button>
                        <button onClick={() => navigate('/login')} className="px-5 py-2.5 rounded-xl bg-accent text-base text-[13px] font-bold hover:brightness-110 transition-all active:scale-95 shadow-lg shadow-amber-500/20">
                            Get Started Free
                        </button>
                    </div>
                </div>
            </nav>


            {/* ═══ HERO ═══ */}
            <section className="relative pt-[calc(112px+max(env(safe-area-inset-top),0px))] lg:pt-[calc(160px+max(env(safe-area-inset-top),0px))] pb-10 lg:pb-16 px-5 sm:px-8 bg-[#0a0f1a] overflow-hidden">
                {/* Background effects */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {/* Road SVG Background */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[10%] w-[800px] h-[800px] opacity-30 mix-blend-screen pointer-events-none" style={{ perspective: '1000px' }}>
                        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ transform: 'rotateX(60deg)' }}>
                            <path d="M 40 0 L 0 100 L 100 100 L 60 0 Z" fill="#050810" />
                            <path d="M 50 0 L 50 100" stroke="#F59E0B" strokeWidth="0.5" strokeDasharray="4 4" fill="none" opacity="0.6" />
                            <path d="M 40 0 L 0 100" stroke="#111827" strokeWidth="1" fill="none" />
                            <path d="M 60 0 L 100 100" stroke="#111827" strokeWidth="1" fill="none" />
                        </svg>
                        {/* Fake glowing horizon */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-1 bg-amber-500/50 shadow-[0_0_50px_20px_rgba(245,158,11,0.2)] rounded-full blur-md" />
                    </div>

                    <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-amber-500/[0.06] rounded-full blur-[120px]" />
                    <div className="absolute top-40 left-1/4 w-[400px] h-[400px] bg-amber-600/[0.04] rounded-full blur-[100px]" />
                    <div className="absolute top-60 right-1/4 w-[300px] h-[300px] bg-amber-400/[0.03] rounded-full blur-[80px]" />
                </div>

                <div className="relative max-w-[1200px] mx-auto z-10">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-amber-500/5 rounded-full blur-[100px] -z-10" />
                    {/* Badge */}
                    <RevealOnScroll className="flex justify-center mb-6">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[12px] font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            Powered by LangChain ReAct Agent
                        </div>
                    </RevealOnScroll>

                    {/* Headline */}
                    <RevealOnScroll delay={100} className="mb-5">
                        <h1 className="text-center text-[clamp(32px,6vw,64px)] font-extrabold leading-[1.08] tracking-tight">
                            <span className="bg-gradient-to-b from-white via-white to-white/50 bg-clip-text text-transparent">Describe your route.</span>
                            <br />
                            <span className="bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 bg-clip-text text-transparent">Drive in seconds.</span>
                        </h1>
                    </RevealOnScroll>

                    <RevealOnScroll delay={200} className="mb-10">
                        <p className="text-center text-white/45 text-[clamp(15px,2vw,18px)] max-w-lg mx-auto leading-relaxed">
                            Tell the AI where you need to go in plain English.<br className="hidden sm:block" /> It geocodes every stop and launches Google Maps — instantly.
                        </p>
                    </RevealOnScroll>

                    {/* Demo Chat Widget */}
                    <RevealOnScroll delay={300}>
                        <DemoChat onRequiresAuth={() => setShowGateModal(true)} />
                    </RevealOnScroll>
                </div>
            </section>


            {/* ═══ HOW IT WORKS ═══ */}
            <section className="py-20 lg:py-32 px-5 sm:px-8 relative bg-[#0d1220] transition-colors duration-1000">
                <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a] via-transparent to-[#0d1020] pointer-events-none" />
                <div className="max-w-[1200px] mx-auto relative">
                    <RevealOnScroll>
                        <h2 className="text-center text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 tracking-tight">How it works</h2>
                    </RevealOnScroll>
                    <RevealOnScroll delay={100}>
                        <p className="text-center text-white/40 text-base sm:text-lg mb-16 lg:mb-24">Three steps to your next route.</p>
                    </RevealOnScroll>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-[52px] lg:top-[60px] left-[15%] right-[15%] h-[2px] border-t-2 border-dashed border-white/[0.1] -z-10" />

                        {[
                            { step: '01', icon: <IconChat />, title: 'Describe your route', desc: 'Type or speak where you need to go — no addresses required.' },
                            { step: '02', icon: <IconMapPin />, title: 'AI resolves stops', desc: 'The agent geocodes each stop and checks your semantic memory.' },
                            { step: '03', icon: <IconNavigation />, title: 'Launch navigation', desc: 'One tap to open Google Maps with every stop pre-loaded.' },
                        ].map((item, i) => (
                            <RevealOnScroll key={item.step} delay={i * 150} activeClass="reveal-slide-bottom">
                                <div className="group relative text-center p-8 lg:p-10 rounded-3xl bg-base border border-white/[0.06] hover:border-amber-500/20 hover:bg-white/[0.02] transition-all duration-300">
                                    <div className="w-16 h-16 rounded-2xl bg-base border border-white/[0.08] flex items-center justify-center mx-auto mb-6 relative z-10 group-hover:border-amber-500/30 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(245,158,11,0.2)] transition-all duration-300">
                                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent rounded-2xl" />
                                        <div className="text-amber-400 relative z-10">{item.icon}</div>
                                    </div>
                                    <div className="inline-block px-3 py-1 mb-4 rounded-full bg-amber-500/10 text-amber-400 text-[12px] font-bold tracking-widest">
                                        STEP {item.step}
                                    </div>
                                    <h3 className="text-white font-semibold text-[18px] lg:text-[20px] mb-3">{item.title}</h3>
                                    <p className="text-white/40 text-[14px] lg:text-[15px] leading-relaxed max-w-[280px] mx-auto">{item.desc}</p>
                                </div>
                            </RevealOnScroll>
                        ))}
                    </div>
                </div>
            </section>


            {/* ═══ FEATURES ═══ */}
            <section className="py-20 lg:py-32 px-5 sm:px-8 relative bg-[#0d1020] transition-colors duration-1000">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a0f1a] pointer-events-none" />
                <div className="max-w-[1200px] mx-auto relative">
                    <RevealOnScroll>
                        <h2 className="text-center text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 tracking-tight">Built for real-world drivers</h2>
                    </RevealOnScroll>
                    <RevealOnScroll delay={100}>
                        <p className="text-center text-white/40 text-base sm:text-lg mb-16 lg:mb-24">Enterprise-grade AI. Dead-simple interface.</p>
                    </RevealOnScroll>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                        {FEATURES.map((f, i) => (
                            <RevealOnScroll key={f.title} delay={i * 100}>
                                <div className="group p-8 lg:p-10 rounded-3xl bg-white/[0.02] border border-white/[0.06] hover:-translate-y-2 hover:border-amber-500/30 hover:shadow-[0_15px_40px_rgba(245,158,11,0.1)] transition-all duration-300 flex flex-col h-full">
                                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 group-hover:bg-amber-500/20 transition-all duration-300">
                                        {f.icon}
                                    </div>
                                    <h3 className="text-white font-bold text-[18px] lg:text-[20px] mb-3">{f.title}</h3>
                                    <p className="text-white/40 text-[15px] leading-relaxed flex-grow">{f.desc}</p>
                                </div>
                            </RevealOnScroll>
                        ))}
                    </div>
                </div>
            </section>


            {/* ═══ COMING SOON ═══ */}
            <section className="py-20 lg:py-32 px-5 sm:px-8 relative bg-[#0b1018] transition-colors duration-1000">
                <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a] via-transparent to-[#0a0f1a] pointer-events-none" />
                <div className="max-w-[1200px] mx-auto relative">
                    <RevealOnScroll>
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[12px] font-medium mb-6 mx-auto block w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            Roadmap
                        </div>
                        <h2 className="text-center text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 tracking-tight">What&apos;s coming next</h2>
                    </RevealOnScroll>
                    <RevealOnScroll delay={100}>
                        <p className="text-center text-white/40 text-base sm:text-lg mb-16 lg:mb-24">Routigo is just getting started.</p>
                    </RevealOnScroll>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                        {/* Card 1 — Right-Side Stop Optimisation */}
                        <RevealOnScroll delay={0} activeClass="reveal-slide-bottom">
                            <div className="group relative p-8 lg:p-10 rounded-3xl bg-white/[0.01] border-2 border-dashed border-amber-500/20 hover:border-amber-500/40 hover:bg-white/[0.02] transition-all duration-300 flex flex-col h-full opacity-90 hover:opacity-100">
                                <div className="w-14 h-14 rounded-2xl bg-amber-500/[0.07] border border-dashed border-amber-500/20 flex items-center justify-center text-amber-400/70 mb-6 group-hover:scale-110 group-hover:text-amber-400 transition-all duration-300">
                                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18" /><path d="M6 6l6 6" /><path d="M18 18h-6v-6" /><path d="M3 12h2M19 12h2M12 3v2M12 19v2" /></svg>
                                </div>
                                <span className="inline-block w-fit px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 text-[11px] font-bold tracking-wider uppercase mb-4 border border-amber-500/20">In Development</span>
                                <h3 className="text-white/90 font-bold text-[18px] lg:text-[20px] mb-3">Right-Side Stop Optimisation</h3>
                                <p className="text-white/35 text-[14px] lg:text-[15px] leading-relaxed flex-grow">For school bus drivers — the AI will automatically detect if a stop is on the left side of the road and suggest an alternative approach so children never have to cross.</p>
                            </div>
                        </RevealOnScroll>

                        {/* Card 2 — Global Expansion */}
                        <RevealOnScroll delay={150} activeClass="reveal-slide-bottom">
                            <div className="group relative p-8 lg:p-10 rounded-3xl bg-white/[0.01] border-2 border-dashed border-amber-500/20 hover:border-amber-500/40 hover:bg-white/[0.02] transition-all duration-300 flex flex-col h-full opacity-90 hover:opacity-100">
                                <div className="w-14 h-14 rounded-2xl bg-amber-500/[0.07] border border-dashed border-amber-500/20 flex items-center justify-center text-amber-400/70 mb-6 group-hover:scale-110 group-hover:text-amber-400 transition-all duration-300">
                                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                                </div>
                                <span className="inline-block w-fit px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 text-[11px] font-bold tracking-wider uppercase mb-4 border border-amber-500/20">Coming Soon</span>
                                <h3 className="text-white/90 font-bold text-[18px] lg:text-[20px] mb-3">Global Expansion</h3>
                                <p className="text-white/35 text-[14px] lg:text-[15px] leading-relaxed flex-grow">Currently optimised for the USA. Coming soon to Pakistan, UAE, Canada, Australia, and the UK — with local geocoding and region-aware routing.</p>
                            </div>
                        </RevealOnScroll>

                        {/* Card 3 — Fleet Management */}
                        <RevealOnScroll delay={300} activeClass="reveal-slide-bottom">
                            <div className="group relative p-8 lg:p-10 rounded-3xl bg-white/[0.01] border-2 border-dashed border-amber-500/20 hover:border-amber-500/40 hover:bg-white/[0.02] transition-all duration-300 flex flex-col h-full opacity-90 hover:opacity-100">
                                <div className="w-14 h-14 rounded-2xl bg-amber-500/[0.07] border border-dashed border-amber-500/20 flex items-center justify-center text-amber-400/70 mb-6 group-hover:scale-110 group-hover:text-amber-400 transition-all duration-300">
                                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="6" width="15" height="10" rx="2" /><path d="M16 10h4l3 3v3h-7V10z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
                                </div>
                                <span className="inline-block w-fit px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 text-[11px] font-bold tracking-wider uppercase mb-4 border border-amber-500/20">Coming Soon</span>
                                <h3 className="text-white/90 font-bold text-[18px] lg:text-[20px] mb-3">Fleet Management</h3>
                                <p className="text-white/35 text-[14px] lg:text-[15px] leading-relaxed flex-grow">Manage multiple drivers and routes from a single dashboard. Assign routes, track launches, and monitor your fleet in real time.</p>
                            </div>
                        </RevealOnScroll>
                    </div>
                </div>
            </section>


            {/* ═══ MOTIVATION / BACKGROUND ═══ */}
            <section className="py-20 lg:py-32 px-5 sm:px-8 relative bg-[#0a0f1a] border-y border-white/[0.06] overflow-hidden">
                <div className="max-w-[1000px] mx-auto relative">
                    <div className="flex flex-col lg:flex-row items-center gap-14 lg:gap-20">
                        <RevealOnScroll activeClass="reveal-slide-left" className="flex-1 text-left">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[12px] font-medium mb-6">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                Our Story
                            </div>
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 tracking-tight">Why we built Routigo.</h2>
                            <p className="text-white/60 text-base lg:text-lg leading-relaxed mb-6">
                                Bus drivers and professional drivers spend minutes every morning doing the same thing — opening Google Maps, searching each stop one by one, and rebuilding the same route they drove yesterday. For a school bus driver with 10 stops, that's wasted time every single day.
                            </p>
                            <p className="text-white/60 text-base lg:text-lg leading-relaxed">
                                Routigo fixes that. Describe your route <strong className="text-amber-500 font-bold">once in plain English</strong> — or just say 'my usual morning run' — and the AI handles the rest. It remembers your stops, recalls your saved routes, and launches Google Maps with everything pre-loaded. One conversation. Zero rebuilding.
                            </p>
                        </RevealOnScroll>
                        <RevealOnScroll activeClass="reveal-slide-right" className="flex-1 w-full relative">
                            <div className="aspect-square w-full max-w-[400px] mx-auto relative rounded-[40px] border border-white/[0.08] bg-surface/80 backdrop-blur-xl shadow-2xl overflow-hidden p-8 flex flex-col justify-between">
                                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent pointer-events-none" />
                                <div className="text-amber-500 mb-6">
                                    <IconBrain />
                                </div>
                                <h3 className="text-2xl font-bold text-white leading-tight mb-4">Less screen time.<br />More drive time.</h3>
                                <div className="text-xl text-white/40 font-mono">print("Let's go.")</div>
                            </div>
                        </RevealOnScroll>
                    </div>
                </div>
            </section>


            {/* ═══ SOCIAL PROOF / STATS ═══ */}
            <section className="py-20 lg:py-32 px-5 sm:px-8 relative bg-[rgba(245,158,11,0.03)] transition-colors duration-1000">
                <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a] to-transparent pointer-events-none" />
                <div className="max-w-[1200px] mx-auto relative">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">

                        {/* Card 1: AI Tools */}
                        <RevealOnScroll className="group relative text-center p-10 lg:p-14 rounded-3xl bg-white/[0.02] border border-white/[0.06] hover:border-amber-500/25 hover:shadow-[0_0_40px_rgba(245,158,11,0.08)] hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col items-center justify-center max-w-full" activeClass="reveal-scale-up">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
                            <div className="text-amber-400/60 mb-6 flex justify-center group-hover:text-amber-400 group-hover:scale-110 transition-all duration-300">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
                            </div>
                            <p className="text-[clamp(48px,6vw,72px)] font-extrabold bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600/60 bg-clip-text text-transparent leading-none mb-4 group-hover:drop-shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all">5</p>
                            <p className="text-white text-[16px] lg:text-[18px] font-bold mb-2">AI Tools</p>
                            <p className="text-white/40 text-[14px] lg:text-[15px] leading-relaxed max-w-[250px]">Geocoding, semantic search, trip recall, history retrieval, RAG</p>
                        </RevealOnScroll>

                        {/* Card 2: Response Time */}
                        <RevealOnScroll delay={100} className="group relative text-center p-10 lg:p-14 rounded-3xl bg-white/[0.02] border border-white/[0.06] hover:border-amber-500/25 hover:shadow-[0_0_40px_rgba(245,158,11,0.08)] hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col items-center justify-center max-w-full" activeClass="reveal-scale-up">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
                            <div className="text-amber-400/60 mb-6 flex justify-center group-hover:text-amber-400 group-hover:scale-110 transition-all duration-300">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                            </div>
                            <p className="text-[clamp(48px,6vw,72px)] font-extrabold bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600/60 bg-clip-text text-transparent leading-none mb-4 group-hover:drop-shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all">&lt; 8s</p>
                            <p className="text-white text-[16px] lg:text-[18px] font-bold mb-2">Response Time</p>
                            <p className="text-white/40 text-[14px] lg:text-[15px] leading-relaxed max-w-[250px]">Average agent reasoning chain completion</p>
                        </RevealOnScroll>

                        {/* Card 3: Time to first route */}
                        <RevealOnScroll delay={200} className="group relative text-center p-10 lg:p-14 rounded-3xl bg-white/[0.02] border border-white/[0.06] hover:border-amber-500/25 hover:shadow-[0_0_40px_rgba(245,158,11,0.08)] hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col items-center justify-center max-w-full" activeClass="reveal-scale-up">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
                            <div className="text-amber-400/60 mb-6 flex justify-center group-hover:text-amber-400 group-hover:scale-110 transition-all duration-300">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                            </div>
                            <p className="text-[clamp(48px,6vw,72px)] font-extrabold bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600/60 bg-clip-text text-transparent leading-none mb-4 group-hover:drop-shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all">2 min</p>
                            <p className="text-white text-[16px] lg:text-[18px] font-bold mb-2">To Plan Your First Route</p>
                            <p className="text-white/40 text-[14px] lg:text-[15px] leading-relaxed max-w-[250px]">From sign up to navigating your first route in under 2 minutes</p>
                        </RevealOnScroll>

                    </div>
                </div>
            </section>


            {/* ═══ FAQ ═══ */}
            <section className="py-20 lg:py-32 px-5 sm:px-8 relative bg-[#0e121d] transition-colors duration-1000">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a0e16] pointer-events-none" />
                <div className="max-w-[1200px] mx-auto relative">
                    <RevealOnScroll>
                        <h2 className="text-center text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 tracking-tight">Questions?</h2>
                    </RevealOnScroll>
                    <RevealOnScroll delay={100}>
                        <p className="text-center text-white/40 text-base sm:text-lg mb-16 lg:mb-24">Everything you need to know.</p>
                    </RevealOnScroll>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 items-start">
                        <div className="flex flex-col lg:gap-8">
                            {FAQ.slice(0, 2).map((item, i) => (
                                <RevealOnScroll key={item.q} delay={i * 100} activeClass="reveal-slide-bottom">
                                    <FAQItem q={item.q} a={item.a} />
                                </RevealOnScroll>
                            ))}
                        </div>
                        <div className="flex flex-col lg:gap-8">
                            {FAQ.slice(2, 4).map((item, i) => (
                                <RevealOnScroll key={item.q} delay={(i + 1) * 100} activeClass="reveal-slide-bottom">
                                    <FAQItem q={item.q} a={item.a} />
                                </RevealOnScroll>
                            ))}
                        </div>
                        <div className="lg:col-span-2 mt-0 lg:mt-0">
                            <RevealOnScroll delay={300} activeClass="reveal-slide-bottom">
                                <FAQItem q={FAQ[4].q} a={FAQ[4].a} />
                            </RevealOnScroll>
                        </div>
                    </div>
                </div>
            </section>


            {/* ═══ CTA BAND ═══ */}
            <section className="py-20 px-5 sm:px-8 relative bg-[#0c1018] border-t border-white/[0.04]">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/[0.05] to-transparent pointer-events-none" />
                <div className="max-w-xl mx-auto text-center relative">
                    <RevealOnScroll>
                        <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to try it?</h2>
                        <p className="text-white/40 text-sm mb-8">Free forever. No credit card. Set up in 30 seconds.</p>
                        <button
                            onClick={() => navigate('/login')}
                            className="px-8 py-4 rounded-2xl bg-accent text-base font-bold text-[16px] hover:brightness-110 transition-all active:scale-95 shadow-[0_0_30px_rgba(245,158,11,0.4)]"
                        >
                            Get Started Free →
                        </button>
                    </RevealOnScroll>
                </div>
            </section>


            {/* ═══ FOOTER ═══ */}
            <footer className="border-t border-white/[0.06] py-12 px-5 sm:px-8 bg-[#060a10]">
                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-10">
                        {/* Brand */}
                        <div>
                            <div className="flex items-center gap-3 mb-4 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                                <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center border border-white/[0.1] shadow-[0_0_15px_rgba(245,158,11,0.15)] bg-white/[0.03] group-hover:scale-105 transition-transform duration-500">
                                    <img src="/logo3_nobg.png" alt="Routigo" className="w-[140%] h-[140%] max-w-none object-cover rounded-full" />
                                </div>
                                <span className="text-accent font-bold text-2xl">Routigo</span>
                            </div>
                            <p className="text-white/30 text-[13px] leading-relaxed">AI-powered routing for drivers.<br />Describe your route. Drive in seconds.</p>
                        </div>

                        {/* Links 1 */}
                        <div>
                            <h4 className="text-white/60 text-[11px] font-bold tracking-widest uppercase mb-4">Product</h4>
                            <ul className="space-y-2.5">
                                <li><button onClick={() => navigate('/login')} className="text-white/40 text-[13px] hover:text-white transition-colors">Sign In</button></li>
                                <li><button onClick={() => navigate('/login')} className="text-white/40 text-[13px] hover:text-white transition-colors">Sign Up</button></li>
                                <li><a href="#how" className="text-white/40 text-[13px] hover:text-white transition-colors">How it works</a></li>
                            </ul>
                        </div>

                        {/* Links 2 */}
                        <div>
                            <h4 className="text-white/60 text-[11px] font-bold tracking-widest uppercase mb-4">Built With</h4>
                            <ul className="space-y-2.5">
                                <li><span className="text-white/40 text-[13px]">LangChain</span></li>
                                <li><span className="text-white/40 text-[13px]">ChromaDB</span></li>
                                <li><span className="text-white/40 text-[13px]">Groq AI</span></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-white/[0.06] pt-6 text-center">
                        <p className="text-white/20 text-[12px]">© 2026 Routigo. Built for drivers, powered by AI.</p>
                    </div>
                </div>
            </footer>


            {/* ═══ SIGNUP GATE MODAL ═══ */}
            {showGateModal && <SignupGateModal onClose={() => setShowGateModal(false)} />}
        </div>
    );
}
