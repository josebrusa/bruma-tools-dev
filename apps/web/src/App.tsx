import type { ReactElement } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { useAuth } from "./auth/useAuth";
import { Layout } from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { TenantsPage } from "./pages/TenantsPage";

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
                <Layout />
              </Protected>
            }
          >
            <Route index element={<Navigate to="/tenants" replace />} />
            <Route path="tenants" element={<TenantsPage />} />
            <Route path="coming-soon" element={<PlaceholderPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
