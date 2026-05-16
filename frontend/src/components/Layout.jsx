import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Building2, Users, FileText, Upload, ClipboardCheck,
  BarChart2, Home, MoreVertical,
} from 'lucide-react';
import ProfileModal from './ProfileModal';

// Drop images into public/bg/ and they will apply automatically.
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
  ],
  accountant: [
    { to: '/accountant',          label: 'Dashboard',           icon: Home,            group: 'Overview' },
    { to: '/accountant/review',   label: 'Review Transactions', icon: ClipboardCheck,  group: 'Work' },
    { to: '/accountant/reports',  label: 'Upload Reports',      icon: Upload,          group: 'Work' },
  ],
  company_admin: [
    { to: '/company',               label: 'Dashboard',        icon: Home,      group: 'Overview' },
    { to: '/company/upload',        label: 'Upload Documents', icon: Upload,    group: 'Work' },
    { to: '/company/transactions',  label: 'Transactions',     icon: FileText,  group: 'Work' },
    { to: '/company/reports',       label: 'Reports',          icon: BarChart2, group: 'Work' },
  ],
  company_user: [
    { to: '/company',               label: 'Dashboard',        icon: Home,     group: 'Overview' },
    { to: '/company/upload',        label: 'Upload Documents', icon: Upload,   group: 'Work' },
    { to: '/company/transactions',  label: 'Transactions',     icon: FileText, group: 'Work' },
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

export default function Layout({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const [showProfile, setShowProfile] = useState(false);

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

  return (
    <div className="flex h-screen bg-canvas">

      {/* Sidebar */}
      <aside className="w-60 bg-surface border-r border-line flex flex-col h-screen flex-shrink-0">

        {/* Workspace switcher */}
        <div className="p-3 border-b border-line">
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-canvas border border-line">
            <span
              className="w-7 h-7 rounded-md flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 font-mono"
              style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)' }}
            >
              {workspace.initials}
            </span>
            <div className="flex-1 min-w-0">
              <span className="block text-[12.5px] font-semibold leading-tight truncate text-ink">
                {workspace.name}
              </span>
              <span className="block text-[10.5px] text-ink-3 font-mono truncate">
                {workspace.type}
              </span>
            </div>
          </div>
        </div>

        {/* Nav groups */}
        <nav className="flex-1 px-3 overflow-auto py-2">
          {Object.entries(groups).map(([group, items]) => (
            <div key={group} className="mt-3 first:mt-1">
              <div className="mb-1.5 px-2 text-[10px] uppercase tracking-widest text-ink-3 font-medium">
                {group}
              </div>
              {items.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg mb-0.5 transition-colors text-[13px] font-medium ${
                    isActive(to)
                      ? 'text-brand-700 bg-brand-50 ring-1 ring-inset ring-brand-600/15'
                      : 'text-ink-2 hover:bg-canvas hover:text-ink'
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* User cell */}
        <div className="p-3 border-t border-line">
          <button
            onClick={() => setShowProfile(true)}
            className="w-full flex items-center gap-2.5 p-2 rounded-xl border border-line hover:bg-canvas transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden border-2 border-line flex-shrink-0 bg-brand-50">
              {user?.profile_photo ? (
                <img src={`http://localhost:8000/uploads/profiles/${user.profile_photo}`} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[11.5px] font-semibold text-brand-700">{initials}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-medium leading-tight truncate text-ink">{user?.name}</div>
              <div className="text-[10.5px] text-ink-3 font-mono truncate">{user?.email}</div>
            </div>
            <MoreVertical size={14} className="text-ink-3 flex-shrink-0" />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto relative bg-canvas" style={mainStyle}>

        {/* Top accent line */}
        <div className="sticky top-0 left-0 right-0 h-px pointer-events-none" style={{
          background: 'linear-gradient(90deg, transparent 0%, #4F46E5 40%, #7C3AED 60%, transparent 100%)',
          opacity: 0.4,
          zIndex: 10,
        }} />

        {/* Dot-grid texture */}
        <div className="pointer-events-none fixed inset-0 left-60" style={{
          backgroundImage: 'radial-gradient(rgba(15,15,17,.045) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          zIndex: 0,
        }} />

        <div className="relative" style={{ zIndex: 1 }}>
          {children}
        </div>
      </main>

      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </div>
  );
}
