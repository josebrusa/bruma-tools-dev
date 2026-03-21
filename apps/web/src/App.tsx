import type { ReactElement } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { useAuth } from "./auth/useAuth";
import { Layout } from "./components/Layout";
import { BrandingPage } from "./pages/BrandingPage";
import { DomainsPage } from "./pages/DomainsPage";
import { EventsPage } from "./pages/EventsPage";
import { LogsPage } from "./pages/LogsPage";
import { LoginPage } from "./pages/LoginPage";
import { OverviewPage } from "./pages/OverviewPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { SendersPage } from "./pages/SendersPage";
import { TemplatesPage } from "./pages/TemplatesPage";
import { TenantsPage } from "./pages/TenantsPage";
import { TenantProvider } from "./tenant/TenantContext";

function Protected({ children }: { children: ReactElement }) {
  const { apiKey } = useAuth();
  if (!apiKey) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <Protected>
                <TenantProvider>
                  <Layout />
                </TenantProvider>
              </Protected>
            }
          >
            <Route index element={<Navigate to="/overview" replace />} />
            <Route path="overview" element={<OverviewPage />} />
            <Route path="tenants" element={<TenantsPage />} />
            <Route path="domains" element={<DomainsPage />} />
            <Route path="senders" element={<SendersPage />} />
            <Route path="branding" element={<BrandingPage />} />
            <Route path="templates" element={<TemplatesPage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="logs" element={<LogsPage />} />
            <Route path="coming-soon" element={<PlaceholderPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
