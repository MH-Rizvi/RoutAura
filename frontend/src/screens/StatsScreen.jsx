import React, { useState, useEffect, useMemo } from 'react';
import { getStatsSummary, getStatsDaily } from '../api/client';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

// Helper to format date "YYYY-MM-DD" to "Mar 1"
const formatDateString = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function StatsScreen() {
    const [summary, setSummary] = useState(null);
    const [dailyLogs, setDailyLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [daysRange, setDaysRange] = useState(30);

    useEffect(() => {
        let isMounted = true;

        async function fetchStats() {
            setLoading(true);
            setError('');
            try {
                // Fetch summary and max daily logs simultaneously
                const [summaryData, dailyData] = await Promise.all([
                    getStatsSummary(),
                    getStatsDaily(30)
                ]);

                if (isMounted) {
                    setSummary(summaryData);
                    setDailyLogs(dailyData);
                }
            } catch (err) {
                if (isMounted) {
                    setError('Failed to load your stats. Please try again later.');
                    console.error("Stats fetch error:", err);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        fetchStats();
        return () => { isMounted = false; };
    }, []);

    const chartData = useMemo(() => {
        if (!dailyLogs || dailyLogs.length === 0) return [];
        // Slice the last N days safely
        const startIndex = Math.max(0, dailyLogs.length - daysRange);
        return dailyLogs.slice(startIndex).map(d => ({
            ...d,
            formattedDate: formatDateString(d.date)
        }));
    }, [dailyLogs, daysRange]);

    const isCompletelyEmpty = useMemo(() => {
        if (!summary) return true;
        return summary.total_trips === 0;
    }, [summary]);

    // Format numbers safely
    const formatMiles = (val) => (val || 0).toFixed(1);
    const formatInt = (val) => (val || 0).toLocaleString();

    if (loading) {
        return (
            <div className="flex-1 overflow-y-auto bg-bg-app p-4 sm:p-6 lg:p-8 animate-pulse">
                <div className="h-8 w-48 bg-surface border border-border rounded-xl mb-6"></div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="rounded-2xl h-24" style={{ background: 'rgba(30,41,59,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}></div>
                    <div className="rounded-2xl h-24" style={{ background: 'rgba(30,41,59,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}></div>
                    <div className="rounded-2xl h-24" style={{ background: 'rgba(30,41,59,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}></div>
                    <div className="rounded-2xl h-24" style={{ background: 'rgba(30,41,59,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}></div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="rounded-2xl h-20" style={{ background: 'rgba(30,41,59,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}></div>
                    <div className="rounded-2xl h-20" style={{ background: 'rgba(30,41,59,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}></div>
                </div>
                <div className="rounded-3xl h-64" style={{ background: 'rgba(30,41,59,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 flex items-center justify-center p-6 bg-bg-app">
                <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-text-primary font-medium">{error}</p>
                </div>
            </div>
        );
    }

    if (isCompletelyEmpty) {
        return (
            <div className="flex-1 flex items-center justify-center p-6 bg-bg-app">
                <div className="text-center max-w-sm">
                    <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6" style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(245,158,11,0.15)', boxShadow: '0 0 20px rgba(245,158,11,0.08)' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
                            <line x1="18" y1="20" x2="18" y2="10" />
                            <line x1="12" y1="20" x2="12" y2="4" />
                            <line x1="6" y1="20" x2="6" y2="14" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-semibold text-text-primary mb-2">No Stats Yet</h2>
                    <p className="text-text-muted">Start driving to see your stats here.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto bg-bg-app p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto w-full">
            <header className="pt-2 animate-fade-up">
                <h1 className="text-2xl font-bold tracking-tight text-text-primary">Dashboard</h1>
            </header>

            {/* 2x2 Grid for Core Period Stats */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="animate-fade-up" style={{ animationDelay: '50ms' }}><StatCard label="Trips Today" value={formatInt(summary?.trips_today)} /></div>
                <div className="animate-fade-up" style={{ animationDelay: '100ms' }}><StatCard label="Trips This Week" value={formatInt(summary?.trips_this_week)} /></div>
                <div className="animate-fade-up" style={{ animationDelay: '150ms' }}><StatCard label="Miles Today" value={formatMiles(summary?.miles_today)} suffix="mi" /></div>
                <div className="animate-fade-up" style={{ animationDelay: '200ms' }}><StatCard label="Miles This Week" value={formatMiles(summary?.miles_this_week)} suffix="mi" /></div>
            </div>

            {/* Lifetime Stats */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="animate-fade-up" style={{ animationDelay: '250ms' }}><StatCard label="Lifetime Trips" value={formatInt(summary?.total_trips)} isSecondary /></div>
                <div className="animate-fade-up" style={{ animationDelay: '300ms' }}><StatCard label="Lifetime Miles" value={formatMiles(summary?.miles_all_time)} suffix="mi" isSecondary /></div>
            </div>

            {/* Chart Section */}
            <div className="rounded-3xl p-4 sm:p-6 overflow-hidden animate-fade-up" style={{ background: 'linear-gradient(135deg, rgba(30,41,59,0.4) 0%, rgba(13,17,23,0.7) 100%)', border: '1px solid rgba(245,158,11,0.1)', boxShadow: '0 0 20px rgba(0,0,0,0.3)', animationDelay: '400ms' }}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-base font-semibold text-text-primary">Daily Miles Driven</h2>
                    <div className="flex rounded-xl p-1 shrink-0" style={{ background: 'rgba(10,15,30,0.5)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <button
                            onClick={() => setDaysRange(7)}
                            className={`min-w-touch px-3 py-1 text-xs font-medium rounded-lg transition-all ${daysRange === 7 ? 'text-text-primary' : 'text-text-muted hover:text-text-secondary'}`}
                            style={daysRange === 7 ? { background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', boxShadow: '0 0 8px rgba(245,158,11,0.1)' } : {}}
                        >
                            7 Days
                        </button>
                        <button
                            onClick={() => setDaysRange(30)}
                            className={`min-w-touch px-3 py-1 text-xs font-medium rounded-lg transition-all ${daysRange === 30 ? 'text-text-primary' : 'text-text-muted hover:text-text-secondary'}`}
                            style={daysRange === 30 ? { background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', boxShadow: '0 0 8px rgba(245,158,11,0.1)' } : {}}
                        >
                            30 Days
                        </button>
                    </div>
                </div>

                <div className="h-64 w-full -ml-4 sm:m-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                            <XAxis
                                dataKey="formattedDate"
                                stroke="#8B949E"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                dy={10}
                            />
                            <YAxis
                                stroke="#8B949E"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(val) => `${val}`}
                                dx={-10}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(30,41,59,0.95)',
                                    borderColor: 'rgba(245,158,11,0.2)',
                                    borderRadius: '12px',
                                    color: 'var(--text-primary)',
                                    boxShadow: '0 0 20px rgba(0,0,0,0.4), 0 0 10px rgba(245,158,11,0.05)',
                                    backdropFilter: 'blur(8px)'
                                }}
                                itemStyle={{ color: '#F59E0B', fontWeight: 'bold' }}
                                labelStyle={{ color: 'var(--text-muted)', marginBottom: '4px' }}
                                cursor={{ stroke: 'rgba(245,158,11,0.3)', strokeWidth: 2, strokeDasharray: '4 4' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="miles"
                                stroke="#F59E0B"
                                strokeWidth={3}
                                dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4, stroke: 'rgba(13,17,23,0.9)' }}
                                activeDot={{ r: 6, stroke: 'rgba(13,17,23,0.9)', strokeWidth: 2, fill: '#FBBF24' }}
                                animationDuration={1000}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Bottom padding to ensure content isn't swallowed by safe-area-bottom in extreme heights */}
            <div className="h-6 w-full"></div>
        </div>
    );
}

function StatCard({ label, value, suffix, isSecondary }) {
    return (
        <div
            className="flex flex-col p-4 rounded-2xl amber-top-line"
            style={isSecondary
                ? { background: 'rgba(10,15,30,0.4)', border: '1px solid rgba(255,255,255,0.04)' }
                : { background: 'linear-gradient(135deg, rgba(30,41,59,0.4) 0%, rgba(13,17,23,0.7) 100%)', border: '1px solid rgba(245,158,11,0.1)' }
            }
        >
            <span className="text-text-muted text-xs font-medium uppercase tracking-wider mb-2 line-clamp-1">{label}</span>
            <div className="flex items-baseline gap-1 mt-auto">
                <span className={`text-2xl sm:text-3xl tracking-tight font-semibold ${isSecondary ? 'text-text-secondary' : 'text-text-primary'}`}>{value}</span>
                {suffix && <span className="text-text-muted text-sm font-medium">{suffix}</span>}
            </div>
        </div>
    );
}
