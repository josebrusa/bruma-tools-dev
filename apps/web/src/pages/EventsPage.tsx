import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ApiError,
  createEventMapping,
  deleteEventMapping,
  listEventMappings,
  listSenders,
  listTemplates,
  updateEventMapping,
  type EventMappingRow,
  type SenderRow,
  type TemplateRow,
} from "../api/client";
import { useAuth } from "../auth/useAuth";
import { useTenantContext } from "../tenant/useTenantContext";
import { EmptyState } from "../components/EmptyState";

export function EventsPage() {
  const { apiKey } = useAuth();
  const { selectedTenantId, refreshTenants } = useTenantContext();
  const [mappings, setMappings] = useState<EventMappingRow[]>([]);
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [senders, setSenders] = useState<SenderRow[]>([]);
  const [eventKey, setEventKey] = useState("order.completed");
  const [templateId, setTemplateId] = useState("");
  const [senderId, setSenderId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === templateId) ?? null,
    [templates, templateId],
  );
  const unpublishedWarning =
    templateId &&
    selectedTemplate &&
    !selectedTemplate.active_version_id;

  async function refresh() {
    if (!apiKey || !selectedTenantId) return;
    const [m, t, s] = await Promise.all([
      listEventMappings(apiKey, selectedTenantId),
      listTemplates(apiKey, selectedTenantId),
      listSenders(apiKey, selectedTenantId),
    ]);
    setMappings(m);
    setTemplates(t);
    setSenders(s);
  }

  useEffect(() => {
    if (!apiKey || !selectedTenantId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setMsg(null);
      try {
        await refresh();
      } catch (e) {
        if (!cancelled) {
          setMsg(e instanceof ApiError ? e.message : "Failed to load");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiKey, selectedTenantId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!apiKey || !selectedTenantId) return;
    if (unpublishedWarning) {
      setMsg("Choose a template with a published version before saving.");
      return;
    }
    setMsg(null);
    try {
      await createEventMapping(apiKey, selectedTenantId, {
        event_key: eventKey.trim(),
        template_id: templateId,
        sender_id: senderId,
        is_active: isActive,
      });
      setMsg("Event mapping created.");
      await refresh();
      void refreshTenants();
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : "Could not save");
    }
  }

  async function toggleActive(row: EventMappingRow) {
    if (!apiKey || !selectedTenantId) return;
    setMsg(null);
    try {
      await updateEventMapping(apiKey, selectedTenantId, row.id, {
        is_active: !row.is_active,
      });
      await refresh();
      void refreshTenants();
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : "Update failed");
    }
  }

  async function remove(row: EventMappingRow) {
    if (!apiKey || !selectedTenantId) return;
    const ok = window.confirm(`Delete mapping "${row.event_key}"?`);
    if (!ok) return;
    setMsg(null);
    try {
      await deleteEventMapping(apiKey, selectedTenantId, row.id);
      await refresh();
      void refreshTenants();
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : "Delete failed");
    }
  }

  if (!selectedTenantId) return <p>Select a tenant in the header.</p>;
  if (loading) return <p>Loading event mappings…</p>;

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Event mappings</h1>
      <p style={{ color: "#64748b", maxWidth: 560 }}>
        Map an event name to a published template and verified sender. Dispatch
        uses the active mapping for the event key.
      </p>

      <h2>Existing mappings</h2>
      {mappings.length === 0 ? (
        <EmptyState
          title="No event mappings yet"
          description="Create a mapping so POST /v1/dispatch can resolve a template and sender for your event name. You need a published template and a verified sender."
        />
      ) : (
        <ul style={{ listStyle: "none", padding: 0, maxWidth: 640 }}>
          {mappings.map((row) => (
            <li
              key={row.id}
              style={{
                borderBottom: "1px solid #e2e8f0",
                padding: "10px 0",
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <strong>{row.event_key}</strong>
                {!row.template_published ? (
                  <span style={{ marginLeft: 8, color: "#b45309", fontSize: 13 }}>
                    (template not published)
                  </span>
                ) : null}
                <div style={{ fontSize: 13, color: "#64748b" }}>
                  {row.template_name ?? "Template"} ·{" "}
                  {row.is_active ? "active" : "inactive"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={() => void toggleActive(row)}>
                  {row.is_active ? "Deactivate" : "Activate"}
                </button>
                <button type="button" onClick={() => void remove(row)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <h2 style={{ marginTop: 28 }}>Create mapping</h2>
      <form onSubmit={onSubmit} style={{ maxWidth: 480 }}>
        <label style={{ display: "block", fontSize: 13 }}>Event key</label>
        <input
          value={eventKey}
          onChange={(e) => setEventKey(e.target.value)}
          style={{ width: "100%", marginBottom: 10 }}
          required
        />

        <label style={{ display: "block", fontSize: 13 }}>Template</label>
        <select
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          style={{ width: "100%", marginBottom: 10 }}
          required
        >
          <option value="">Select template</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
              {t.active_version_id ? "" : " (not published)"}
            </option>
          ))}
        </select>
        {unpublishedWarning ? (
          <p style={{ color: "#b45309", fontSize: 14, marginTop: 0 }}>
            This template is not published. Publish it on the Templates screen
            before creating a mapping, or dispatch will fail validation.
          </p>
        ) : null}

        <label style={{ display: "block", fontSize: 13 }}>Sender</label>
        <select
          value={senderId}
          onChange={(e) => setSenderId(e.target.value)}
          style={{ width: "100%", marginBottom: 10 }}
          required
        >
          <option value="">Select sender</option>
          {senders.map((s) => (
            <option key={s.id} value={s.id}>
              {s.display_name} &lt;{s.email}&gt;
            </option>
          ))}
        </select>

        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          Active
        </label>

        <button
          type="submit"
          style={{ marginTop: 12 }}
          disabled={!!unpublishedWarning}
        >
          Save mapping
        </button>
      </form>

      {senders.length === 0 ? (
        <p style={{ color: "#64748b", marginTop: 16 }}>
          Add a sender on the Senders page (domain must be verified).
        </p>
      ) : null}

      {msg ? (
        <p style={{ marginTop: 16, color: msg.startsWith("Event") || msg.startsWith("Loading") ? "#15803d" : "#b91c1c" }}>
          {msg}
        </p>
      ) : null}
    </div>
  );
}
