import { useEffect, useState } from 'react';
import api from '../../api/client';
import { CheckCircle, XCircle, Edit2, ChevronDown, ChevronRight, Sparkles } from 'lucide-react';

export default function ReviewPage() {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [editing, setEditing] = useState({});
  const [notes, setNotes] = useState({});
  const [submitting, setSubmitting] = useState({});
  const [paymentHeads, setPaymentHeads] = useState([]);

  useEffect(() => {
    api.get('/api/companies').then(r => {
      setCompanies(r.data);
      if (r.data.length > 0) setSelectedCompany(r.data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedCompany) return;
    setLoading(true);
    const statusParam = statusFilter !== 'all' ? `&status=${statusFilter}` : '';
    api.get(`/api/transactions?company_id=${selectedCompany}${statusParam}`)
      .then(r => setTransactions(r.data))
      .finally(() => setLoading(false));
    api.get(`/api/payment-heads/company/${selectedCompany}`).then(r => setPaymentHeads(r.data));
  }, [selectedCompany, statusFilter]);

  const handleAction = async (txId, action) => {
    setSubmitting({ ...submitting, [txId]: action });
    const editData = editing[txId] || {};
    try {
      await api.post(`/api/review/${txId}`, {
        action,
        notes: notes[txId] || null,
        ...editData,
      });
      setTransactions(prev => prev.map(tx =>
        tx.id === txId ? { ...tx, status: action === 'accept' ? 'accepted' : 'rejected', reviewer_notes: notes[txId] } : tx
      ));
      setExpanded({ ...expanded, [txId]: false });
    } finally {
      setSubmitting({ ...submitting, [txId]: null });
    }
  };

  const getBadge = (status) => {
    const map = { pending: 'badge-pending', under_review: 'badge-review', accepted: 'badge-accepted', rejected: 'badge-rejected' };
    return map[status] || 'badge-pending';
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Review Transactions</h1>
        <p className="text-gray-500 mt-1">Review, correct, and accept or reject uploaded transactions</p>
      </div>

      <div className="flex gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
          <select className="input" value={selectedCompany} onChange={e => setSelectedCompany(e.target.value)}>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select className="input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : transactions.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400 text-sm">No transactions found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map(tx => (
            <div key={tx.id} className="card">
              <div className="flex items-center justify-between">
                <button
                  className="flex items-center gap-3 flex-1 text-left"
                  onClick={() => setExpanded({ ...expanded, [tx.id]: !expanded[tx.id] })}
                >
                  {expanded[tx.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{tx.vendor_name || 'Unknown vendor'}</span>
                      {tx.ai_extracted && <Sparkles size={12} className="text-blue-500" title="AI extracted" />}
                      <span className={getBadge(tx.status)}>{tx.status?.replace('_', ' ')}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {tx.transaction_type?.replace('_', ' ')} · {tx.file_name}
                      {tx.total_amount && ` · ₹${tx.total_amount.toLocaleString()}`}
                    </p>
                  </div>
                </button>

                {['pending', 'under_review'].includes(tx.status) && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleAction(tx.id, 'accept')}
                      disabled={submitting[tx.id]}
                      className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700 border border-green-200 px-3 py-1 rounded-lg hover:bg-green-50"
                    >
                      <CheckCircle size={14} /> Accept
                    </button>
                    <button
                      onClick={() => handleAction(tx.id, 'reject')}
                      disabled={submitting[tx.id]}
                      className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 border border-red-200 px-3 py-1 rounded-lg hover:bg-red-50"
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                )}
              </div>

              {expanded[tx.id] && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    {[
                      { label: 'Vendor Name', field: 'vendor_name', value: tx.vendor_name },
                      { label: 'Invoice Number', field: 'invoice_number', value: tx.invoice_number },
                      { label: 'Invoice Date', field: 'invoice_date', value: tx.invoice_date },
                      { label: 'Amount', field: 'amount', value: tx.amount, type: 'number' },
                      { label: 'Tax Amount', field: 'tax_amount', value: tx.tax_amount, type: 'number' },
                      { label: 'Total Amount', field: 'total_amount', value: tx.total_amount, type: 'number' },
                    ].map(({ label, field, value, type }) => (
                      <div key={field}>
                        <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                        <input
                          className="input text-sm"
                          type={type || 'text'}
                          defaultValue={value || ''}
                          onChange={e => setEditing({
                            ...editing,
                            [tx.id]: { ...(editing[tx.id] || {}), [field]: type === 'number' ? parseFloat(e.target.value) : e.target.value }
                          })}
                        />
                      </div>
                    ))}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Payment Head</label>
                      <select
                        className="input text-sm"
                        defaultValue={tx.payment_head_id || ''}
                        onChange={e => setEditing({ ...editing, [tx.id]: { ...(editing[tx.id] || {}), payment_head_id: parseInt(e.target.value) || null } })}
                      >
                        <option value="">-- Select --</option>
                        {paymentHeads.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                      <input className="input text-sm" defaultValue={tx.description || ''} onChange={e => setEditing({ ...editing, [tx.id]: { ...(editing[tx.id] || {}), description: e.target.value } })} />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Review Notes</label>
                    <input
                      className="input text-sm"
                      placeholder="Optional notes..."
                      value={notes[tx.id] || ''}
                      onChange={e => setNotes({ ...notes, [tx.id]: e.target.value })}
                    />
                  </div>

                  {['pending', 'under_review'].includes(tx.status) && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleAction(tx.id, 'accept')}
                        disabled={submitting[tx.id]}
                        className="btn-primary flex items-center gap-2"
                      >
                        <CheckCircle size={14} /> {submitting[tx.id] === 'accept' ? 'Accepting...' : 'Accept Transaction'}
                      </button>
                      <button
                        onClick={() => handleAction(tx.id, 'reject')}
                        disabled={submitting[tx.id]}
                        className="btn-danger flex items-center gap-2"
                      >
                        <XCircle size={14} /> {submitting[tx.id] === 'reject' ? 'Rejecting...' : 'Reject'}
                      </button>
                    </div>
                  )}

                  {tx.reviewer_notes && (
                    <p className="text-xs text-gray-500 mt-3 italic">Notes: {tx.reviewer_notes}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
