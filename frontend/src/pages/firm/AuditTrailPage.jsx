import { useState, useEffect } from 'react';
import { Shield, RefreshCw } from 'lucide-react';
import api from '../../api/client';

const ACTION_COLORS = {
  uploaded:          'bg-blue-100 text-blue-700',
  accepted:          'bg-green-100 text-green-700',
  rejected:          'bg-red-100 text-red-700',
  report_published:  'bg-purple-100 text-purple-700',
};

const ROLE_LABEL = {
  platform_admin: 'Platform Admin',
  firm_admin:     'Firm Admin',
  accountant:     'Accountant',
  company_admin:  'Company Admin',
  company_user:   'Company User',
};

export default function AuditTrailPage() {
  const [logs, setLogs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setRefreshing(true);
    try {
      const res = await api.get('/api/audit/');
      setLogs(res.data);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const fmt = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const filtered = filter
    ? logs.filter(l =>
        l.action.includes(filter) ||
        l.user_name.toLowerCase().includes(filter.toLowerCase()) ||
        l.entity_type.includes(filter)
      )
    : logs;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-ink-3 font-medium mb-0.5">Firm</div>
          <h1 className="text-[22px] font-semibold text-ink tracking-tight">Audit Trail</h1>
          <p className="text-sm text-ink-3 mt-1">Every upload, review, and report action — who did what and when.</p>
        </div>
        <button
          onClick={load}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-line text-[13px] text-ink-2 hover:text-ink hover:bg-canvas transition-colors"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Filter */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Filter by user, action, or entity…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="w-full max-w-sm px-3 py-2 rounded-xl border border-line text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-400"
          style={{ backgroundColor: 'var(--surface)' }}
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-line overflow-hidden" style={{ backgroundColor: 'var(--surface)' }}>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-ink-3">
            <Shield size={32} className="mb-3" />
            <p className="text-sm">{filter ? 'No matching records' : 'No audit logs yet'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-[11px] uppercase tracking-wider text-ink-3">
                  <th className="text-left px-4 py-3 font-medium">Time</th>
                  <th className="text-left px-4 py-3 font-medium">User</th>
                  <th className="text-left px-4 py-3 font-medium">Role</th>
                  <th className="text-left px-4 py-3 font-medium">Action</th>
                  <th className="text-left px-4 py-3 font-medium">Entity</th>
                  <th className="text-left px-4 py-3 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log, i) => (
                  <tr key={log.id} className={`border-b border-line last:border-0 hover:bg-canvas/50 transition-colors ${i % 2 === 0 ? '' : 'bg-canvas/20'}`}>
                    <td className="px-4 py-3 text-[12px] text-ink-3 whitespace-nowrap font-mono">{fmt(log.created_at)}</td>
                    <td className="px-4 py-3 text-[13px] font-medium text-ink">{log.user_name}</td>
                    <td className="px-4 py-3 text-[12px] text-ink-2">{ROLE_LABEL[log.user_role] || log.user_role}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-600'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-ink-2">
                      {log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-ink-3 max-w-xs truncate" title={log.details}>{log.details || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && filtered.length > 0 && (
        <p className="text-[11px] text-ink-3 mt-3 text-right">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</p>
      )}
    </div>
  );
}
