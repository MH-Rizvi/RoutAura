/**
 * LLMLogsScreen.jsx — LLMOps dashboard.
 *
 * Table of llm_logs with summary row: total calls, total tokens,
 * average latency, success rate. Demonstrates observability.
 */
import { useEffect, useState } from 'react';
import { getLLMLogs } from '../api/client';

export default function LLMLogsScreen() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getLLMLogs();
                setLogs(data.items || []);
            } catch {
                setError('Could not load LLM logs. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    // ── Summary calculations ──
    const totalCalls = logs.length;
    const totalInputTokens = logs.reduce((sum, l) => sum + (l.input_tokens || 0), 0);
    const totalOutputTokens = logs.reduce((sum, l) => sum + (l.output_tokens || 0), 0);
    const totalTokens = totalInputTokens + totalOutputTokens;
    const avgLatency =
        totalCalls > 0
            ? Math.round(
                logs.reduce((sum, l) => sum + (l.latency_ms || 0), 0) / totalCalls
            )
            : 0;
    const successCount = logs.filter((l) => l.success).length;
    const successRate = totalCalls > 0 ? Math.round((successCount / totalCalls) * 100) : 0;

    return (
        <div className="min-h-full px-4 pt-6 pb-4">
            <h1 className="text-2xl font-bold text-body mb-2">LLM Logs</h1>
            <p className="text-sm text-secondary mb-6">
                This dashboard tracks every AI call made by the system for cost monitoring and
                performance observability.
            </p>

            {/* Loading */}
            {loading && (
                <div className="text-center py-8">
                    <span className="text-3xl animate-spin">⏳</span>
                    <p className="text-secondary mt-2">Loading logs…</p>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                    <p className="text-danger text-sm">⚠️ {error}</p>
                </div>
            )}

            {!loading && !error && (
                <>
                    {/* Summary cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                        <SummaryCard label="Total Calls" value={totalCalls} icon="📊" />
                        <SummaryCard label="Total Tokens" value={totalTokens.toLocaleString()} icon="🔤" />
                        <SummaryCard label="Avg Latency" value={`${avgLatency}ms`} icon="⚡" />
                        <SummaryCard
                            label="Success Rate"
                            value={`${successRate}%`}
                            icon={successRate >= 90 ? '✅' : '⚠️'}
                        />
                    </div>

                    {/* Logs table */}
                    {logs.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-secondary">No LLM calls logged yet. Chat with the agent or ask a RAG question to generate logs.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto -mx-4">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200 text-left">
                                        <th className="px-4 py-3 font-semibold text-secondary">Time</th>
                                        <th className="px-4 py-3 font-semibold text-secondary">Model</th>
                                        <th className="px-4 py-3 font-semibold text-secondary">Version</th>
                                        <th className="px-4 py-3 font-semibold text-secondary text-right">In</th>
                                        <th className="px-4 py-3 font-semibold text-secondary text-right">Out</th>
                                        <th className="px-4 py-3 font-semibold text-secondary text-right">Latency</th>
                                        <th className="px-4 py-3 font-semibold text-secondary text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((log) => {
                                        const ts = new Date(log.timestamp);
                                        return (
                                            <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="px-4 py-3 whitespace-nowrap text-body">
                                                    {ts.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}{' '}
                                                    {ts.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                                                </td>
                                                <td className="px-4 py-3 text-body truncate max-w-[120px]">
                                                    {log.model}
                                                </td>
                                                <td className="px-4 py-3 text-secondary">{log.prompt_version}</td>
                                                <td className="px-4 py-3 text-right text-body">
                                                    {log.input_tokens ?? '—'}
                                                </td>
                                                <td className="px-4 py-3 text-right text-body">
                                                    {log.output_tokens ?? '—'}
                                                </td>
                                                <td className="px-4 py-3 text-right text-body">
                                                    {log.latency_ms ? `${log.latency_ms}ms` : '—'}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {log.success ? (
                                                        <span className="text-success font-bold">✓</span>
                                                    ) : (
                                                        <span className="text-danger font-bold" title={log.error_message}>
                                                            ✗
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function SummaryCard({ label, value, icon }) {
    return (
        <div className="bg-card border border-gray-100 rounded-xl p-4 text-center">
            <span className="text-2xl">{icon}</span>
            <p className="text-xl font-bold text-body mt-1">{value}</p>
            <p className="text-xs text-secondary mt-0.5">{label}</p>
        </div>
    );
}
