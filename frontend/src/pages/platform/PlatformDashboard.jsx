import { useEffect, useState } from 'react';
import api from '../../api/client';
import { Building2, CheckCircle, ArrowRight, LayoutGrid, Users, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const PIE_COLORS = {
  'Pending':      '#F59E0B',
  'Under Review': '#6366F1',
  'Accepted':     '#10B981',
  'Rejected':     '#EF4444',
};
const DEFAULT_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

function StatCard({ label, value, icon: Icon, iconClass, loading }) {
  return (
    <div className="card group cursor-default transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-ink-3 font-medium">{label}</span>
        <span className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 transition-transform duration-150 group-hover:scale-110 ${iconClass}`}>
          <Icon size={14} />
        </span>
      </div>
      <div className="mt-3 font-mono text-[32px] leading-none tracking-tight text-ink tnum">
        {loading ? <span className="shimmer-bg inline-block w-16 h-8 rounded" /> : value}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-line rounded-xl px-3 py-2 shadow-lg text-[12px]">
      <p className="font-medium text-ink mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.fill || p.color }} className="font-mono">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export default function PlatformDashboard() {
  const [stats, setStats]   = useState(null);
  const [firms, setFirms]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/stats/platform'),
      api.get('/api/firms'),
    ]).then(([s, f]) => {
      setStats(s.data);
      setFirms(f.data);
    }).finally(() => setLoading(false));
  }, []);

  const STAT_CARDS = [
    { label: 'Accounting Firms',  value: stats?.total_firms,        icon: Building2,    iconClass: 'bg-brand-50 text-brand-700' },
    { label: 'Active Firms',      value: stats?.active_firms,       icon: CheckCircle,  iconClass: 'bg-emerald-50 text-emerald-700' },
    { label: 'Companies',         value: stats?.total_companies,    icon: LayoutGrid,   iconClass: 'bg-violet-50 text-violet-700' },
    { label: 'Total Users',       value: stats?.total_users,        icon: Users,        iconClass: 'bg-amber-50 text-amber-700' },
    { label: 'Transactions',      value: stats?.total_transactions, icon: FileText,     iconClass: 'bg-sky-50 text-sky-700' },
  ];

  return (
    <div className="p-6 max-w-screen-xl space-y-6">
      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-ink-3 font-medium">Overview</div>
        <h1 className="text-[22px] font-semibold text-ink tracking-tight mt-0.5">Platform Dashboard</h1>
        <p className="text-ink-2 text-[13px] mt-0.5">All accounting firms on LedgerLink</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {STAT_CARDS.map(s => (
          <StatCard key={s.label} {...s} loading={loading} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Bar: transactions per firm */}
        <div className="card">
          <h2 className="font-semibold text-ink text-[14px] mb-4">Transactions by Firm</h2>
          {loading || !stats?.firms_bar?.length ? (
            <div className="h-48 shimmer-bg rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.firms_bar} barSize={18}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#A8A29E' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#A8A29E' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="transactions" fill="#4F46E5" radius={[4, 4, 0, 0]} name="Transactions" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie: status distribution */}
        <div className="card">
          <h2 className="font-semibold text-ink text-[14px] mb-4">Transaction Status</h2>
          {loading || !stats?.status_pie?.length ? (
            <div className="h-48 shimmer-bg rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={stats.status_pie}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {stats.status_pie.map((entry, i) => (
                    <Cell key={i} fill={PIE_COLORS[entry.name] || DEFAULT_COLORS[i % DEFAULT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={v => <span style={{ fontSize: 11, color: '#57534E' }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent firms list */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-ink">Recent Firms</h2>
          <Link to="/platform/firms" className="text-[13px] text-brand-600 flex items-center gap-1 hover:text-brand-700 transition-colors">
            View all <ArrowRight size={13} />
          </Link>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-9 shimmer-bg rounded-lg" />)}
          </div>
        ) : firms.length === 0 ? (
          <p className="text-ink-3 text-sm">
            No firms yet.{' '}
            <Link to="/platform/firms" className="text-brand-600 hover:underline">Onboard one</Link>
          </p>
        ) : (
          <div className="divide-y divide-line">
            {firms.slice(0, 5).map(firm => (
              <div key={firm.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-[13.5px] font-medium text-ink">{firm.name}</p>
                  <p className="text-[12px] text-ink-3 font-mono">{firm.email}</p>
                </div>
                <span className={firm.is_active ? 'badge-accepted' : 'badge-rejected'}>
                  {firm.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
