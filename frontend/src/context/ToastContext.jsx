import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastCtx = createContext(null);

const CONFIG = {
  success: { bg: '#f0fdf4', border: '#bbf7d0', icon: '#16a34a', text: '#15803d', Icon: CheckCircle },
  error:   { bg: '#fef2f2', border: '#fecaca', icon: '#dc2626', text: '#b91c1c', Icon: XCircle   },
  warning: { bg: '#fffbeb', border: '#fde68a', icon: '#d97706', text: '#92400e', Icon: AlertCircle},
  info:    { bg: '#eff6ff', border: '#bfdbfe', icon: '#2563eb', text: '#1e40af', Icon: Info       },
};

function ToastItem({ id, msg, type, onDismiss }) {
  const [leaving, setLeaving] = useState(false);
  const c = CONFIG[type] || CONFIG.info;
  const { Icon } = c;

  const dismiss = useCallback(() => {
    setLeaving(true);
    setTimeout(() => onDismiss(id), 280);
  }, [id, onDismiss]);

  useEffect(() => {
    const t = setTimeout(dismiss, 4000);
    return () => clearTimeout(t);
  }, [dismiss]);

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: 14, padding: '12px 14px',
      minWidth: 280, maxWidth: 360,
      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      animation: `${leaving ? 'toastOut' : 'toastIn'} 0.28s cubic-bezier(.4,0,.2,1) forwards`,
    }}>
      <Icon size={16} style={{ color: c.icon, flexShrink: 0, marginTop: 1 }} />
      <p style={{ flex: 1, fontSize: 13, color: c.text, fontWeight: 500, lineHeight: 1.45 }}>{msg}</p>
      <button onClick={dismiss} style={{ color: c.icon, opacity: 0.5, flexShrink: 0, lineHeight: 0 }}>
        <X size={13} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((msg, type) => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, msg, type }]);
  }, []);

  const dismiss = useCallback((id) => setToasts(p => p.filter(t => t.id !== id)), []);

  const ctx = {
    success: (m) => add(m, 'success'),
    error:   (m) => add(m, 'error'),
    warning: (m) => add(m, 'warning'),
    info:    (m) => add(m, 'info'),
  };

  return (
    <ToastCtx.Provider value={ctx}>
      {children}
      <div style={{
        position: 'fixed', top: 20, right: 20, zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{ pointerEvents: 'all' }}>
            <ToastItem {...t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
      <style>{`
        @keyframes toastIn  { from { transform: translateX(110%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes toastOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(110%); opacity: 0; } }
        @keyframes fadeInUp { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes countUp  { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
