import { useEffect, useState } from 'react';
import api from '../../api/client';
import { Building2, Users, FileText, CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function useCountUp(target, duration = 900) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target == null || isNaN(Number(target))) return;
    const n = Number(target);
    if (n === 0) { setCount(0); return; }
    let frame = 0;
    const total = Math.round(duration / 16);
    const t = setInterval(() => {
      frame++;
      const eased = 1 - Math.pow(1 - frame / total, 3);
      setCount(Math.round(eased * n));
      if (frame >= total) { setCount(n); clearInterval(t); }
    }, 16);
    return () => clearInterval(t);
  }, [target]);
  return count;
}
function AnimatedNumber({ value }) {
  const c = useCountUp(value);
  return <span style={{ animation: 'countUp 0.3s ease' }}>{c}</span>;
}
function getGreeting(name) {
  const h = new Date().getHours();
  const t = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  return `Good ${t}, ${name?.split(' ')[0] || 'there'}`;
}
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line, CartesianGrid,
} from 'recharts';

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
        {loading ? <span className="shimmer-bg inline-block w-16 h-8 rounded" /> :
          typeof value === 'number' ? <AnimatedNumber value={value} /> : (value ?? '—')}
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
        <p key={p.name} style={{ color: p.color }} className="font-mono">{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function FirmDashboard() {
  const { user } = useAuth();
  const [stats, setStats]     = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/stats/firm'),
      api.get('/api/companies'),
    ]).then(([s, c]) => {
      setStats(s.data);
      setCompanies(c.data);
    }).finally(() => setLoading(false));
  }, []);

  const STAT_CARDS = [
    { label: 'Companies',      value: stats?.total_companies,    icon: Building2,   iconClass: 'bg-brand-50 text-brand-700' },
    { label: 'Active',         value: stats?.active_companies,   icon: CheckCircle, iconClass: 'bg-emerald-50 text-emerald-700' },
    { label: 'Accountants',    value: stats?.total_accountants,  icon: Users,       iconClass: 'bg-violet-50 text-violet-700' },
    { label: 'Transactions',   value: stats?.total_transactions, icon: FileText,    iconClass: 'bg-amber-50 text-amber-700' },
  ];

  return (
    <div className="p-6 max-w-screen-xl space-y-6">
      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-ink-3 font-medium">Firm Admin</div>
        <h1 className="text-[22px] font-semibold text-ink tracking-tight mt-0.5">{getGreeting(user?.name)}</h1>
        <p className="text-ink-2 text-[13px] mt-0.5">Here's your firm activity for today</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STAT_CARDS.map(s => (
          <StatCard key={s.label} {...s} loading={loading} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Stacked bar: per-company status */}
        <div className="card">
          <h2 className="font-semibold text-ink text-[14px] mb-4">Transactions by Company</h2>
          {loading || !stats?.companies_bar?.length ? (
            <div className="h-48 shimmer-bg rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.companies_bar} barSize={14}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#A8A29E' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#A8A29E' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={7}
                  formatter={v => <span style={{ fontSize: 11, color: '#57534E' }}>{v}</span>} />
                <Bar dataKey="pending"      stackId="a" fill="#F59E0B" radius={[0,0,0,0]} name="Pending" />
                <Bar dataKey="under_review" stackId="a" fill="#6366F1" name="Under Review" />
                <Bar dataKey="accepted"     stackId="a" fill="#10B981" name="Accepted" />
                <Bar dataKey="rejected"     stackId="a" fill="#EF4444" radius={[4,4,0,0]} name="Rejected" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Line: monthly trend */}
        <div className="card">
          <h2 className="font-semibold text-ink text-[14px] mb-4">Monthly Transaction Volume</h2>
          {loading || !stats?.monthly_trend?.length ? (
            <div className="h-48 shimmer-bg rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={stats.monthly_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAE8E4" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#A8A29E' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#A8A29E' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone" dataKey="count" name="Transactions"
                  stroke="#4F46E5" strokeWidth={2} dot={{ r: 3, fill: '#4F46E5' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Companies list */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-ink">Companies</h2>
          <Link to="/firm/companies" className="text-[13px] text-brand-600 flex items-center gap-1 hover:text-brand-700 transition-colors">
            Manage <ArrowRight size={13} />
          </Link>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-9 shimmer-bg rounded-lg" />)}
          </div>
        ) : companies.length === 0 ? (
          <p className="text-ink-3 text-sm">
            No companies yet.{' '}
            <Link to="/firm/companies" className="text-brand-600 hover:underline">Add one</Link>
          </p>
        ) : (
          <div className="divide-y divide-line">
            {companies.slice(0, 5).map(c => (
              <div key={c.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-[13.5px] font-medium text-ink">{c.name}</p>
                  <p className="text-[12px] text-ink-3">{c.business_type} · {c.email}</p>
                </div>
                <span className={c.is_active ? 'badge-accepted' : 'badge-rejected'}>
                  {c.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
