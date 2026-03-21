import { FormEvent, useState } from "react";
import { apiFetch, parseJsonOrThrow } from "../api/client";
import { useAuth } from "../auth/useAuth";
import { useTenantContext } from "../tenant/useTenantContext";

export function EventsPage() {
  const { apiKey } = useAuth();
  const { selectedTenantId, refreshTenants } = useTenantContext();
  const [key, setKey] = useState("order.completed");
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!apiKey || !selectedTenantId) return;
    setMsg(null);
    const res = await apiFetch(
      `/v1/tenants/${selectedTenantId}/event-mappings`,
      {
        method: "POST",
        apiKey,
        body: JSON.stringify({ event_key: key.trim() }),
      },
    );
    try {
      await parseJsonOrThrow(res);
      setMsg("Event mapping recorded.");
      void refreshTenants();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Failed");
    }
  }

  if (!selectedTenantId) return <p>Select a tenant in the header.</p>;

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Event mappings</h1>
      <p style={{ color: "#64748b" }}>
        Sprint 2 stub: record a primary event key to complete the checklist. Full
        CRUD ships in Sprint 3.
      </p>
      <form onSubmit={onSubmit} style={{ maxWidth: 420 }}>
        <label style={{ display: "block", fontSize: 13 }}>Event key</label>
        <input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          style={{ width: "100%", marginBottom: 8 }}
          required
        />
        <button type="submit">Save mapping</button>
      </form>
      {msg ? <p style={{ marginTop: 12 }}>{msg}</p> : null}
    </div>
  );
}
