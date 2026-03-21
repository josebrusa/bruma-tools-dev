import { FormEvent, useEffect, useState } from "react";
import {
  ApiError,
  getDnsRecords,
  listDomains,
  registerDomain,
  verifyDomain,
  type DnsBundle,
  type DomainRow,
} from "../api/client";
import { useAuth } from "../auth/useAuth";
import { useTenantContext } from "../tenant/useTenantContext";

function RecordTable({
  bundle,
}: {
  bundle: DnsBundle;
}) {
  const rows = [bundle.spf, bundle.dkim, bundle.dmarc];
  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  }
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <thead>
        <tr style={{ textAlign: "left", background: "#f1f5f9" }}>
          <th style={{ padding: 6 }}>Purpose</th>
          <th style={{ padding: 6 }}>Name</th>
          <th style={{ padding: 6 }}>Value</th>
          <th style={{ padding: 6 }} />
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.name + r.purpose} style={{ borderTop: "1px solid #e2e8f0" }}>
            <td style={{ padding: 6, verticalAlign: "top" }}>{r.purpose}</td>
            <td
              style={{
                padding: 6,
                verticalAlign: "top",
                fontFamily: "ui-monospace, monospace",
              }}
            >
              {r.name}
            </td>
            <td
              style={{
                padding: 6,
                verticalAlign: "top",
                fontFamily: "ui-monospace, monospace",
                wordBreak: "break-all",
              }}
            >
              {r.value}
            </td>
            <td style={{ padding: 6, verticalAlign: "top" }}>
              <button type="button" onClick={() => void copy(r.value)}>
                Copy value
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function DomainsPage() {
  const { apiKey } = useAuth();
  const { selectedTenantId, refreshTenants } = useTenantContext();
  const [domains, setDomains] = useState<DomainRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<string | null>(null);
  const [fqdn, setFqdn] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dns, setDns] = useState<DnsBundle | null>(null);
  const [verifyBusy, setVerifyBusy] = useState(false);

  async function refresh() {
    if (!apiKey || !selectedTenantId) return;
    setLoading(true);
    try {
      const rows = await listDomains(apiKey, selectedTenantId);
      setDomains(rows);
      if (selectedId && !rows.some((d) => d.id === selectedId)) {
        setSelectedId(null);
        setDns(null);
      }
    } catch (e) {
      setBanner(e instanceof ApiError ? e.message : "Failed to load domains");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [apiKey, selectedTenantId]);

  useEffect(() => {
    if (!apiKey || !selectedTenantId || !selectedId) {
      setDns(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const r = await getDnsRecords(apiKey, selectedTenantId, selectedId);
        if (!cancelled) setDns(r.records);
      } catch {
        if (!cancelled) setDns(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiKey, selectedTenantId, selectedId]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!apiKey || !selectedTenantId) return;
    setBanner(null);
    try {
      await registerDomain(apiKey, selectedTenantId, fqdn.trim());
      setFqdn("");
      await refresh();
      void refreshTenants();
    } catch (err) {
      setBanner(err instanceof ApiError ? err.message : "Could not register");
    }
  }

  async function onVerify() {
    if (!apiKey || !selectedTenantId || !selectedId) return;
    setVerifyBusy(true);
    setBanner(null);
    try {
      await verifyDomain(apiKey, selectedTenantId, selectedId);
      await refresh();
      void refreshTenants();
    } catch (err) {
      setBanner(err instanceof ApiError ? err.message : "Verification failed");
    } finally {
      setVerifyBusy(false);
    }
  }

  if (!selectedTenantId) return <p>Select a tenant in the header.</p>;

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Domains</h1>
      {banner ? (
        <p style={{ color: "#b91c1c", marginBottom: 12 }}>{banner}</p>
      ) : null}

      <form
        onSubmit={onCreate}
        style={{
          display: "flex",
          gap: 8,
          alignItems: "flex-end",
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <label style={{ display: "block", fontSize: 13 }}>FQDN</label>
          <input
            value={fqdn}
            onChange={(e) => setFqdn(e.target.value)}
            placeholder="mail.example.com"
            required
            style={{ minWidth: 260 }}
          />
        </div>
        <button type="submit">Register domain</button>
      </form>

      {loading ? <p>Loading…</p> : null}

      {!loading && domains.length === 0 ? (
        <p style={{ color: "#64748b" }}>No domains yet.</p>
      ) : null}

      {domains.length > 0 ? (
        <div
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            overflow: "hidden",
            background: "#fff",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", background: "#f8fafc" }}>
                <th style={{ padding: 8 }}>Domain</th>
                <th style={{ padding: 8 }}>Status</th>
                <th style={{ padding: 8 }} />
              </tr>
            </thead>
            <tbody>
              {domains.map((d) => (
                <tr key={d.id} style={{ borderTop: "1px solid #e2e8f0" }}>
                  <td style={{ padding: 8, fontFamily: "monospace" }}>
                    {d.fqdn}
                  </td>
                  <td style={{ padding: 8 }}>{d.verification_status}</td>
                  <td style={{ padding: 8, textAlign: "right" }}>
                    <button type="button" onClick={() => setSelectedId(d.id)}>
                      DNS panel
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {selectedId && dns ? (
        <div style={{ marginTop: 20 }}>
          <h2>DNS records</h2>
          <p style={{ color: "#64748b", fontSize: 14 }}>
            Copy these records into your DNS provider, then run verification.
          </p>
          <RecordTable bundle={dns} />
          <div style={{ marginTop: 12 }}>
            <button
              type="button"
              disabled={verifyBusy}
              onClick={() => void onVerify()}
            >
              {verifyBusy ? "Verifying…" : "Run verification"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
