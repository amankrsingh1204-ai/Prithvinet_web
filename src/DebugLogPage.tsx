import React, { useMemo, useState } from 'react';
import { useEffect } from 'react';
import { clearApiDebugLogs, getApiDebugLogs, installGlobalApiDebugLogging, subscribeApiDebugLogs, type ApiDebugLogEntry } from './services/apiDebugLogger';

const formatTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

export default function DebugLogPage() {
  const [logs, setLogs] = useState<ApiDebugLogEntry[]>(() => getApiDebugLogs());
  const [query, setQuery] = useState('');
  const [onlyFailures, setOnlyFailures] = useState(false);

  useEffect(() => {
    installGlobalApiDebugLogging('debug-page');
    const unsubscribe = subscribeApiDebugLogs((entry) => {
      setLogs((prev) => [entry, ...prev].slice(0, 400));
    });
    return unsubscribe;
  }, []);

  const filteredLogs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return logs.filter((entry) => {
      if (onlyFailures && entry.ok) return false;
      if (!q) return true;
      return (
        entry.url.toLowerCase().includes(q)
        || entry.method.toLowerCase().includes(q)
        || String(entry.status).includes(q)
        || entry.source.toLowerCase().includes(q)
      );
    });
  }, [logs, query, onlyFailures]);

  return (
    <div style={{ minHeight: '100vh', background: '#0b1220', color: '#e2e8f0', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(11, 18, 32, 0.95)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #1e293b' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 20px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, color: '#f8fafc' }}>Super Admin API Debug Log</h1>
              <p style={{ margin: '6px 0 0', fontSize: 12, color: '#94a3b8' }}>Live stream of frontend API endpoint connections</p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter by endpoint, method, status"
                style={{
                  minWidth: 250,
                  padding: '9px 10px',
                  borderRadius: 10,
                  border: '1px solid #334155',
                  background: '#0f172a',
                  color: '#e2e8f0',
                }}
              />
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#cbd5e1' }}>
                <input
                  type="checkbox"
                  checked={onlyFailures}
                  onChange={(e) => setOnlyFailures(e.target.checked)}
                />
                Failures only
              </label>
              <button
                onClick={() => {
                  clearApiDebugLogs();
                  setLogs([]);
                }}
                style={{
                  padding: '9px 12px',
                  borderRadius: 10,
                  border: '1px solid #7f1d1d',
                  background: '#450a0a',
                  color: '#fecaca',
                  cursor: 'pointer',
                }}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: 20 }}>
        <div style={{ marginBottom: 12, fontSize: 12, color: '#94a3b8' }}>
          Showing {filteredLogs.length} of {logs.length} entries
        </div>
        <div style={{ overflowX: 'auto', border: '1px solid #1e293b', borderRadius: 14 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
            <thead style={{ background: '#111827' }}>
              <tr>
                {['Time', 'Method', 'Endpoint', 'Status', 'Duration', 'Source', 'Error'].map((label) => (
                  <th key={label} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 12, color: '#93c5fd', borderBottom: '1px solid #1e293b' }}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((entry) => (
                <tr key={entry.id} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '9px 12px', fontSize: 12 }}>{formatTime(entry.timestamp)}</td>
                  <td style={{ padding: '9px 12px', fontSize: 12, color: '#f8fafc' }}>{entry.method}</td>
                  <td style={{ padding: '9px 12px', fontSize: 12, color: '#cbd5e1', maxWidth: 420, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.url}</td>
                  <td style={{ padding: '9px 12px', fontSize: 12, color: entry.ok ? '#86efac' : '#fca5a5' }}>
                    {entry.status}
                  </td>
                  <td style={{ padding: '9px 12px', fontSize: 12 }}>{entry.durationMs} ms</td>
                  <td style={{ padding: '9px 12px', fontSize: 12 }}>{entry.source}</td>
                  <td style={{ padding: '9px 12px', fontSize: 12, color: '#fca5a5' }}>{entry.error || '-'}</td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: 24, textAlign: 'center', fontSize: 13, color: '#94a3b8' }}>
                    No API logs yet. Keep the dashboard open and use features to generate endpoint traffic.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
