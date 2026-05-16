import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Building2, Users, FileText, Upload, ClipboardCheck,
  BarChart2, Home, UserCircle, KeyRound, LogOut, Shield, TrendingUp, Menu, X,
} from 'lucide-react';
import ProfileModal from './ProfileModal';
import ChangePasswordModal from './ChangePasswordModal';
import NotificationBell from './NotificationBell';

const PAGE_BG = {
  '/platform':             { img: '/bg/platform-dashboard.jpg',   overlay: 'rgba(250,250,249,0.82)' },
  '/platform/firms':       { img: '/bg/platform-firms.jpg',       overlay: 'rgba(250,250,249,0.82)' },
  '/firm':                 { img: '/bg/firm-dashboard.jpg',        overlay: 'rgba(250,250,249,0.82)' },
  '/firm/companies':       { img: '/bg/firm-companies.jpg',        overlay: 'rgba(250,250,249,0.82)' },
  '/firm/accountants':     { img: '/bg/firm-accountants.jpg',      overlay: 'rgba(250,250,249,0.82)' },
  '/firm/payment-heads':   { img: '/bg/firm-payment-heads.jpg',    overlay: 'rgba(250,250,249,0.82)' },
  '/accountant':           { img: '/bg/accountant-dashboard.jpg',  overlay: 'rgba(250,250,249,0.82)' },
  '/accountant/review':    { img: '/bg/accountant-review.jpg',     overlay: 'rgba(250,250,249,0.82)' },
  '/accountant/reports':   { img: '/bg/accountant-reports.jpg',    overlay: 'rgba(250,250,249,0.82)' },
  '/company':              { img: '/bg/company-dashboard.jpg',     overlay: 'rgba(250,250,249,0.82)' },
  '/company/upload':       { img: '/bg/company-upload.jpg',        overlay: 'rgba(250,250,249,0.82)' },
  '/company/transactions': { img: '/bg/company-transactions.jpg',  overlay: 'rgba(250,250,249,0.82)' },
  '/company/reports':      { img: '/bg/company-reports.jpg',       overlay: 'rgba(250,250,249,0.82)' },
};

const roleNavMap = {
  platform_admin: [
    { to: '/platform',       label: 'Dashboard',        icon: Home,           group: 'Overview' },
    { to: '/platform/firms', label: 'Accounting Firms', icon: Building2,      group: 'Admin' },
  ],
  firm_admin: [
    { to: '/firm',                label: 'Dashboard',     icon: Home,      group: 'Overview' },
    { to: '/firm/companies',      label: 'Companies',     icon: Building2, group: 'Work' },
    { to: '/firm/accountants',    label: 'Accountants',   icon: Users,     group: 'Work' },
    { to: '/firm/payment-heads',  label: 'Payment Heads', icon: FileText,  group: 'Work' },
    { to: '/firm/audit',          label: 'Audit Trail',   icon: Shield,    group: 'Work' },
  ],
  accountant: [
    { to: '/accountant',          label: 'Dashboard',           icon: Home,           group: 'Overview' },
    { to: '/accountant/review',   label: 'Review Transactions', icon: ClipboardCheck, group: 'Work' },
    { to: '/accountant/reports',  label: 'Upload Reports',      icon: Upload,         group: 'Work' },
  ],
  company_admin: [
    { to: '/company',               label: 'Dashboard',        icon: Home,        group: 'Overview' },
    { to: '/company/upload',        label: 'Upload',           icon: Upload,      group: 'Work' },
    { to: '/company/transactions',  label: 'Transactions',     icon: FileText,    group: 'Work' },
    { to: '/company/reports',       label: 'Reports',          icon: BarChart2,   group: 'Work' },
    { to: '/company/insights',      label: 'Insights',         icon: TrendingUp,  group: 'Work' },
  ],
  company_user: [
    { to: '/company',               label: 'Dashboard',        icon: Home,        group: 'Overview' },
    { to: '/company/upload',        label: 'Upload',           icon: Upload,      group: 'Work' },
    { to: '/company/transactions',  label: 'Transactions',     icon: FileText,    group: 'Work' },
    { to: '/company/insights',      label: 'Insights',         icon: TrendingUp,  group: 'Work' },
  ],
};

const workspaceMap = {
  platform_admin: { name: 'LedgerLink',     type: 'Platform',       initials: 'LL' },
  firm_admin:     { name: 'Firm Portal',    type: 'Administration', initials: 'FP' },
  accountant:     { name: 'Firm Portal',    type: 'Accountant',     initials: 'FP' },
  company_admin:  { name: 'Company Portal', type: 'Administration', initials: 'CP' },
  company_user:   { name: 'Company Portal', type: 'Company User',   initials: 'CP' },
};

const exactRoots = ['/platform', '/firm', '/accountant', '/company'];

const API_URL = import.meta.env.VITE_API_URL ?? '';

function UserMenu({ user, initials, onProfile, onChangePw }) {
  const { logout } = useAuth();
  const navigate   = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => { setOpen(false); logout(); navigate('/login'); };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center gap-2.5 p-2 rounded-xl border border-line hover:bg-canvas transition-colors text-left"
      >
        <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden border border-line bg-brand-50 flex-shrink-0">
          {user?.profile_photo ? (
            <img src={`${API_URL}/uploads/profiles/${user.profile_photo}`} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[11.5px] font-semibold text-brand-700">{initials}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12.5px] font-medium leading-tight truncate text-ink">{user?.name}</div>
          <div className="text-[10.5px] text-ink-3 font-mono truncate">{user?.email}</div>
        </div>
      </button>

      {open && (
        <div
          className="absolute left-0 bottom-full mb-2 w-56 border border-line rounded-2xl overflow-hidden"
          style={{ backgroundColor: 'white', boxShadow: '0 -8px 32px -4px rgba(15,15,17,.14), 0 0 0 1px rgba(15,15,17,.06)' }}
        >
          <div className="px-4 py-3 border-b border-line">
            <p className="text-[13px] font-semibold text-ink truncate">{user?.name}</p>
            <p className="text-[11px] text-ink-3 font-mono truncate">{user?.email}</p>
          </div>
          <div className="py-1">
            <button onClick={() => { setOpen(false); onProfile(); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-ink hover:bg-canvas transition-colors text-left">
              <UserCircle size={15} className="text-ink-3 flex-shrink-0" /> Edit Profile
            </button>
            <button onClick={() => { setOpen(false); onChangePw(); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-ink hover:bg-canvas transition-colors text-left">
              <KeyRound size={15} className="text-ink-3 flex-shrink-0" /> Change Password
            </button>
          </div>
          <div className="border-t border-line py-1">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-red-600 hover:bg-red-50 transition-colors text-left">
              <LogOut size={15} className="flex-shrink-0" /> Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location  = useLocation();
  const navigate  = useNavigate();

  const [showProfile,    setShowProfile]    = useState(false);
  const [showChangePw,   setShowChangePw]   = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const navItems  = roleNavMap[user?.role] || [];
  const workspace = workspaceMap[user?.role] || { name: 'LedgerLink', type: '', initials: 'LL' };

  const groups = navItems.reduce((acc, item) => {
    (acc[item.group] = acc[item.group] || []).push(item);
    return acc;
  }, {});

  const initials = (user?.name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const isActive = (to) =>
    exactRoots.includes(to)
      ? location.pathname === to
      : location.pathname === to || location.pathname.startsWith(to + '/');

  const pageBg = PAGE_BG[location.pathname];
  const mainStyle = pageBg?.img
    ? {
        backgroundImage: `linear-gradient(${pageBg.overlay}, ${pageBg.overlay}), url("${pageBg.img}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundAttachment: 'fixed',
      }
    : {};

  const handleMobileLogout = () => { setShowMobileMenu(false); logout(); navigate('/login'); };

  return (
    <div className="flex h-screen bg-canvas">

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-60 border-r border-line flex-col h-screen flex-shrink-0"
             style={{ backgroundColor: 'white' }}>

        <div className="p-3 border-b border-line">
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg border border-line" style={{ backgroundColor: 'var(--canvas)' }}>
            <span className="w-7 h-7 rounded-md flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 font-mono"
                  style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)' }}>
              {workspace.initials}
            </span>
            <div className="flex-1 min-w-0">
              <span className="block text-[12.5px] font-semibold leading-tight truncate text-ink">{workspace.name}</span>
              <span className="block text-[10.5px] text-ink-3 font-mono truncate">{workspace.type}</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 overflow-auto py-2">
          {Object.entries(groups).map(([group, items]) => (
            <div key={group} className="mt-3 first:mt-1">
              <div className="mb-1.5 px-2 text-[10px] uppercase tracking-widest text-ink-3 font-medium">{group}</div>
              {items.map(({ to, label, icon: Icon }) => (
                <Link key={to} to={to}
                  className={`flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg mb-0.5 transition-colors text-[13px] font-medium ${
                    isActive(to) ? 'text-brand-700 bg-brand-50 ring-1 ring-inset ring-brand-600/15' : 'text-ink-2 hover:text-ink'
                  }`}>
                  <Icon size={15} />
                  {label}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-line">
          <UserMenu user={user} initials={initials} onProfile={() => setShowProfile(true)} onChangePw={() => setShowChangePw(true)} />
        </div>
      </aside>

      {/* ── Mobile top header ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 border-b border-line"
           style={{ backgroundColor: 'white' }}>
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-md flex items-center justify-center text-white text-[11px] font-bold font-mono"
                style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)' }}>
            {workspace.initials}
          </span>
          <span className="text-[15px] font-semibold text-ink">{workspace.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <button
            onClick={() => setShowMobileMenu(p => !p)}
            className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden border border-line bg-brand-50"
          >
            {user?.profile_photo ? (
              <img src={`${API_URL}/uploads/profiles/${user.profile_photo}`} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[11px] font-semibold text-brand-700">{initials}</span>
            )}
          </button>
        </div>
      </div>

      {/* ── Mobile user dropdown ── */}
      {showMobileMenu && (
        <div className="md:hidden fixed inset-0 z-40" onClick={() => setShowMobileMenu(false)}>
          <div
            className="absolute top-14 right-3 w-56 border border-line rounded-2xl overflow-hidden"
            style={{ backgroundColor: 'white', boxShadow: '0 8px 32px -4px rgba(15,15,17,.18)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-line">
              <p className="text-[13px] font-semibold text-ink truncate">{user?.name}</p>
              <p className="text-[11px] text-ink-3 font-mono truncate">{user?.email}</p>
            </div>
            <div className="py-1">
              <button onClick={() => { setShowMobileMenu(false); setShowProfile(true); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-ink hover:bg-canvas transition-colors text-left">
                <UserCircle size={15} className="text-ink-3" /> Edit Profile
              </button>
              <button onClick={() => { setShowMobileMenu(false); setShowChangePw(true); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-ink hover:bg-canvas transition-colors text-left">
                <KeyRound size={15} className="text-ink-3" /> Change Password
              </button>
            </div>
            <div className="border-t border-line py-1">
              <button onClick={handleMobileLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-red-600 hover:bg-red-50 transition-colors text-left">
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <main className="flex-1 overflow-auto relative pt-[53px] md:pt-0 pb-16 md:pb-0"
            style={{ backgroundColor: 'var(--canvas)', ...mainStyle }}>
        <div className="sticky top-0 left-0 right-0 h-px pointer-events-none" style={{
          background: 'linear-gradient(90deg, transparent 0%, #4F46E5 40%, #7C3AED 60%, transparent 100%)',
          opacity: 0.4,
          zIndex: 10,
        }} />

        {/* Notification bell — desktop only (mobile shows in top header) */}
        <div className="hidden md:block absolute top-4 right-5 z-20">
          <NotificationBell />
        </div>

        <div className="pointer-events-none fixed inset-0 md:left-60" style={{
          backgroundImage: 'radial-gradient(rgba(79,70,229,.06) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          zIndex: 0,
        }} />

        <div className="relative" style={{ zIndex: 1 }}>
          {children}
        </div>
      </main>

      {/* ── Mobile bottom navigation ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex border-t border-line"
           style={{ backgroundColor: 'white' }}>
        {navItems.slice(0, 5).map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors ${
              isActive(to) ? 'text-brand-600' : 'text-ink-3'
            }`}
          >
            <Icon size={20} strokeWidth={isActive(to) ? 2.5 : 1.75} />
            <span className="text-[9.5px] font-medium truncate w-full text-center px-0.5 leading-tight">
              {label}
            </span>
          </Link>
        ))}
      </nav>

      {showProfile  && <ProfileModal       onClose={() => setShowProfile(false)} />}
      {showChangePw && <ChangePasswordModal onClose={() => setShowChangePw(false)} />}
    </div>
  );
}
