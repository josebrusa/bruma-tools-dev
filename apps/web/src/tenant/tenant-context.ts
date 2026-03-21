import { createContext } from "react";
import type { Tenant } from "../api/client";

export type TenantContextValue = {
  tenants: Tenant[];
  selectedTenantId: string | null;
  setSelectedTenantId: (id: string) => void;
  selectedTenant: Tenant | null;
  refreshTenants: () => Promise<void>;
  loading: boolean;
  error: string | null;
};

export const TenantContext = createContext<TenantContextValue | null>(null);
