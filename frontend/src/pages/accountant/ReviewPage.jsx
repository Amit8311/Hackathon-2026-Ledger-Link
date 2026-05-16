import { useEffect, useState } from 'react';
import api from '../../api/client';
import { CheckCircle, XCircle, ChevronDown, ChevronRight, Sparkles, Clock, Eye } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

function StatusTimeline({ status }) {
  const steps = [
    { key: 'pending',      label: 'Submitted',    icon: Clock,         color: '#F59E0B' },
    { key: 'under_review', label: 'Under Review',  icon: Eye,           color: '#6366F1' },
    { key: 'done',         label: status === 'accepted' ? 'Accepted' : status === 'rejected' ? 'Rejected' : 'Decision',
                           icon: status === 'rejected' ? XCircle : CheckCircle,
                           color: status === 'accepted' ? '#10B981' : status === 'rejected' ? '#EF4444' : '#D4D0CB' },
  ];

  const currentIdx = status === 'accepted' || status === 'rejected' ? 2
    : status === 'under_review' ? 1 : 0;

  return (
    <div className="flex items-start gap-0 mb-5">
      {steps.map((step, i) => {
        const done    = i <= currentIdx;
        const isLast  = i === steps.length - 1;
        const Icon    = step.icon;
        const clr     = done ? step.color : '#D4D0CB';
        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center" style={{ minWidth: 56 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                backgroundColor: done ? clr : '#F5F4F2',
                border: `2px solid ${clr}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.3s',
              }}>
                <Icon size={12} color={done ? 'white' : '#A8A29E'} />
              </div>
              <span style={{ fontSize: 10, color: done ? clr : '#A8A29E', marginTop: 3, whiteSpace: 'nowrap', fontWeight: done ? 600 : 400 }}>
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div style={{
                width: 48, height: 2, marginBottom: 14, flexShrink: 0,
                backgroundColor: i < currentIdx ? step.color : '#E8E5E0',
                transition: 'all 0.3s',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ReviewPage() {
  const toast = useToast();
  const [companies, setCompanies]   = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading]       = useState(false);
  const [expanded, setExpanded]     = useState({});
  const [editing, setEditing]       = useState({});
  const [notes, setNotes]           = useState({});
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
    setSubmitting(prev => ({ ...prev, [txId]: action }));
    const editData = editing[txId] || {};
    try {
      await api.post(`/api/review/${txId}`, {
        action,
        notes: notes[txId] || null,
        ...editData,
      });
      setTransactions(prev => prev.map(tx =>
        tx.id === txId
          ? { ...tx, status: action === 'accept' ? 'accepted' : 'rejected', reviewer_notes: notes[txId] }
          : tx
      ));
      setExpanded(prev => ({ ...prev, [txId]: false }));
      if (action === 'accept') {
        toast.success('Transaction accepted successfully');
      } else {
        toast.info('Transaction rejected');
      }
    } catch {
      toast.error('Action failed — please try again');
    } finally {
      setSubmitting(prev => ({ ...prev, [txId]: null }));
    }
  };

  const getBadge = (status) => {
    const map = {
      pending:      'badge-pending',
      under_review: 'badge-review',
      accepted:     'badge-accepted',
      rejected:     'badge-rejected',
    };
    return map[status] || 'badge-pending';
  };

  return (
    <div className="p-6 max-w-screen-xl space-y-6">
      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-ink-3 font-medium">Accountant</div>
        <h1 className="text-[22px] font-semibold text-ink tracking-tight mt-0.5">Review Transactions</h1>
        <p className="text-ink-2 text-[13px] mt-0.5">Inspect, correct, and approve or reject uploaded documents</p>
      </div>

      {/* Filters */}
      <div className="card flex flex-wrap gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] uppercase tracking-wider text-ink-3 font-medium">Company</label>
          <select className="input text-[13px]" value={selectedCompany} onChange={e => setSelectedCompany(e.target.value)}>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] uppercase tracking-wider text-ink-3 font-medium">Status</label>
          <select className="input text-[13px]" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Transaction list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 shimmer-bg rounded-xl" />)}
        </div>
      ) : transactions.length === 0 ? (
        <div className="card text-center py-14">
          <p className="text-ink-3 text-[13px]">No transactions found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map(tx => (
            <div key={tx.id} className="card">
              {/* Row header */}
              <div className="flex items-center justify-between">
                <button
                  className="flex items-center gap-3 flex-1 text-left"
                  onClick={() => setExpanded(prev => ({ ...prev, [tx.id]: !prev[tx.id] }))}
                >
                  <span className="text-ink-3 transition-transform duration-150" style={{ transform: expanded[tx.id] ? 'rotate(90deg)' : 'none' }}>
                    <ChevronRight size={15} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-ink text-[14px]">{tx.vendor_name || 'Unknown vendor'}</span>
                      {tx.ai_extracted && (
                        <span className="flex items-center gap-1 text-[10px] text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded-full font-medium">
                          <Sparkles size={9} /> AI
                        </span>
                      )}
                      <span className={getBadge(tx.status)}>{tx.status?.replace('_', ' ')}</span>
                    </div>
                    <p className="text-[12px] text-ink-3 mt-0.5 truncate">
                      {tx.transaction_type?.replace(/_/g, ' ')} · {tx.file_name}
                      {tx.total_amount && ` · ₹${Number(tx.total_amount).toLocaleString('en-IN')}`}
                    </p>
                  </div>
                </button>

                {['pending', 'under_review'].includes(tx.status) && (
                  <div className="flex gap-2 ml-4 flex-shrink-0">
                    <button
                      onClick={() => handleAction(tx.id, 'accept')}
                      disabled={!!submitting[tx.id]}
                      className="flex items-center gap-1 text-[12px] text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle size={13} />
                      {submitting[tx.id] === 'accept' ? 'Accepting…' : 'Accept'}
                    </button>
                    <button
                      onClick={() => handleAction(tx.id, 'reject')}
                      disabled={!!submitting[tx.id]}
                      className="flex items-center gap-1 text-[12px] text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      <XCircle size={13} />
                      {submitting[tx.id] === 'reject' ? 'Rejecting…' : 'Reject'}
                    </button>
                  </div>
                )}
              </div>

              {/* Expanded details */}
              {expanded[tx.id] && (
                <div className="mt-4 pt-4 border-t border-line">
                  {/* Status timeline */}
                  <StatusTimeline status={tx.status} />

                  {/* Editable fields */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                    {[
                      { label: 'Vendor Name',    field: 'vendor_name',    value: tx.vendor_name },
                      { label: 'Invoice Number', field: 'invoice_number', value: tx.invoice_number },
                      { label: 'Invoice Date',   field: 'invoice_date',   value: tx.invoice_date },
                      { label: 'Amount',         field: 'amount',         value: tx.amount,        type: 'number' },
                      { label: 'Tax Amount',     field: 'tax_amount',     value: tx.tax_amount,    type: 'number' },
                      { label: 'Total Amount',   field: 'total_amount',   value: tx.total_amount,  type: 'number' },
                    ].map(({ label, field, value, type }) => (
                      <div key={field}>
                        <label className="block text-[11px] uppercase tracking-wider text-ink-3 mb-1 font-medium">{label}</label>
                        <input
                          className="input text-[13px]"
                          type={type || 'text'}
                          defaultValue={value || ''}
                          onChange={e => setEditing(prev => ({
                            ...prev,
                            [tx.id]: { ...(prev[tx.id] || {}), [field]: type === 'number' ? parseFloat(e.target.value) : e.target.value },
                          }))}
                        />
                      </div>
                    ))}
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-ink-3 mb-1 font-medium">Payment Head</label>
                      <select
                        className="input text-[13px]"
                        defaultValue={tx.payment_head_id || ''}
                        onChange={e => setEditing(prev => ({
                          ...prev,
                          [tx.id]: { ...(prev[tx.id] || {}), payment_head_id: parseInt(e.target.value) || null },
                        }))}
                      >
                        <option value="">— Select —</option>
                        {paymentHeads.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[11px] uppercase tracking-wider text-ink-3 mb-1 font-medium">Description</label>
                      <input
                        className="input text-[13px]"
                        defaultValue={tx.description || ''}
                        onChange={e => setEditing(prev => ({
                          ...prev,
                          [tx.id]: { ...(prev[tx.id] || {}), description: e.target.value },
                        }))}
                      />
                    </div>
                  </div>

                  {/* Review notes */}
                  <div className="mb-4">
                    <label className="block text-[11px] uppercase tracking-wider text-ink-3 mb-1 font-medium">Review Notes</label>
                    <input
                      className="input text-[13px]"
                      placeholder="Optional notes visible to company…"
                      value={notes[tx.id] || ''}
                      onChange={e => setNotes(prev => ({ ...prev, [tx.id]: e.target.value }))}
                    />
                  </div>

                  {/* Action buttons (in expanded panel) */}
                  {['pending', 'under_review'].includes(tx.status) && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleAction(tx.id, 'accept')}
                        disabled={!!submitting[tx.id]}
                        className="btn-primary flex items-center gap-2"
                      >
                        <CheckCircle size={14} />
                        {submitting[tx.id] === 'accept' ? 'Accepting…' : 'Accept Transaction'}
                      </button>
                      <button
                        onClick={() => handleAction(tx.id, 'reject')}
                        disabled={!!submitting[tx.id]}
                        className="btn-danger flex items-center gap-2"
                      >
                        <XCircle size={14} />
                        {submitting[tx.id] === 'reject' ? 'Rejecting…' : 'Reject'}
                      </button>
                    </div>
                  )}

                  {tx.reviewer_notes && (
                    <p className="text-[12px] text-ink-3 mt-3 italic">Notes: {tx.reviewer_notes}</p>
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
