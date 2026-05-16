import { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import api from '../../api/client';

const COLORS = ['#4F46E5','#7C3AED','#EC4899','#F59E0B','#10B981','#3B82F6','#EF4444','#8B5CF6'];

const fmt = (v) => v >= 1000 ? `₹${(v/1000).toFixed(1)}k` : `₹${v}`;

export default function InsightsPage() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/stats/insights')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="p-8 flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const noData = !data || (data.top_heads.length === 0 && data.cash_flow.every(m => m.income === 0 && m.expense === 0));

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="text-[11px] uppercase tracking-widest text-ink-3 font-medium mb-0.5">Company</div>
        <h1 className="text-[22px] font-semibold text-ink tracking-tight">Insights & Analytics</h1>
        <p className="text-sm text-ink-3 mt-1">Cash flow trends and expense breakdown from accepted transactions.</p>
      </div>

      {noData && (
        <div className="rounded-2xl border border-line p-10 text-center" style={{ backgroundColor: 'var(--surface)' }}>
          <p className="text-ink-3 text-sm">No accepted transactions yet — insights will appear once the accountant approves documents.</p>
        </div>
      )}

      {!noData && (
        <div className="space-y-6">
          {/* Cash Flow */}
          <div className="rounded-2xl border border-line p-5" style={{ backgroundColor: 'var(--surface)' }}>
            <h2 className="text-[15px] font-semibold text-ink mb-4">Cash Flow — Last 6 Months</h2>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data.cash_flow} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,.06)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} width={60} />
                <Tooltip formatter={(v) => [`₹${v.toLocaleString()}`, undefined]} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="income"  name="Income"  stroke="#10B981" fill="url(#incomeGrad)"  strokeWidth={2} dot={{ r: 3 }} />
                <Area type="monotone" dataKey="expense" name="Expense" stroke="#EF4444" fill="url(#expenseGrad)" strokeWidth={2} dot={{ r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Expense Heads */}
            <div className="rounded-2xl border border-line p-5" style={{ backgroundColor: 'var(--surface)' }}>
              <h2 className="text-[15px] font-semibold text-ink mb-4">Top Expense Heads</h2>
              {data.top_heads.length === 0 ? (
                <p className="text-sm text-ink-3 py-8 text-center">No categorised expenses yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.top_heads} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,.06)" horizontal={false} />
                    <XAxis type="number" tickFormatter={fmt} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                    <Tooltip formatter={(v) => [`₹${v.toLocaleString()}`, 'Amount']} />
                    <Bar dataKey="amount" fill="#4F46E5" radius={[0, 4, 4, 0]}>
                      {data.top_heads.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Document Types */}
            <div className="rounded-2xl border border-line p-5" style={{ backgroundColor: 'var(--surface)' }}>
              <h2 className="text-[15px] font-semibold text-ink mb-4">Document Type Mix</h2>
              {data.doc_types.length === 0 ? (
                <p className="text-sm text-ink-3 py-8 text-center">No documents uploaded yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={data.doc_types} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {data.doc_types.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
