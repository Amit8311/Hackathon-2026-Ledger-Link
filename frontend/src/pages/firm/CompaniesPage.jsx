import { useEffect, useState } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { Plus, ToggleLeft, ToggleRight, X, Building2, Mail, Phone, MapPin, Hash, Users, ChevronRight, Eye, EyeOff } from 'lucide-react';

const BUSINESS_TYPES = ['manufacturing', 'it', 'services', 'retail', 'other'];

const BIZ_LABEL = {
  manufacturing: 'Manufacturing',
  it:            'IT',
  services:      'Services',
  retail:        'Retail',
  other:         'Other',
};

const roleConfig = {
  company_admin: { label: 'Admin',      cls: 'badge-review' },
  company_user:  { label: 'User',       cls: 'badge-pending' },
  accountant:    { label: 'Accountant', cls: 'badge-accepted' },
};

const EMPTY_FORM = {
  name: '', email: '', phone: '', address: '',
  business_type: 'services', gst_number: '',
  admin_name: '', admin_email: '', admin_password: '',
};

export default function CompaniesPage() {
  const toast = useToast();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState('');
  const [selected, setSelected]   = useState(null);
  const [companyUsers, setCompanyUsers] = useState([]);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [showPw, setShowPw]       = useState(false);

  const fetchCompanies = () =>
    api.get('/api/companies').then(r => setCompanies(r.data)).finally(() => setLoading(false));

  useEffect(() => { fetchCompanies(); }, []);

  const openDetail = async (company) => {
    setSelected(company);
    const res = await api.get('/api/users');
    setCompanyUsers(res.data.filter(u => u.company_id === company.id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/api/companies', form);
      setShowModal(false);
      setForm(EMPTY_FORM);
      fetchCompanies();
      toast.success('Company created successfully');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create company');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleCompany = async (e, id) => {
    e.stopPropagation();
    await api.patch(`/api/companies/${id}/toggle`);
    fetchCompanies();
    if (selected?.id === id)
      setSelected(prev => ({ ...prev, is_active: !prev.is_active }));
  };

  const closeModal = () => { setShowModal(false); setForm(EMPTY_FORM); setError(''); setShowPw(false); };

  return (
    <div className="p-6 max-w-screen-xl">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[20px] font-semibold text-ink tracking-tight">Companies</h1>
          <p className="text-ink-3 text-[13px] mt-0.5">Manage companies under your firm</p>
        </div>
        <button className="btn-brand flex items-center gap-2" onClick={() => setShowModal(true)}>
          <Plus size={14} /> Add Company
        </button>
      </div>

      <div className="flex gap-5">
        {/* Table */}
        <div className={`card p-0 overflow-hidden ${selected ? 'flex-1' : 'w-full'}`}>
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 shimmer-bg rounded-lg" />
              ))}
            </div>
          ) : companies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center mb-3">
                <Building2 size={20} className="text-brand-600" />
              </div>
              <p className="text-ink font-medium text-[14px]">No companies yet</p>
              <p className="text-ink-3 text-[13px] mt-1">Click "Add Company" to onboard your first client company.</p>
            </div>
          ) : (
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-line bg-canvas">
                  <th className="text-left py-2.5 px-4 font-medium text-ink-3 text-[11px] uppercase tracking-wider">Company</th>
                  <th className="text-left py-2.5 px-4 font-medium text-ink-3 text-[11px] uppercase tracking-wider">Business Type</th>
                  {!selected && <th className="text-left py-2.5 px-4 font-medium text-ink-3 text-[11px] uppercase tracking-wider">GST</th>}
                  <th className="text-left py-2.5 px-4 font-medium text-ink-3 text-[11px] uppercase tracking-wider">Status</th>
                  <th className="py-2.5 px-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {companies.map(c => (
                  <tr
                    key={c.id}
                    onClick={() => openDetail(c)}
                    className={`cursor-pointer transition-colors ${
                      selected?.id === c.id ? 'bg-brand-50' : 'hover:bg-canvas'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                          <Building2 size={13} className="text-brand-600" />
                        </div>
                        <div>
                          <p className="font-medium text-ink">{c.name}</p>
                          <p className="text-[11px] text-ink-3">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="badge-review">{BIZ_LABEL[c.business_type] || c.business_type}</span>
                    </td>
                    {!selected && (
                      <td className="py-3 px-4 text-ink-2 font-mono text-[11.5px]">
                        {c.gst_number || '—'}
                      </td>
                    )}
                    <td className="py-3 px-4">
                      <span className={c.is_active ? 'badge-accepted' : 'badge-rejected'}>
                        {c.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={e => toggleCompany(e, c.id)}
                          className="text-ink-3 hover:text-ink-2 transition-colors"
                        >
                          {c.is_active
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
              <h2 className="font-semibold text-ink text-[14px]">Company Details</h2>
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
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="badge-review">{BIZ_LABEL[selected.business_type] || selected.business_type}</span>
                  <span className={selected.is_active ? 'badge-accepted' : 'badge-rejected'}>
                    {selected.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
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
              {selected.gst_number && (
                <div className="flex items-center gap-2 text-[13px] text-ink-2">
                  <Hash size={13} className="text-ink-3 flex-shrink-0" />
                  <span className="font-mono">{selected.gst_number}</span>
                </div>
              )}
            </div>

            <div className="border-t border-line pt-4">
              <div className="flex items-center gap-1.5 mb-3">
                <Users size={12} className="text-ink-3" />
                <p className="text-[11px] font-medium text-ink-3 uppercase tracking-wider">Users ({companyUsers.length})</p>
              </div>
              {companyUsers.length === 0 ? (
                <p className="text-[12px] text-ink-3">No users found.</p>
              ) : (
                <div className="space-y-2.5">
                  {companyUsers.map(u => (
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

      {/* Add Company Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl border border-line w-full max-w-lg animate-modal-in"
               style={{ boxShadow: '0 24px 60px -12px rgba(15,15,17,.18)' }}>
            <div className="flex items-center justify-between p-5 border-b border-line">
              <div>
                <h2 className="font-semibold text-ink">Onboard New Company</h2>
                <p className="text-ink-3 text-[12px] mt-0.5">Creates a company and its admin account</p>
              </div>
              <button onClick={closeModal} className="text-ink-3 hover:text-ink-2 transition-colors">
                <X size={17} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4" autoComplete="off">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-[12px] font-medium text-ink-2 mb-1.5">Company Name *</label>
                  <input className="input" required autoComplete="off" placeholder="e.g. Arjun Textiles Pvt Ltd"
                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-ink-2 mb-1.5">Company Email *</label>
                  <input className="input" type="email" required autoComplete="off" placeholder="accounts@company.com"
                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-ink-2 mb-1.5">Business Type *</label>
                  <select className="input" value={form.business_type}
                    onChange={e => setForm({ ...form, business_type: e.target.value })}>
                    {BUSINESS_TYPES.map(t => (
                      <option key={t} value={t}>{BIZ_LABEL[t]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-ink-2 mb-1.5">GST Number</label>
                  <input className="input font-mono" autoComplete="off" placeholder="22AAAAA0000A1Z5"
                    value={form.gst_number} onChange={e => setForm({ ...form, gst_number: e.target.value })} />
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
                <p className="text-[12px] font-semibold text-ink-2 mb-3 uppercase tracking-wide">Company Admin Account</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-medium text-ink-2 mb-1.5">Admin Name *</label>
                    <input className="input" required autoComplete="off" placeholder="Full name"
                      value={form.admin_name} onChange={e => setForm({ ...form, admin_name: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-ink-2 mb-1.5">Admin Email *</label>
                    <input className="input" type="email" required autoComplete="off" placeholder="admin@company.com"
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
                  {submitting ? 'Creating…' : 'Create Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
