import { useEffect, useState } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { Plus, ToggleLeft, ToggleRight, X, Users, Eye, EyeOff } from 'lucide-react';

const EMPTY_FORM = { name: '', email: '', password: '', role: 'accountant' };

export default function AccountantsPage() {
  const toast = useToast();
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState('');
  const [form, setForm]           = useState(EMPTY_FORM);
  const [showPw, setShowPw]       = useState(false);

  const fetchUsers = () =>
    api.get('/api/users')
      .then(r => setUsers(r.data.filter(u => u.role === 'accountant')))
      .finally(() => setLoading(false));

  useEffect(() => { fetchUsers(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/api/users', form);
      setShowModal(false);
      setForm(EMPTY_FORM);
      setShowPw(false);
      fetchUsers();
      toast.success('Accountant created successfully');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create accountant');
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => { setShowModal(false); setForm(EMPTY_FORM); setError(''); setShowPw(false); };

  const toggleUser = async (id) => {
    await api.patch(`/api/users/${id}/toggle`);
    fetchUsers();
  };

  const initials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="p-6 max-w-screen-xl">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[20px] font-semibold text-ink tracking-tight">Accountants</h1>
          <p className="text-ink-3 text-[13px] mt-0.5">Manage accountants in your firm</p>
        </div>
        <button className="btn-brand flex items-center gap-2" onClick={() => setShowModal(true)}>
          <Plus size={14} /> Add Accountant
        </button>
      </div>

      {/* List */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-12 shimmer-bg rounded-lg" />)}
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center mb-3">
              <Users size={20} className="text-brand-600" />
            </div>
            <p className="text-ink font-medium text-[14px]">No accountants yet</p>
            <p className="text-ink-3 text-[13px] mt-1">Click "Add Accountant" to invite one.</p>
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-line bg-canvas">
                <th className="text-left py-2.5 px-4 font-medium text-ink-3 text-[11px] uppercase tracking-wider">Name</th>
                <th className="text-left py-2.5 px-4 font-medium text-ink-3 text-[11px] uppercase tracking-wider">Email</th>
                <th className="text-left py-2.5 px-4 font-medium text-ink-3 text-[11px] uppercase tracking-wider">Status</th>
                <th className="py-2.5 px-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-canvas transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                           style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)' }}>
                        {initials(u.name)}
                      </div>
                      <span className="font-medium text-ink">{u.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-ink-2 font-mono text-[11.5px]">{u.email}</td>
                  <td className="py-3 px-4">
                    <span className={u.is_active ? 'badge-accepted' : 'badge-rejected'}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button onClick={() => toggleUser(u.id)} className="text-ink-3 hover:text-ink-2 transition-colors">
                      {u.is_active
                        ? <ToggleRight size={20} className="text-emerald-500" />
                        : <ToggleLeft size={20} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Accountant Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl border border-line w-full max-w-md animate-modal-in"
               style={{ boxShadow: '0 24px 60px -12px rgba(15,15,17,.18)' }}>
            <div className="flex items-center justify-between p-5 border-b border-line">
              <div>
                <h2 className="font-semibold text-ink">Add Accountant</h2>
                <p className="text-ink-3 text-[12px] mt-0.5">Creates a new accountant account in your firm</p>
              </div>
              <button onClick={closeModal} className="text-ink-3 hover:text-ink-2 transition-colors">
                <X size={17} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3" autoComplete="off">
              <div>
                <label className="block text-[12px] font-medium text-ink-2 mb-1.5">Full Name *</label>
                <input className="input" required autoComplete="off" placeholder="e.g. Amit Verma"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-ink-2 mb-1.5">Email *</label>
                <input className="input" type="email" required autoComplete="off" placeholder="amit@yourfirm.com"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-ink-2 mb-1.5">Password *</label>
                <div className="relative">
                  <input
                    className="input"
                    type={showPw ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    placeholder="••••••••"
                    style={{ paddingRight: '2.5rem' }}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPw(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink-2 transition-colors"
                  >
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
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
                  {submitting ? 'Creating…' : 'Add Accountant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
