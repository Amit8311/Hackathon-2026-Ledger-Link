import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import api from '../api/client';
import { useNavigate } from 'react-router-dom';

export default function NotificationBell() {
  const [notifs, setNotifs]       = useState([]);
  const [unread, setUnread]       = useState(0);
  const [open, setOpen]           = useState(false);
  const [loading, setLoading]     = useState(false);
  const ref                       = useRef(null);
  const navigate                  = useNavigate();

  const fetchUnread = async () => {
    try {
      const res = await api.get('/api/notifications/unread-count');
      setUnread(res.data.count);
    } catch {}
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/notifications/');
      setNotifs(res.data);
      setUnread(res.data.filter(n => !n.is_read).length);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchUnread();
    const id = setInterval(fetchUnread, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    setOpen(p => !p);
    if (!open) fetchAll();
  };

  const markRead = async (id) => {
    await api.patch(`/api/notifications/${id}/read`);
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    await api.patch('/api/notifications/read-all');
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnread(0);
  };

  const handleClick = (n) => {
    markRead(n.id);
    if (n.transaction_id) navigate('/company/transactions');
    setOpen(false);
  };

  const fmt = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative w-8 h-8 flex items-center justify-center rounded-lg border border-line hover:bg-surface transition-colors"
        style={{ backgroundColor: 'var(--canvas)' }}
        title="Notifications"
      >
        <Bell size={16} className="text-ink-2" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-line overflow-hidden z-50"
          style={{ backgroundColor: 'var(--surface)', boxShadow: '0 8px 32px -4px rgba(15,15,17,.18), 0 0 0 1px rgba(15,15,17,.06)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            <span className="text-[13px] font-semibold text-ink">Notifications</span>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-[11px] text-brand-600 hover:text-brand-800 font-medium">
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading && (
              <div className="px-4 py-6 text-center text-[12px] text-ink-3">Loading…</div>
            )}
            {!loading && notifs.length === 0 && (
              <div className="px-4 py-8 text-center">
                <Bell size={24} className="mx-auto text-ink-4 mb-2" />
                <p className="text-[12px] text-ink-3">No notifications yet</p>
              </div>
            )}
            {!loading && notifs.map(n => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full text-left px-4 py-3 border-b border-line last:border-0 hover:bg-canvas transition-colors ${!n.is_read ? 'bg-brand-50/40' : ''}`}
              >
                <div className="flex items-start gap-2.5">
                  <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!n.is_read ? 'bg-brand-500' : 'bg-transparent'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-[12.5px] leading-snug ${!n.is_read ? 'text-ink font-medium' : 'text-ink-2'}`}>
                      {n.message}
                    </p>
                    <p className="text-[10.5px] text-ink-3 mt-0.5">{fmt(n.created_at)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
