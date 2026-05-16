import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';

import Login from './pages/Login';

import PlatformDashboard from './pages/platform/PlatformDashboard';
import FirmsPage from './pages/platform/FirmsPage';

import FirmDashboard from './pages/firm/FirmDashboard';
import CompaniesPage from './pages/firm/CompaniesPage';
import AccountantsPage from './pages/firm/AccountantsPage';
import PaymentHeadsPage from './pages/firm/PaymentHeadsPage';

import CompanyDashboard from './pages/company/CompanyDashboard';
import UploadPage from './pages/company/UploadPage';
import TransactionsPage from './pages/company/TransactionsPage';
import ReportsPage from './pages/company/ReportsPage';

import AccountantDashboard from './pages/accountant/AccountantDashboard';
import ReviewPage from './pages/accountant/ReviewPage';
import UploadReportPage from './pages/accountant/UploadReportPage';

const roleHome = {
  platform_admin: '/platform',
  firm_admin: '/firm',
  accountant: '/accountant',
  company_admin: '/company',
  company_user: '/company',
};

function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={roleHome[user.role] || '/login'} replace />;
  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={roleHome[user.role] || '/login'} replace /> : <Login />} />

      {/* Platform Admin */}
      <Route path="/platform" element={<ProtectedRoute roles={['platform_admin']}><PlatformDashboard /></ProtectedRoute>} />
      <Route path="/platform/firms" element={<ProtectedRoute roles={['platform_admin']}><FirmsPage /></ProtectedRoute>} />

      {/* Firm Admin */}
      <Route path="/firm" element={<ProtectedRoute roles={['firm_admin']}><FirmDashboard /></ProtectedRoute>} />
      <Route path="/firm/companies" element={<ProtectedRoute roles={['firm_admin']}><CompaniesPage /></ProtectedRoute>} />
      <Route path="/firm/accountants" element={<ProtectedRoute roles={['firm_admin']}><AccountantsPage /></ProtectedRoute>} />
      <Route path="/firm/payment-heads" element={<ProtectedRoute roles={['firm_admin']}><PaymentHeadsPage /></ProtectedRoute>} />

      {/* Company */}
      <Route path="/company" element={<ProtectedRoute roles={['company_admin', 'company_user']}><CompanyDashboard /></ProtectedRoute>} />
      <Route path="/company/upload" element={<ProtectedRoute roles={['company_admin', 'company_user']}><UploadPage /></ProtectedRoute>} />
      <Route path="/company/transactions" element={<ProtectedRoute roles={['company_admin', 'company_user']}><TransactionsPage /></ProtectedRoute>} />
      <Route path="/company/reports" element={<ProtectedRoute roles={['company_admin', 'company_user']}><ReportsPage /></ProtectedRoute>} />

      {/* Accountant */}
      <Route path="/accountant" element={<ProtectedRoute roles={['accountant']}><AccountantDashboard /></ProtectedRoute>} />
      <Route path="/accountant/review" element={<ProtectedRoute roles={['accountant']}><ReviewPage /></ProtectedRoute>} />
      <Route path="/accountant/reports" element={<ProtectedRoute roles={['accountant']}><UploadReportPage /></ProtectedRoute>} />

      <Route path="*" element={user ? <Navigate to={roleHome[user.role] || '/login'} replace /> : <Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
