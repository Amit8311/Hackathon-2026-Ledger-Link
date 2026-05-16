import { useRef, useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Upload, Sparkles, CheckCircle, AlertCircle, X, FileText } from 'lucide-react';

const TRANSACTION_TYPES = [
  { value: 'purchase_invoice', label: 'Purchase Invoice' },
  { value: 'sales_invoice', label: 'Sales Invoice' },
  { value: 'payment', label: 'Payment' },
  { value: 'salary_register', label: 'Salary Register' },
  { value: 'bank_statement', label: 'Bank Statement' },
  { value: 'ledger', label: 'Transaction Ledger' },
];

const SCAN_STEPS = [
  'Reading document...',
  'Detecting document type...',
  'Extracting vendor details...',
  'Reading invoice number & date...',
  'Calculating amounts & taxes...',
  'Finalizing extracted data...',
];

function ScanningOverlay({ fileName }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep(prev => (prev < SCAN_STEPS.length - 1 ? prev + 1 : prev));
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card" style={{ borderColor: '#bfdbfe', backgroundColor: '#eff6ff' }}>
      <div className="text-center py-6">

        {/* Scanning animation */}
        <div style={{ position: 'relative', width: 80, height: 100, margin: '0 auto 24px' }}>
          {/* Document */}
          <div style={{
            width: 80, height: 100, backgroundColor: 'white',
            border: '2px solid #93c5fd', borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'hidden',
          }}>
            <FileText size={32} color="#3b82f6" />
            {/* Scan line */}
            <div style={{
              position: 'absolute', left: 0, right: 0, height: 2,
              backgroundColor: '#2563eb', opacity: 0.8,
              animation: 'scanLine 1.5s ease-in-out infinite',
            }} />
          </div>
          {/* Sparkle */}
          <div style={{
            position: 'absolute', top: -8, right: -8,
            width: 24, height: 24, backgroundColor: '#2563eb',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'pulse 1s ease-in-out infinite',
          }}>
            <Sparkles size={12} color="white" />
          </div>
        </div>

        <p className="text-blue-800 font-semibold text-base mb-1">AI Scanning Document</p>
        <p className="text-blue-500 text-xs mb-5 truncate max-w-xs mx-auto">{fileName}</p>

        {/* Steps */}
        <div className="text-left max-w-xs mx-auto space-y-2">
          {SCAN_STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div style={{
                width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: i < step ? '#22c55e' : i === step ? '#2563eb' : '#e5e7eb',
                transition: 'background 0.3s',
              }}>
                {i < step ? (
                  <span style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>&#10003;</span>
                ) : i === step ? (
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    border: '2px solid white', borderTopColor: 'transparent',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                ) : null}
              </div>
              <span style={{
                fontSize: '0.8rem',
                color: i < step ? '#16a34a' : i === step ? '#1d4ed8' : '#9ca3af',
                fontWeight: i === step ? 600 : 400,
                transition: 'color 0.3s',
              }}>
                {s}
              </span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes scanLine {
          0% { top: 0; }
          50% { top: calc(100% - 2px); }
          100% { top: 0; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function UploadPage() {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [txType, setTxType] = useState('purchase_invoice');
  const [useAI, setUseAI] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setError('');
    setResult(null);
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('transaction_type', txType);
    formData.append('company_id', user.company_id);
    formData.append('use_ai', useAI);

    try {
      const res = await api.post('/api/transactions/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
      setFile(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Upload Financial Document</h1>
        <p className="text-gray-500 mt-1">Upload invoices, payments, or statements. AI will auto-extract the data.</p>
      </div>

      {/* Show scanning overlay while uploading with AI */}
      {uploading && useAI ? (
        <ScanningOverlay fileName={file?.name || 'document'} />
      ) : (
        <form onSubmit={handleUpload} className="space-y-6">

          {/* Drop Zone */}
          <div className="card">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => !file && fileInputRef.current.click()}
              style={{ cursor: file ? 'default' : 'pointer' }}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
              }`}
            >
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <CheckCircle size={20} className="text-green-600" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="text-gray-400 hover:text-red-500 ml-2"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <Upload size={32} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-600 mb-1">Drag & drop or click to upload</p>
                  <p className="text-xs text-gray-400">PDF, JPG, PNG, WEBP supported</p>
                </>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={e => setFile(e.target.files[0])}
            />

            {!file && (
              <p className="text-xs text-gray-400 text-center mt-2">
                or{' '}
                <button type="button" onClick={() => fileInputRef.current.click()} className="text-blue-600 hover:underline">
                  browse files
                </button>
              </p>
            )}
          </div>

          {/* Options */}
          <div className="card space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Document Type *</label>
              <select className="input" value={txType} onChange={e => setTxType(e.target.value)}>
                {TRANSACTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Sparkles size={16} className="text-blue-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">AI Auto-Extraction</p>
                <p className="text-xs text-blue-600">Gemini AI will extract vendor, amount, date and more</p>
              </div>
              <div
                onClick={() => setUseAI(!useAI)}
                style={{
                  width: 36, height: 20, borderRadius: 10, cursor: 'pointer',
                  backgroundColor: useAI ? '#2563eb' : '#d1d5db',
                  position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                }}
              >
                <div style={{
                  width: 16, height: 16, borderRadius: '50%', backgroundColor: 'white',
                  position: 'absolute', top: 2, transition: 'left 0.2s',
                  left: useAI ? 18 : 2,
                }} />
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary w-full justify-center"
            disabled={!file || uploading}
          >
            {uploading ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Uploading...</>
            ) : (
              <>{useAI ? <Sparkles size={16} /> : <Upload size={16} />} {useAI ? 'Upload & Scan with AI' : 'Upload Document'}</>
            )}
          </button>
        </form>
      )}

      {/* Result */}
      {result && (
        <div className="card mt-6" style={{ borderColor: '#bbf7d0', backgroundColor: '#f0fdf4' }}>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle size={18} className="text-green-600" />
            <h2 className="font-semibold text-green-900">
              {result.ai_extracted ? 'AI Extracted Successfully!' : 'Document Uploaded'}
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[
              ['Vendor', result.vendor_name],
              ['Invoice #', result.invoice_number],
              ['Date', result.invoice_date],
              ['Amount', result.amount ? `Rs. ${Number(result.amount).toLocaleString()}` : null],
              ['Tax', result.tax_amount ? `Rs. ${Number(result.tax_amount).toLocaleString()}` : null],
              ['Total', result.total_amount ? `Rs. ${Number(result.total_amount).toLocaleString()}` : null],
            ].filter(([, v]) => v).map(([label, value]) => (
              <div key={label} className="bg-white rounded-lg p-3 border border-green-100">
                <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                <p className="font-semibold text-gray-900">{value}</p>
              </div>
            ))}
            {result.description && (
              <div className="col-span-2 bg-white rounded-lg p-3 border border-green-100">
                <p className="text-xs text-gray-500 mb-0.5">Description</p>
                <p className="font-medium text-gray-900">{result.description}</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-green-200">
            <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
            <p className="text-xs text-gray-500">Transaction submitted — awaiting accountant review.</p>
          </div>
        </div>
      )}
    </div>
  );
}
