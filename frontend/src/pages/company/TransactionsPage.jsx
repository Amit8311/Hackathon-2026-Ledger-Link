import { useEffect, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Sparkles } from 'lucide-react';

const STATUS_FILTERS = ['all', 'pending', 'under_review', 'accepted', 'rejected'];

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

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <p className="text-gray-500 mt-1">All uploaded financial documents</p>
      </div>

      <div className="flex gap-2 mb-6">
        {STATUS_FILTERS.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === s ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </button>
        ))}
      </div>

      <div className="card">
        {loading ? (
          <p className="text-gray-400 text-sm">Loading...</p>
        ) : transactions.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No transactions found.</p>
        ) : (
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
                    <td className="py-3 px-3 text-gray-600 capitalize">{tx.transaction_type?.replace('_', ' ')}</td>
                    <td className="py-3 px-3 text-gray-600">{tx.invoice_number || '—'}</td>
                    <td className="py-3 px-3 text-gray-600">{tx.invoice_date || '—'}</td>
                    <td className="py-3 px-3 text-gray-900 font-medium">
                      {tx.total_amount ? `₹${tx.total_amount.toLocaleString()}` : '—'}
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
        )}
      </div>
    </div>
  );
}
