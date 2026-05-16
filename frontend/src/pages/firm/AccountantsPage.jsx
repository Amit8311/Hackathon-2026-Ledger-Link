import { useEffect, useState } from 'react';
import api from '../../api/client';
import { Plus, ToggleLeft, ToggleRight } from 'lucide-react';

export default function AccountantsPage() {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'accountant' });

  const fetchUsers = () => api.get('/api/users').then(r => setUsers(r.data.filter(u => u.role === 'accountant'))).finally(() => setLoading(false));
  useEffect(() => { fetchUsers(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/api/users', form);
      setShowForm(false);
      setForm({ name: '', email: '', password: '', role: 'accountant' });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create accountant');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleUser = async (id) => {
    await api.patch(`/api/users/${id}/toggle`);
    fetchUsers();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accountants</h1>
          <p className="text-gray-500 mt-1">Manage accountants in your firm</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> Add Accountant
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">New Accountant</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4" autoComplete="off">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input className="input" required autoComplete="off" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input className="input" type="email" required autoComplete="off" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <input className="input" type="password" required autoComplete="new-password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
            {error && <div className="md:col-span-2 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>}
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Creating...' : 'Add Accountant'}</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {loading ? (
          <p className="text-gray-400 text-sm">Loading...</p>
        ) : users.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No accountants yet.</p>
        ) : (
          <div className="space-y-3">
            {users.map(u => (
              <div key={u.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{u.name}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <button onClick={() => toggleUser(u.id)} className="text-gray-400 hover:text-blue-600">
                    {u.is_active ? <ToggleRight size={28} className="text-green-500" /> : <ToggleLeft size={28} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
