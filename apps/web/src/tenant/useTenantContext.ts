import { useContext } from "react";
import { TenantContext } from "./tenant-context";

export function useTenantContext() {
  const ctx = useContext(TenantContext);
  if (!ctx) {
    throw new Error("useTenantContext must be used within TenantProvider");
  }
  return ctx;
}
