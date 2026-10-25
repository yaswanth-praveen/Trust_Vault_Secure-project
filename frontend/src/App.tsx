import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext.js';
import { ToastProvider } from './components/ui/Toast.js';

import { DashboardLayout } from './layouts/DashboardLayout.js';
import { AuthLayout } from './layouts/AuthLayout.js';

import { Login } from './pages/auth/Login.js';
import { Overview } from './pages/dashboard/Overview.js';
import { DocumentList } from './pages/documents/DocumentList.js';
import { DocumentDetails } from './pages/documents/DocumentDetails.js';
import { UserManagement } from './pages/users/UserManagement.js';
import { AuditTrail } from './pages/audit/AuditTrail.js';
import { OrganizationSettings } from './pages/settings/OrganizationSettings.js';
import { OrganizationManagement } from './pages/superadmin/OrganizationManagement.js';
import { Forbidden } from './pages/error/Forbidden.js';
import { NotFound } from './pages/error/NotFound.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5000,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* Default entry point: always go to login first */}
              <Route path="/" element={<Navigate to="/login" replace />} />

              {/* Public Auth Routes */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
              </Route>

              {/* Protected Application Routes */}
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Overview />} />
                <Route path="/documents" element={<DocumentList />} />
                <Route path="/documents/:documentId" element={<DocumentDetails />} />
                <Route path="/users" element={<UserManagement />} />
                <Route path="/audit" element={<AuditTrail />} />
                <Route path="/settings" element={<OrganizationSettings />} />
                <Route path="/superadmin/organizations" element={<OrganizationManagement />} />
                <Route path="/403" element={<Forbidden />} />
              </Route>

              {/* Catch-all Not Found */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};
