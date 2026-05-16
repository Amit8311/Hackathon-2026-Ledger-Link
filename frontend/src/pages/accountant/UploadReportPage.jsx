import { useEffect, useState } from 'react';
import api from '../../api/client';
import { Upload, CheckCircle, FileText, Download } from 'lucide-react';

const downloadReport = async (reportId, fileName) => {
  const res = await api.get(`/api/reports/${reportId}/download`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  window.URL.revokeObjectURL(url);
};

const REPORT_TYPES = ['MIS', 'Balance Sheet', 'P&L', 'Cash Flow', 'GST Report', 'Other'];

export default function UploadReportPage() {
  const [companies, setCompanies] = useState([]);
  const [reports, setReports] = useState([]);
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', report_type: 'MIS', company_id: '' });
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/companies').then(r => {
      setCompanies(r.data);
      if (r.data.length > 0) {
        const firstId = r.data[0].id;
        setForm(f => ({ ...f, company_id: firstId }));
        fetchReports(firstId);
      }
    });
  }, []);

  const fetchReports = (companyId) => {
    if (!companyId) return;
    api.get(`/api/reports/company/${companyId}`).then(r => setReports(r.data));
  };

  const handleCompanyChange = (id) => {
    setForm(f => ({ ...f, company_id: id }));
    fetchReports(id);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setError('');
    setSuccess(false);
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', form.title);
    formData.append('description', form.description);
    formData.append('report_type', form.report_type);
    formData.append('company_id', form.company_id);

    try {
      await api.post('/api/reports', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSuccess(true);
      setFile(null);
      setForm(f => ({ ...f, title: '', description: '' }));
      fetchReports(form.company_id);
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Upload Reports</h1>
        <p className="text-gray-500 mt-1">Publish MIS and other reports for company review</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Upload Form */}
        <div>
          <form onSubmit={handleSubmit} className="card space-y-4">
            <h2 className="font-semibold text-gray-900">Publish New Report</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
              <select className="input" required value={form.company_id}
                onChange={e => handleCompanyChange(e.target.value)}>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Report Title *</label>
              <input className="input" required value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. MIS Report April 2025" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
              <select className="input" value={form.report_type}
                onChange={e => setForm({ ...form, report_type: e.target.value })}>
                {REPORT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input className="input" value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Optional" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">File *</label>
              <input type="file" className="text-sm text-gray-600"
                onChange={e => setFile(e.target.files[0])} required />
              {file && <p className="text-xs text-gray-500 mt-1">{file.name}</p>}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
                {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm px-3 py-2 rounded-lg">
                <CheckCircle size={16} /> Report published successfully!
              </div>
            )}

            <button type="submit" className="btn-primary w-full justify-center" disabled={uploading || !file}>
              {uploading
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Uploading...</>
                : <><Upload size={16} /> Publish Report</>}
            </button>
          </form>
        </div>

        {/* Published Reports List */}
        <div>
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">
              Published Reports
              <span className="ml-2 text-xs font-normal text-gray-400">({reports.length})</span>
            </h2>

            {reports.length === 0 ? (
              <div className="text-center py-10">
                <FileText size={36} className="text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No reports published yet for this company.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map(r => (
                  <div key={r.id} className="flex items-start justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <FileText size={16} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{r.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {r.report_type} &middot; {r.file_name}
                        </p>
                        {r.description && (
                          <p className="text-xs text-gray-400 mt-0.5">{r.description}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => downloadReport(r.id, r.file_name)}
                      className="btn-secondary text-xs px-3 py-1.5 flex-shrink-0 ml-2"
                    >
                      <Download size={13} /> Download
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
