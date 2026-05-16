import { useEffect, useState } from 'react';
import api from '../../api/client';
import { FileText, CheckCircle, Clock, XCircle, ArrowRight, Download, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  BarChart, Bar,
} from 'recharts';

const PIE_COLORS = {
  'Pending':      '#F59E0B',
  'Under Review': '#6366F1',
  'Accepted':     '#10B981',
  'Rejected':     '#EF4444',
};
const DEFAULT_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const downloadReport = async (reportId, fileName) => {
  const res = await api.get(`/api/reports/${reportId}/download`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  window.URL.revokeObjectURL(url);
};

function StatCard({ label, value, icon: Icon, iconClass, loading, sub }) {
  return (
    <div className="card group cursor-default transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-ink-3 font-medium">{label}</span>
        <span className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 transition-transform duration-150 group-hover:scale-110 ${iconClass}`}>
          <Icon size={14} />
        </span>
      </div>
      <div className="mt-3 font-mono text-[32px] leading-none tracking-tight text-ink tnum">
        {loading ? <span className="shimmer-bg inline-block w-16 h-8 rounded" /> : (value ?? '—')}
      </div>
      {sub && !loading && (
        <p className="text-[11px] text-ink-3 mt-1 font-mono">{sub}</p>
      )}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-line rounded-xl px-3 py-2 shadow-lg text-[12px]">
      <p className="font-medium text-ink mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.stroke || p.fill || p.color }} className="font-mono">
          {p.name}: {typeof p.value === 'number' && p.value > 1000
            ? `₹${(p.value / 1000).toFixed(1)}k`
            : p.value}
        </p>
      ))}
    </div>
  );
};

export default function CompanyDashboard() {
  const { user } = useAuth();
  const [stats, setStats]     = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.company_id) return;
    Promise.all([
      api.get('/api/stats/company'),
      api.get(`/api/reports/company/${user.company_id}`),
    ]).then(([s, r]) => {
      setStats(s.data);
      setReports(r.data);
    }).finally(() => setLoading(false));
  }, [user]);

  const fmt = (n) => n != null ? n.toLocaleString('en-IN') : '—';

  const STAT_CARDS = [
    { label: 'Total',    value: stats?.total_transactions, icon: FileText,    iconClass: 'bg-brand-50 text-brand-700' },
    { label: 'Pending',  value: stats?.pending,            icon: Clock,       iconClass: 'bg-amber-50 text-amber-700' },
    { label: 'Accepted', value: stats?.accepted,           icon: CheckCircle, iconClass: 'bg-emerald-50 text-emerald-700',
      sub: stats?.accepted_amount ? `₹${fmt(Math.round(stats.accepted_amount / 1000))}k approved` : undefined },
    { label: 'Rejected', value: stats?.rejected,           icon: XCircle,     iconClass: 'bg-red-50 text-red-700' },
    { label: 'In Review', value: stats?.under_review,      icon: Eye,         iconClass: 'bg-violet-50 text-violet-700' },
  ];

  return (
    <div className="p-6 max-w-screen-xl space-y-6">
      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-ink-3 font-medium">Overview</div>
        <h1 className="text-[22px] font-semibold text-ink tracking-tight mt-0.5">Company Dashboard</h1>
        <p className="text-ink-2 text-[13px] mt-0.5">Overview of your financial documents</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {STAT_CARDS.map(s => (
          <StatCard key={s.label} {...s} loading={loading} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Area: monthly approved spend */}
        <div className="card md:col-span-2">
          <h2 className="font-semibold text-ink text-[14px] mb-4">Monthly Approved Spend</h2>
          {loading || !stats?.monthly_trend?.length ? (
            <div className="h-48 shimmer-bg rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={stats.monthly_trend}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#4F46E5" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAE8E4" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#A8A29E' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#A8A29E' }} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone" dataKey="amount" name="Approved (₹)"
                  stroke="#4F46E5" strokeWidth={2}
                  fill="url(#spendGrad)"
                  dot={{ r: 3, fill: '#4F46E5' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie: status */}
        <div className="card">
          <h2 className="font-semibold text-ink text-[14px] mb-4">Status Mix</h2>
          {loading || !stats?.status_pie?.length ? (
            <div className="h-48 shimmer-bg rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={stats.status_pie}
                  cx="50%"
                  cy="45%"
                  innerRadius={46}
                  outerRadius={72}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {stats.status_pie.map((entry, i) => (
                    <Cell key={i} fill={PIE_COLORS[entry.name] || DEFAULT_COLORS[i % DEFAULT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={7}
                  formatter={v => <span style={{ fontSize: 10, color: '#57534E' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Transaction type bar + recent transactions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Bar: transaction types */}
        <div className="card">
          <h2 className="font-semibold text-ink text-[14px] mb-4">By Document Type</h2>
          {loading || !stats?.type_bar?.length ? (
            <div className="h-44 shimmer-bg rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stats.type_bar} barSize={18}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#A8A29E' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#A8A29E' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#4F46E5" radius={[4, 4, 0, 0]} name="Count" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Reports */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-ink">Reports from Accountant</h2>
            <Link to="/company/reports" className="text-[13px] text-brand-600 flex items-center gap-1 hover:text-brand-700 transition-colors">
              View all <ArrowRight size={13} />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-9 shimmer-bg rounded-lg" />)}
            </div>
          ) : reports.length === 0 ? (
            <p className="text-ink-3 text-sm">No reports published yet.</p>
          ) : (
            <div className="divide-y divide-line">
              {reports.slice(0, 5).map(r => (
                <div key={r.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-[13.5px] font-medium text-ink">{r.title}</p>
                    <p className="text-[12px] text-ink-3">{r.report_type}</p>
                  </div>
                  <button
                    onClick={() => downloadReport(r.id, r.file_name)}
                    className="text-[12px] text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors"
                  >
                    <Download size={12} /> Download
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
