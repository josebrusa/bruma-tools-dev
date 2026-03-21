import { useCallback, useEffect, useState, type CSSProperties } from "react";
import {
  ApiError,
  getEmailDispatch,
  listLogs,
  type EmailDispatchRow,
  type LogEntryRow,
} from "../api/client";
import { useAuth } from "../auth/useAuth";
import { useTenantContext } from "../tenant/useTenantContext";
import { EmptyState } from "../components/EmptyState";

const STATUS_OPTIONS = [
  "",
  "queued",
  "sending",
  "sent",
  "delivered",
  "bounced",
  "failed",
  "spam_complaint",
];

function statusBadgeStyle(status: string): CSSProperties {
  const base: CSSProperties = {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
  };
  switch (status) {
    case "queued":
      return { ...base, background: "#e2e8f0", color: "#334155" };
    case "sending":
      return { ...base, background: "#dbeafe", color: "#1d4ed8" };
    case "sent":
      return { ...base, background: "#e0f2fe", color: "#0369a1" };
    case "delivered":
      return { ...base, background: "#dcfce7", color: "#166534" };
    case "bounced":
      return { ...base, background: "#ffedd5", color: "#9a3412" };
    case "failed":
      return { ...base, background: "#fee2e2", color: "#991b1b" };
    case "spam_complaint":
      return { ...base, background: "#f3e8ff", color: "#6b21a8" };
    default:
      return { ...base, background: "#f1f5f9", color: "#475569" };
  }
}

function timelineLabel(eventType: string): string {
  const labels: Record<string, string> = {
    queued: "Queued",
    sending: "Sending",
    sent: "Sent to provider",
    delivered: "Delivered",
    bounced: "Bounced",
    failed: "Failed",
    spam_complaint: "Spam complaint",
  };
  return labels[eventType] ?? eventType;
}

export function LogsPage() {
  const { apiKey } = useAuth();
  const { selectedTenantId } = useTenantContext();
  const [rows, setRows] = useState<LogEntryRow[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [detail, setDetail] = useState<EmailDispatchRow | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadPage = useCallback(
    async (cursor?: string | null, append = false) => {
      if (!apiKey || !selectedTenantId) return;
      if (append) setLoadingMore(true);
      else setLoading(true);
      setBanner(null);
      try {
        const res = await listLogs(apiKey, {
          tenantId: selectedTenantId,
          status: status || undefined,
          from: from || undefined,
          to: to || undefined,
          limit: 40,
          cursor: cursor ?? undefined,
        });
        setRows((prev) => (append ? [...prev, ...res.data] : res.data));
        setNextCursor(res.next_cursor);
      } catch (e) {
        setBanner(e instanceof ApiError ? e.message : "Failed to load logs");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [apiKey, selectedTenantId, status, from, to],
  );

  useEffect(() => {
    void loadPage(null, false);
  }, [loadPage]);

  async function openDetail(row: LogEntryRow) {
    if (!apiKey || !selectedTenantId) return;
    setDetailLoading(true);
    setBanner(null);
    try {
      const d = await getEmailDispatch(
        apiKey,
        selectedTenantId,
        row.dispatch_id,
      );
      setDetail(d);
    } catch (e) {
      setBanner(e instanceof ApiError ? e.message : "Failed to load dispatch");
    } finally {
      setDetailLoading(false);
    }
  }

  if (!selectedTenantId) {
    return <p>Select a tenant in the header.</p>;
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Logs</h1>
      <p style={{ color: "#64748b", maxWidth: 640 }}>
        Delivery timeline per dispatch (provider webhooks and send milestones).
        Filter by status and time range; open a row for the full timeline.
      </p>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 16,
          alignItems: "flex-end",
        }}
      >
        <div>
          <label
            style={{ display: "block", fontSize: 12, color: "#64748b" }}
            htmlFor="log-status"
          >
            Dispatch status
          </label>
          <select
            id="log-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{ minWidth: 160, padding: "0.35rem 0.5rem" }}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s || "all"} value={s}>
                {s ? s.replace(/_/g, " ") : "Any status"}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            style={{ display: "block", fontSize: 12, color: "#64748b" }}
            htmlFor="log-from"
          >
            From (ISO date)
          </label>
          <input
            id="log-from"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="2025-01-01"
            style={{ padding: "0.35rem 0.5rem", minWidth: 160 }}
          />
        </div>
        <div>
          <label
            style={{ display: "block", fontSize: 12, color: "#64748b" }}
            htmlFor="log-to"
          >
            To (ISO date)
          </label>
          <input
            id="log-to"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="2025-12-31"
            style={{ padding: "0.35rem 0.5rem", minWidth: 160 }}
          />
        </div>
        <button
          type="button"
          onClick={() => void loadPage(null, false)}
          style={{
            padding: "0.4rem 0.85rem",
            borderRadius: 6,
            border: "1px solid #cbd5e1",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          Apply filters
        </button>
      </div>

      <p style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>
        <strong>Legend:</strong> queued · sent · delivered · bounced · failed ·
        spam complaint — colors match dispatch status badges in the table.
      </p>

      {banner ? (
        <p style={{ color: "#b91c1c", marginBottom: 12 }}>{banner}</p>
      ) : null}

      {loading ? (
        <p style={{ color: "#64748b" }}>Loading logs…</p>
      ) : rows.length === 0 ? (
        <EmptyState
          title="No log entries yet"
          description="Entries appear after dispatches are processed and when provider webhooks are received. Trigger a test send from the API and ensure the worker and webhook secret are configured."
        />
      ) : (
        <>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
              }}
            >
              <thead>
                <tr style={{ textAlign: "left", background: "#f8fafc" }}>
                  <th style={{ padding: 8 }}>Time</th>
                  <th style={{ padding: 8 }}>Event</th>
                  <th style={{ padding: 8 }}>Recipient</th>
                  <th style={{ padding: 8 }}>Dispatch status</th>
                  <th style={{ padding: 8 }}>Tenant</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    style={{
                      borderTop: "1px solid #e2e8f0",
                      cursor: "pointer",
                    }}
                    onClick={() => void openDetail(r)}
                  >
                    <td style={{ padding: 8, whiteSpace: "nowrap" }}>
                      {new Date(r.occurred_at).toLocaleString()}
                    </td>
                    <td style={{ padding: 8 }}>{r.event_name}</td>
                    <td style={{ padding: 8 }}>{r.recipient ?? "—"}</td>
                    <td style={{ padding: 8 }}>
                      <span style={statusBadgeStyle(r.dispatch_status)}>
                        {r.dispatch_status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: 8,
                        fontFamily: "ui-monospace, monospace",
                        fontSize: 11,
                      }}
                      title={r.tenant_id}
                    >
                      {r.tenant_id.slice(0, 8)}…
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {nextCursor ? (
            <button
              type="button"
              style={{ marginTop: 12 }}
              disabled={loadingMore}
              onClick={() => void loadPage(nextCursor, true)}
            >
              {loadingMore ? "Loading…" : "Load more"}
            </button>
          ) : null}
        </>
      )}

      {detail || detailLoading ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.35)",
            display: "flex",
            justifyContent: "flex-end",
            zIndex: 40,
          }}
          onClick={() => setDetail(null)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setDetail(null);
          }}
        >
          <div
            style={{
              width: "min(420px, 100%)",
              background: "#fff",
              height: "100%",
              boxShadow: "-4px 0 24px rgba(0,0,0,0.08)",
              padding: "1rem 1.25rem",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Dispatch detail</h2>
              <button
                type="button"
                onClick={() => setDetail(null)}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: "1.25rem",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>
            {detailLoading ? (
              <p style={{ color: "#64748b" }}>Loading…</p>
            ) : detail ? (
              <div style={{ marginTop: 12 }}>
                <p style={{ margin: "0 0 8px", fontSize: 13 }}>
                  <strong>Status:</strong>{" "}
                  <span style={statusBadgeStyle(detail.status)}>
                    {detail.status.replace(/_/g, " ")}
                  </span>
                </p>
                <p style={{ margin: "0 0 8px", fontSize: 13 }}>
                  <strong>Recipient:</strong> {detail.recipient_email || "—"}
                </p>
                <p style={{ margin: "0 0 8px", fontSize: 13 }}>
                  <strong>Event key:</strong> {detail.event_key ?? "—"}
                </p>
                <p style={{ margin: "0 0 8px", fontSize: 13 }}>
                  <strong>Correlation:</strong>{" "}
                  {detail.correlation_id ?? "—"}
                </p>
                <h3 style={{ fontSize: "0.95rem", marginTop: 16 }}>
                  Delivery timeline
                </h3>
                <ol style={{ paddingLeft: 18, margin: 0, fontSize: 13 }}>
                  {(detail.events ?? []).map((ev) => (
                    <li key={ev.id} style={{ marginBottom: 8 }}>
                      <strong>{timelineLabel(ev.event_type)}</strong>
                      <div style={{ color: "#64748b", fontSize: 12 }}>
                        {new Date(ev.occurred_at).toLocaleString()}
                      </div>
                    </li>
                  ))}
                </ol>
                {(detail.events ?? []).length === 0 ? (
                  <p style={{ color: "#64748b", fontSize: 13 }}>
                    No events recorded yet for this dispatch.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
