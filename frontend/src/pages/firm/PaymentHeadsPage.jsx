import { useEffect, useState } from 'react';
import api from '../../api/client';
import { Plus, ChevronDown, ChevronRight } from 'lucide-react';

export default function PaymentHeadsPage() {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [heads, setHeads] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', description: '', sub_heads: [{ name: '', description: '' }] });

  useEffect(() => {
    api.get('/api/companies').then(r => {
      setCompanies(r.data);
      if (r.data.length > 0) setSelectedCompany(r.data[0].id);
    });
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      api.get(`/api/payment-heads/company/${selectedCompany}`).then(r => setHeads(r.data));
    }
  }, [selectedCompany]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/api/payment-heads', { ...form, company_id: selectedCompany });
      setShowForm(false);
      setForm({ name: '', description: '', sub_heads: [{ name: '', description: '' }] });
      api.get(`/api/payment-heads/company/${selectedCompany}`).then(r => setHeads(r.data));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const addSubHeadField = () => setForm({ ...form, sub_heads: [...form.sub_heads, { name: '', description: '' }] });

  const updateSubHead = (i, field, val) => {
    const subs = [...form.sub_heads];
    subs[i] = { ...subs[i], [field]: val };
    setForm({ ...form, sub_heads: subs });
  };

  const deleteHead = async (id) => {
    await api.delete(`/api/payment-heads/${id}`);
    setHeads(heads.filter(h => h.id !== id));
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Heads</h1>
          <p className="text-gray-500 mt-1">Configure payment categories per company</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowForm(!showForm)} disabled={!selectedCompany}>
          <Plus size={16} /> Add Payment Head
        </button>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Company</label>
        <select className="input max-w-xs" value={selectedCompany} onChange={e => setSelectedCompany(e.target.value)}>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">New Payment Head</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Head Name *</label>
                <input className="input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input className="input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Sub-Heads</label>
                <button type="button" onClick={addSubHeadField} className="text-blue-600 text-sm hover:underline flex items-center gap-1">
                  <Plus size={12} /> Add sub-head
                </button>
              </div>
              {form.sub_heads.map((s, i) => (
                <div key={i} className="grid grid-cols-2 gap-3 mb-2">
                  <input className="input" placeholder="Sub-head name" value={s.name} onChange={e => updateSubHead(i, 'name', e.target.value)} />
                  <input className="input" placeholder="Description" value={s.description} onChange={e => updateSubHead(i, 'description', e.target.value)} />
                </div>
              ))}
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>}
            <div className="flex gap-3">
              <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {heads.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-gray-400 text-sm">No payment heads configured for this company.</p>
          </div>
        ) : heads.map(head => (
          <div key={head.id} className="card">
            <div className="flex items-center justify-between">
              <button
                className="flex items-center gap-2 text-left"
                onClick={() => setExpanded({ ...expanded, [head.id]: !expanded[head.id] })}
              >
                {expanded[head.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span className="font-medium text-gray-900">{head.name}</span>
                {head.description && <span className="text-sm text-gray-500">— {head.description}</span>}
                <span className="text-xs text-gray-400 ml-2">{head.sub_heads?.length || 0} sub-heads</span>
              </button>
              <button onClick={() => deleteHead(head.id)} className="text-xs text-red-500 hover:text-red-700">Delete</button>
            </div>

            {expanded[head.id] && head.sub_heads?.length > 0 && (
              <div className="mt-3 ml-6 space-y-1">
                {head.sub_heads.map(sub => (
                  <div key={sub.id} className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                    {sub.name}
                    {sub.description && <span className="text-gray-400">— {sub.description}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
