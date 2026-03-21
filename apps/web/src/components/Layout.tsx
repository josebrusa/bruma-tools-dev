import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

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
          <NavLink to="/tenants" style={navLinkStyle}>
            Tenants
          </NavLink>
          <NavLink to="/coming-soon" style={navLinkStyle}>
            More modules (soon)
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
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: "#64748b" }}>Active tenant</div>
            <div style={{ fontWeight: 600 }}>Not selected (stub)</div>
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
