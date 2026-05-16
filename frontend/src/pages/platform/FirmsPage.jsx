import { useEffect, useState } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { Plus, ToggleLeft, ToggleRight, X, Building2, Mail, Phone, MapPin, Users, ChevronRight, Eye, EyeOff } from 'lucide-react';

const EMPTY_FORM = {
  name: '', email: '', phone: '', address: '',
  admin_name: '', admin_email: '', admin_password: '',
};

const roleConfig = {
  firm_admin:    { label: 'Firm Admin',    cls: 'badge-review' },
  accountant:    { label: 'Accountant',    cls: 'badge-accepted' },
  company_admin: { label: 'Company Admin', cls: 'badge-pending' },
  company_user:  { label: 'Company User',  cls: 'badge-review' },
};

export default function FirmsPage() {
  const toast = useToast();
  const [firms, setFirms]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState('');
  const [selected, setSelected]   = useState(null);
  const [firmUsers, setFirmUsers] = useState([]);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [showPw, setShowPw]       = useState(false);

  const fetchFirms = () =>
    api.get('/api/firms').then(r => setFirms(r.data)).finally(() => setLoading(false));

  useEffect(() => { fetchFirms(); }, []);

  const openDetail = async (firm) => {
    setSelected(firm);
    const res = await api.get('/api/users');
    setFirmUsers(res.data.filter(u => u.firm_id === firm.id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/api/firms', form);
      setShowModal(false);
      setForm(EMPTY_FORM);
      fetchFirms();
      toast.success('Firm created successfully');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create firm');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleFirm = async (e, id) => {
    e.stopPropagation();
    await api.patch(`/api/firms/${id}/toggle`);
    fetchFirms();
    if (selected?.id === id)
      setSelected(prev => ({ ...prev, is_active: !prev.is_active }));
  };

  const closeModal = () => { setShowModal(false); setForm(EMPTY_FORM); setError(''); setShowPw(false); };

  return (
    <div className="p-6 max-w-screen-xl">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[20px] font-semibold text-ink tracking-tight">Accounting Firms</h1>
          <p className="text-ink-3 text-[13px] mt-0.5">Manage all accounting firms on the platform</p>
        </div>
        <button className="btn-brand flex items-center gap-2" onClick={() => setShowModal(true)}>
          <Plus size={14} /> Add Firm
        </button>
      </div>

      <div className="flex gap-5">
        {/* Table */}
        <div className={`card p-0 overflow-hidden ${selected ? 'flex-1' : 'w-full'}`}>
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 shimmer-bg rounded-lg" />
              ))}
            </div>
          ) : firms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center mb-3">
                <Building2 size={20} className="text-brand-600" />
              </div>
              <p className="text-ink font-medium text-[14px]">No firms yet</p>
              <p className="text-ink-3 text-[13px] mt-1">Click "Add Firm" to onboard your first accounting firm.</p>
            </div>
          ) : (
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-line bg-canvas">
                  <th className="text-left py-2.5 px-4 font-medium text-ink-3 text-[11px] uppercase tracking-wider">Firm</th>
                  <th className="text-left py-2.5 px-4 font-medium text-ink-3 text-[11px] uppercase tracking-wider">Email</th>
                  {!selected && <th className="text-left py-2.5 px-4 font-medium text-ink-3 text-[11px] uppercase tracking-wider">Phone</th>}
                  <th className="text-left py-2.5 px-4 font-medium text-ink-3 text-[11px] uppercase tracking-wider">Status</th>
                  <th className="py-2.5 px-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {firms.map(firm => (
                  <tr
                    key={firm.id}
                    onClick={() => openDetail(firm)}
                    className={`cursor-pointer transition-colors ${
                      selected?.id === firm.id ? 'bg-brand-50' : 'hover:bg-canvas'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                          <Building2 size={13} className="text-brand-600" />
                        </div>
                        <span className="font-medium text-ink">{firm.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-ink-2">{firm.email}</td>
                    {!selected && <td className="py-3 px-4 text-ink-2">{firm.phone || '—'}</td>}
                    <td className="py-3 px-4">
                      <span className={firm.is_active ? 'badge-accepted' : 'badge-rejected'}>
                        {firm.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={e => toggleFirm(e, firm.id)}
                          className="text-ink-3 hover:text-ink-2 transition-colors"
                        >
                          {firm.is_active
                            ? <ToggleRight size={20} className="text-emerald-500" />
                            : <ToggleLeft size={20} />}
                        </button>
                        <ChevronRight size={14} className="text-ink-3" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-72 flex-shrink-0 card self-start">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-ink text-[14px]">Firm Details</h2>
              <button onClick={() => setSelected(null)} className="text-ink-3 hover:text-ink-2 transition-colors">
                <X size={15} />
              </button>
            </div>

            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-line">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-[11px] font-bold font-mono flex-shrink-0"
                   style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)' }}>
                {selected.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-ink text-[13px]">{selected.name}</p>
                <span className={selected.is_active ? 'badge-accepted' : 'badge-rejected'}>
                  {selected.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div className="space-y-2.5 mb-5">
              <div className="flex items-center gap-2 text-[13px] text-ink-2">
                <Mail size={13} className="text-ink-3 flex-shrink-0" />
                {selected.email}
              </div>
              {selected.phone && (
                <div className="flex items-center gap-2 text-[13px] text-ink-2">
                  <Phone size={13} className="text-ink-3 flex-shrink-0" />
                  {selected.phone}
                </div>
              )}
              {selected.address && (
                <div className="flex items-start gap-2 text-[13px] text-ink-2">
                  <MapPin size={13} className="text-ink-3 flex-shrink-0 mt-0.5" />
                  {selected.address}
                </div>
              )}
            </div>

            <div className="border-t border-line pt-4">
              <div className="flex items-center gap-1.5 mb-3">
                <Users size={12} className="text-ink-3" />
                <p className="text-[11px] font-medium text-ink-3 uppercase tracking-wider">Users ({firmUsers.length})</p>
              </div>
              {firmUsers.length === 0 ? (
                <p className="text-[12px] text-ink-3">No users found.</p>
              ) : (
                <div className="space-y-2.5">
                  {firmUsers.map(u => (
                    <div key={u.id} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-medium text-ink truncate">{u.name}</p>
                        <p className="text-[11px] text-ink-3 truncate">{u.email}</p>
                      </div>
                      <span className={`flex-shrink-0 ${roleConfig[u.role]?.cls || 'badge-review'}`}>
                        {roleConfig[u.role]?.label || u.role}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Firm Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl border border-line w-full max-w-lg animate-modal-in"
               style={{ boxShadow: '0 24px 60px -12px rgba(15,15,17,.18)' }}>
            <div className="flex items-center justify-between p-5 border-b border-line">
              <div>
                <h2 className="font-semibold text-ink">Onboard New Firm</h2>
                <p className="text-ink-3 text-[12px] mt-0.5">Creates a firm and its admin account</p>
              </div>
              <button onClick={closeModal} className="text-ink-3 hover:text-ink-2 transition-colors">
                <X size={17} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4" autoComplete="off">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-[12px] font-medium text-ink-2 mb-1.5">Firm Name *</label>
                  <input className="input" required autoComplete="off" placeholder="e.g. Sharma & Associates"
                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-ink-2 mb-1.5">Firm Email *</label>
                  <input className="input" type="email" required autoComplete="off" placeholder="info@firm.com"
                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-ink-2 mb-1.5">Phone</label>
                  <input className="input" autoComplete="off" placeholder="9800000000"
                    value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <label className="block text-[12px] font-medium text-ink-2 mb-1.5">Address</label>
                  <input className="input" autoComplete="off" placeholder="City, State"
                    value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                </div>
              </div>

              <div className="border-t border-line pt-3">
                <p className="text-[12px] font-semibold text-ink-2 mb-3 uppercase tracking-wide">Firm Admin Account</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-medium text-ink-2 mb-1.5">Admin Name *</label>
                    <input className="input" required autoComplete="off" placeholder="Full name"
                      value={form.admin_name} onChange={e => setForm({ ...form, admin_name: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-ink-2 mb-1.5">Admin Email *</label>
                    <input className="input" type="email" required autoComplete="off" placeholder="admin@firm.com"
                      value={form.admin_email} onChange={e => setForm({ ...form, admin_email: e.target.value })} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[12px] font-medium text-ink-2 mb-1.5">Admin Password *</label>
                    <div className="relative">
                      <input className="input" type={showPw ? 'text' : 'password'} required autoComplete="new-password"
                        placeholder="••••••••" style={{ paddingRight: '2.5rem' }}
                        value={form.admin_password} onChange={e => setForm({ ...form, admin_password: e.target.value })} />
                      <button type="button" tabIndex={-1}
                        onClick={() => setShowPw(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink-2 transition-colors">
                        {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 text-red-700 text-[12.5px] px-3 py-2 rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-brand flex-1" disabled={submitting}>
                  {submitting ? 'Creating…' : 'Create Firm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
