import { useRef, useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Upload, Sparkles, CheckCircle, AlertCircle, X, FileText } from 'lucide-react';

const TRANSACTION_TYPES = [
  { value: 'purchase_invoice', label: 'Purchase Invoice' },
  { value: 'sales_invoice',    label: 'Sales Invoice' },
  { value: 'payment',          label: 'Payment' },
  { value: 'salary_register',  label: 'Salary Register' },
  { value: 'bank_statement',   label: 'Bank Statement' },
  { value: 'ledger',           label: 'Transaction Ledger' },
];

const SCAN_STEPS = [
  'Reading document...', 'Detecting document type...', 'Extracting vendor details...',
  'Reading invoice number & date...', 'Calculating amounts & taxes...', 'Finalising extracted data...',
];

function ScanningOverlay({ fileName }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep(p => p < SCAN_STEPS.length - 1 ? p + 1 : p), 1200);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="card" style={{ borderColor: '#bfdbfe', backgroundColor: '#eff6ff' }}>
      <div className="text-center py-6">
        <div style={{ position: 'relative', width: 80, height: 100, margin: '0 auto 24px' }}>
          <div style={{ width: 80, height: 100, backgroundColor: 'white', border: '2px solid #93c5fd', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
            <FileText size={32} color="#3b82f6" />
            <div style={{ position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: '#2563eb', opacity: 0.8, animation: 'scanLine 1.5s ease-in-out infinite' }} />
          </div>
          <div style={{ position: 'absolute', top: -8, right: -8, width: 24, height: 24, backgroundColor: '#2563eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulse 1s ease-in-out infinite' }}>
            <Sparkles size={12} color="white" />
          </div>
        </div>
        <p className="text-blue-800 font-semibold text-base mb-1">AI Scanning Document</p>
        <p className="text-blue-500 text-xs mb-5 truncate max-w-xs mx-auto">{fileName}</p>
        <div className="text-left max-w-xs mx-auto space-y-2">
          {SCAN_STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: i < step ? '#22c55e' : i === step ? '#2563eb' : '#e5e7eb', transition: 'background 0.3s' }}>
                {i < step ? <span style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>✓</span>
                  : i === step ? <div style={{ width: 8, height: 8, borderRadius: '50%', border: '2px solid white', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                  : null}
              </div>
              <span style={{ fontSize: '0.8rem', color: i < step ? '#16a34a' : i === step ? '#1d4ed8' : '#9ca3af', fontWeight: i === step ? 600 : 400, transition: 'color 0.3s' }}>{s}</span>
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes scanLine{0%{top:0}50%{top:calc(100% - 2px)}100%{top:0}}@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.2)}}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export default function UploadPage() {
  const { user } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [files, setFiles]       = useState([]);
  const [txType, setTxType]     = useState('purchase_invoice');
  const [useAI, setUseAI]       = useState(true);
  const [uploading, setUploading] = useState(false);
  const [singleResult, setSingleResult] = useState(null);
  const [bulkResults, setBulkResults]   = useState(null);
  const [error, setError]       = useState('');
  const [dragOver, setDragOver] = useState(false);

  const addFiles = (incoming) => {
    const arr = Array.from(incoming).filter(f => /\.(pdf|jpg|jpeg|png|webp)$/i.test(f.name));
    setFiles(prev => {
      const names = new Set(prev.map(f => f.name));
      return [...prev, ...arr.filter(f => !names.has(f.name))];
    });
    setSingleResult(null);
    setBulkResults(null);
    setError('');
  };

  const removeFile = (i) => setFiles(prev => prev.filter((_, j) => j !== i));

  const handleUpload = async () => {
    if (files.length === 0) return;
    setError(''); setSingleResult(null); setBulkResults(null); setUploading(true);

    if (files.length === 1) {
      // Single upload
      const fd = new FormData();
      fd.append('file', files[0]);
      fd.append('transaction_type', txType);
      fd.append('company_id', user.company_id);
      fd.append('use_ai', useAI);
      try {
        const res = await api.post('/api/transactions/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setSingleResult(res.data);
        setFiles([]);
        toast.success(res.data.ai_extracted ? 'Document scanned & uploaded!' : 'Document uploaded successfully');
      } catch (err) {
        const msg = err.response?.data?.detail || 'Upload failed';
        setError(msg); toast.error(msg);
      }
    } else {
      // Bulk upload
      const fd = new FormData();
      files.forEach(f => fd.append('files', f));
      fd.append('transaction_type', txType);
      fd.append('company_id', user.company_id);
      fd.append('use_ai', useAI);
      try {
        const res = await api.post('/api/transactions/bulk', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setBulkResults(res.data);
        const ok   = res.data.results.filter(r => r.status === 'ok').length;
        const fail = res.data.results.filter(r => r.status === 'error').length;
        if (fail === 0) toast.success(`${ok} document${ok !== 1 ? 's' : ''} uploaded!`);
        else toast.error(`${ok} uploaded, ${fail} failed`);
        setFiles([]);
      } catch (err) {
        toast.error(err.response?.data?.detail || 'Bulk upload failed');
      }
    }
    setUploading(false);
  };

  const isSingle = files.length === 1;

  return (
    <div className="p-4 md:p-6 max-w-2xl space-y-5">
      <div>
        <div className="text-[11px] uppercase tracking-widest text-ink-3 font-medium">Company</div>
        <h1 className="text-[22px] font-semibold text-ink tracking-tight mt-0.5">Upload Documents</h1>
        <p className="text-ink-2 text-[13px] mt-0.5">Upload one or multiple invoices — AI auto-extracts the data.</p>
      </div>

      {/* Show scanning overlay only for single file */}
      {uploading && useAI && isSingle ? <ScanningOverlay fileName={files[0]?.name || 'document'} /> : (
        <>
          {/* Drop zone */}
          <div className="card">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
              onClick={() => files.length === 0 && fileInputRef.current.click()}
              style={{ cursor: files.length === 0 ? 'pointer' : 'default' }}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}
            >
              <Upload size={32} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-600 mb-1">Drag & drop or tap to select files</p>
              <p className="text-xs text-gray-400">PDF, JPG, PNG, WEBP · single or multiple files</p>
            </div>
            <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" multiple className="hidden"
                   onChange={e => addFiles(e.target.files)} />

            {/* Add more button when files already selected */}
            {files.length > 0 && (
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="mt-3 w-full text-center text-[12.5px] text-brand-600 font-medium py-2 rounded-lg border border-dashed border-brand-200 hover:bg-brand-50 transition-colors"
              >
                + Add more files
              </button>
            )}

            {/* File list */}
            {files.length > 0 && (
              <div className="mt-3 space-y-1.5 max-h-48 overflow-y-auto">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-canvas">
                    <FileText size={14} className="text-ink-3 flex-shrink-0" />
                    <span className="flex-1 text-[12.5px] text-ink truncate">{f.name}</span>
                    <span className="text-[11px] text-ink-3 flex-shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
                    <button type="button" onClick={() => removeFile(i)} className="text-ink-3 hover:text-red-500"><X size={13} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Options */}
          <div className="card space-y-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-ink-3 font-medium mb-1">Document Type</label>
              <select className="input text-[13px]" value={txType} onChange={e => setTxType(e.target.value)}>
                {TRANSACTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Sparkles size={16} className="text-blue-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">AI Auto-Extraction</p>
                <p className="text-xs text-blue-600">Gemini AI extracts vendor, amount, date and more</p>
              </div>
              <div onClick={() => setUseAI(!useAI)} style={{ width: 36, height: 20, borderRadius: 10, cursor: 'pointer', backgroundColor: useAI ? '#2563eb' : '#d1d5db', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: 'white', position: 'absolute', top: 2, transition: 'left 0.2s', left: useAI ? 18 : 2 }} />
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
            className="btn-primary w-full justify-center"
          >
            {uploading
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> {files.length > 1 ? `Processing ${files.length} files…` : 'Uploading…'}</>
              : <>{useAI ? <Sparkles size={16} /> : <Upload size={16} />} {files.length > 1 ? `Upload ${files.length} files` : useAI ? 'Upload & Scan with AI' : 'Upload Document'}</>}
          </button>
        </>
      )}

      {/* Single upload result */}
      {singleResult && (
        <div className="card" style={{ borderColor: '#bbf7d0', backgroundColor: '#f0fdf4' }}>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle size={18} className="text-green-600" />
            <h2 className="font-semibold text-green-900">{singleResult.ai_extracted ? 'AI Extracted Successfully!' : 'Document Uploaded'}</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[['Vendor', singleResult.vendor_name], ['Invoice #', singleResult.invoice_number], ['Date', singleResult.invoice_date],
              ['Amount', singleResult.amount ? `₹${Number(singleResult.amount).toLocaleString()}` : null],
              ['Tax', singleResult.tax_amount ? `₹${Number(singleResult.tax_amount).toLocaleString()}` : null],
              ['Total', singleResult.total_amount ? `₹${Number(singleResult.total_amount).toLocaleString()}` : null],
            ].filter(([, v]) => v).map(([label, value]) => (
              <div key={label} className="bg-white rounded-lg p-3 border border-green-100">
                <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                <p className="font-semibold text-gray-900">{value}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-green-200">
            <div className="w-2 h-2 rounded-full bg-yellow-400" />
            <p className="text-xs text-gray-500">Transaction submitted — awaiting accountant review.</p>
          </div>
        </div>
      )}

      {/* Bulk upload results */}
      {bulkResults && (
        <div className="card space-y-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[13px] font-semibold text-ink">Upload Results</p>
            <span className="text-[11px] text-ink-3">
              {bulkResults.results.filter(r => r.status === 'ok').length}/{bulkResults.total} succeeded
            </span>
          </div>
          {bulkResults.results.map((r, i) => (
            <div key={i} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px] ${r.status === 'ok' ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
              {r.status === 'ok'
                ? <CheckCircle size={14} className="text-green-600 flex-shrink-0" />
                : <AlertCircle size={14} className="text-red-500 flex-shrink-0" />}
              <span className="flex-1 truncate text-ink">{r.file}</span>
              {r.status === 'ok'
                ? <span className="text-green-600 text-[11px]">{r.ai_extracted ? 'AI extracted' : 'Uploaded'} · #{r.transaction_id}</span>
                : <span className="text-red-500 text-[11px]">{r.detail}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
