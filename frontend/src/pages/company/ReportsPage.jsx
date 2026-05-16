import { useEffect, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { FileText, Download } from 'lucide-react';

const downloadReport = async (reportId, fileName) => {
  const res = await api.get(`/api/reports/${reportId}/download`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  window.URL.revokeObjectURL(url);
};

export default function ReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.company_id) return;
    api.get(`/api/reports/company/${user.company_id}`).then(r => setReports(r.data)).finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500 mt-1">MIS and other reports published by your accountant</p>
      </div>

      <div className="card">
        {loading ? (
          <p className="text-gray-400 text-sm">Loading...</p>
        ) : reports.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No reports published yet.</p>
            <p className="text-gray-400 text-xs mt-1">Your accountant will publish reports here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map(r => (
              <div key={r.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <FileText size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{r.title}</p>
                    <p className="text-xs text-gray-500">{r.report_type} · {r.file_name}</p>
                    {r.description && <p className="text-xs text-gray-400 mt-0.5">{r.description}</p>}
                  </div>
                </div>
                <button
                  onClick={() => downloadReport(r.id, r.file_name)}
                  className="btn-secondary flex items-center gap-2 text-sm"
                >
                  <Download size={14} /> Download
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
