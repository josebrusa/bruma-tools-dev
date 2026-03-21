import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { useTenantContext } from "../tenant/useTenantContext";

const navLinkStyle = ({ isActive }: { isActive: boolean }) => ({
  display: "block",
  padding: "0.5rem 0.75rem",
  borderRadius: 6,
  textDecoration: "none",
  color: isActive ? "#0f172a" : "#475569",
  background: isActive ? "#e2e8f0" : "transparent",
  fontWeight: isActive ? 600 : 500,
});

export function Layout() {
  const { signOut } = useAuth();
  const {
    tenants,
    selectedTenantId,
    setSelectedTenantId,
    selectedTenant,
    loading,
  } = useTenantContext();

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "240px 1fr",
        minHeight: "100vh",
        fontFamily:
          'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        color: "#0f172a",
        background: "#f8fafc",
      }}
    >
      <aside
        style={{
          borderRight: "1px solid #e2e8f0",
          padding: "1rem",
          background: "#fff",
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: "1rem" }}>Bruma</div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <NavLink to="/overview" style={navLinkStyle}>
            Overview
          </NavLink>
          <NavLink to="/tenants" style={navLinkStyle}>
            Tenants
          </NavLink>
          <NavLink to="/domains" style={navLinkStyle}>
            Domains
          </NavLink>
          <NavLink to="/senders" style={navLinkStyle}>
            Senders
          </NavLink>
          <NavLink to="/branding" style={navLinkStyle}>
            Branding
          </NavLink>
          <NavLink to="/templates" style={navLinkStyle}>
            Templates
          </NavLink>
          <NavLink to="/events" style={navLinkStyle}>
            Events
          </NavLink>
          <NavLink to="/coming-soon" style={navLinkStyle}>
            More (soon)
          </NavLink>
        </nav>
      </aside>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.75rem 1.25rem",
            borderBottom: "1px solid #e2e8f0",
            background: "#fff",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontSize: 12, color: "#64748b" }}>Active tenant</div>
            {tenants.length > 1 ? (
              <select
                value={selectedTenantId ?? ""}
                onChange={(e) => setSelectedTenantId(e.target.value)}
                style={{ minWidth: 220, padding: "0.35rem 0.5rem" }}
                disabled={loading}
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.slug})
                  </option>
                ))}
              </select>
            ) : (
              <div style={{ fontWeight: 600 }}>
                {loading
                  ? "Loading…"
                  : selectedTenant
                    ? `${selectedTenant.name} (${selectedTenant.slug})`
                    : "None"}
              </div>
            )}
            {selectedTenant ? (
              <div style={{ fontSize: 12, color: "#64748b" }}>
                Status:{" "}
                <strong>
                  {selectedTenant.is_active ? "active" : "inactive"}
                </strong>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => signOut()}
            style={{
              border: "1px solid #cbd5e1",
              background: "#fff",
              borderRadius: 6,
              padding: "0.35rem 0.75rem",
              cursor: "pointer",
            }}
          >
            Sign out
          </button>
        </header>
        <main style={{ padding: "1.25rem" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
