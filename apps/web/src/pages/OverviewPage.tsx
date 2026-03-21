import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSetupChecklist, type Checklist } from "../api/client";
import { useAuth } from "../auth/useAuth";
import { useTenantContext } from "../tenant/useTenantContext";

function Item({
  ok,
  label,
  to,
}: {
  ok: boolean;
  label: string;
  to: string;
}) {
  return (
    <li
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.55rem 0",
        borderBottom: "1px solid #e2e8f0",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            background: ok ? "#22c55e" : "#f97316",
          }}
        />
        {label}
      </span>
      <Link to={to} style={{ fontSize: 14 }}>
        Open
      </Link>
    </li>
  );
}

export function OverviewPage() {
  const { apiKey } = useAuth();
  const { selectedTenantId } = useTenantContext();
  const [data, setData] = useState<Checklist | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!apiKey || !selectedTenantId) return;
    let cancelled = false;
    void (async () => {
      try {
        const c = await getSetupChecklist(apiKey, selectedTenantId);
        if (!cancelled) setData(c);
      } catch (e) {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : "Failed to load checklist");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiKey, selectedTenantId]);

  if (!selectedTenantId) {
    return <p>Select a tenant from the header.</p>;
  }
  if (err) return <p style={{ color: "#b91c1c" }}>{err}</p>;
  if (!data) return <p>Loading checklist…</p>;

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Tenant setup</h1>
      <p style={{ color: "#64748b" }}>
        Complete these steps to reach a healthy MVP configuration.
      </p>
      <ul style={{ listStyle: "none", padding: 0, maxWidth: 560 }}>
        <Item
          ok={data.domain_registered}
          label="Domain registered"
          to="/domains"
        />
        <Item
          ok={data.domain_verified}
          label="Domain verified (DNS)"
          to="/domains"
        />
        <Item ok={data.sender_created} label="Sender created" to="/senders" />
        <Item
          ok={data.branding_configured}
          label="Branding configured"
          to="/branding"
        />
        <Item
          ok={data.template_published}
          label="Template published"
          to="/templates"
        />
        <Item ok={data.event_mapped} label="Event mapped" to="/events" />
      </ul>
    </div>
  );
}
