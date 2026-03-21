import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { listTenants, type Tenant } from "../api/client";
import { useAuth } from "../auth/useAuth";
import { TenantContext } from "./tenant-context";

const STORAGE_KEY = "bruma_selected_tenant_id";

export function TenantProvider({ children }: { children: ReactNode }) {
  const { apiKey } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantIdState] = useState<string | null>(
    () => {
      try {
        return sessionStorage.getItem(STORAGE_KEY);
      } catch {
        return null;
      }
    },
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshTenants = useCallback(async () => {
    if (!apiKey) return;
    setLoading(true);
    setError(null);
    try {
      const rows = await listTenants(apiKey);
      setTenants(rows);
      let next: string | null = null;
      try {
        next = sessionStorage.getItem(STORAGE_KEY);
      } catch {
        next = null;
      }
      if (!next || !rows.some((t) => t.id === next)) {
        next = rows[0]?.id ?? null;
      }
      if (next) {
        try {
          sessionStorage.setItem(STORAGE_KEY, next);
        } catch {
          /* ignore */
        }
      }
      setSelectedTenantIdState(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tenants");
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  useEffect(() => {
    void refreshTenants();
  }, [refreshTenants]);

  const setSelectedTenantId = useCallback((id: string) => {
    sessionStorage.setItem(STORAGE_KEY, id);
    setSelectedTenantIdState(id);
  }, []);

  const selectedTenant =
    tenants.find((t) => t.id === selectedTenantId) ?? null;

  const value = useMemo(
    () => ({
      tenants,
      selectedTenantId,
      setSelectedTenantId,
      selectedTenant,
      refreshTenants,
      loading,
      error,
    }),
    [
      tenants,
      selectedTenantId,
      setSelectedTenantId,
      selectedTenant,
      refreshTenants,
      loading,
      error,
    ],
  );

  return (
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  );
}
