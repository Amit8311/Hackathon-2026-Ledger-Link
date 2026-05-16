import { useEffect, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Sparkles } from 'lucide-react';

const STATUS_FILTERS = ['all', 'pending', 'under_review', 'accepted', 'rejected'];

const STATUS_COLORS = {
  pending:      { bg: 'bg-yellow-50',  text: 'text-yellow-700',  border: 'border-yellow-200' },
  under_review: { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200'   },
  accepted:     { bg: 'bg-green-50',   text: 'text-green-700',   border: 'border-green-200'  },
  rejected:     { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200'    },
};

export default function TransactionsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.company_id) return;
    const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
    api.get(`/api/transactions${params}`).then(r => setTransactions(r.data)).finally(() => setLoading(false));
  }, [user, statusFilter]);

  const getBadgeClass = (status) => {
    const map = { pending: 'badge-pending', under_review: 'badge-review', accepted: 'badge-accepted', rejected: 'badge-rejected' };
    return map[status] || 'badge-pending';
  };

  const statusColor = (status) => STATUS_COLORS[status] || STATUS_COLORS.pending;

  return (
    <div className="p-4 md:p-8">
      <div className="mb-5">
        <div className="text-[11px] uppercase tracking-widest text-ink-3 font-medium">Company</div>
        <h1 className="text-[20px] md:text-2xl font-bold text-gray-900 mt-0.5">Transactions</h1>
        <p className="text-gray-500 text-sm mt-0.5">All uploaded financial documents</p>
      </div>

      {/* Status filter pills */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
        {STATUS_FILTERS.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
              statusFilter === s ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm text-center py-12">Loading...</p>
      ) : transactions.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-12">No transactions found.</p>
      ) : (
        <>
          {/* ── Mobile card list ── */}
          <div className="md:hidden space-y-3">
            {transactions.map(tx => {
              const sc = statusColor(tx.status);
              return (
                <div key={tx.id} className="bg-white rounded-2xl border border-line p-4 shadow-elev-1">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[14px] text-ink truncate">{tx.vendor_name || '—'}</p>
                      <p className="text-[12px] text-ink-3 capitalize mt-0.5">{tx.transaction_type?.replace(/_/g, ' ')}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {tx.ai_extracted && <Sparkles size={13} className="text-blue-500" />}
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${sc.bg} ${sc.text} ${sc.border}`}>
                        {tx.status?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12px]">
                    {tx.invoice_number && (
                      <div>
                        <span className="text-ink-3">Invoice #</span>
                        <span className="text-ink font-medium ml-1">{tx.invoice_number}</span>
                      </div>
                    )}
                    {tx.invoice_date && (
                      <div>
                        <span className="text-ink-3">Date</span>
                        <span className="text-ink font-medium ml-1">{tx.invoice_date}</span>
                      </div>
                    )}
                    {tx.total_amount && (
                      <div>
                        <span className="text-ink-3">Amount</span>
                        <span className="text-ink font-semibold ml-1">₹{Number(tx.total_amount).toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {tx.reviewer_notes && (
                    <p className="mt-2 pt-2 border-t border-line text-[11.5px] text-ink-3 italic">
                      {tx.reviewer_notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Desktop table ── */}
          <div className="hidden md:block card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Vendor</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Type</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Invoice #</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Date</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Amount</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">AI</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Status</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => (
                    <tr key={tx.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-3 font-medium text-gray-900">{tx.vendor_name || '—'}</td>
                      <td className="py-3 px-3 text-gray-600 capitalize">{tx.transaction_type?.replace(/_/g, ' ')}</td>
                      <td className="py-3 px-3 text-gray-600">{tx.invoice_number || '—'}</td>
                      <td className="py-3 px-3 text-gray-600">{tx.invoice_date || '—'}</td>
                      <td className="py-3 px-3 text-gray-900 font-medium">
                        {tx.total_amount ? `₹${Number(tx.total_amount).toLocaleString()}` : '—'}
                      </td>
                      <td className="py-3 px-3">
                        {tx.ai_extracted && <Sparkles size={14} className="text-blue-500" title="AI extracted" />}
                      </td>
                      <td className="py-3 px-3">
                        <span className={getBadgeClass(tx.status)}>{tx.status?.replace('_', ' ')}</span>
                      </td>
                      <td className="py-3 px-3 text-gray-500 text-xs">{tx.reviewer_notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
