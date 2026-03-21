import { FormEvent, useEffect, useState } from "react";
import {
  ApiError,
  createSender,
  listDomains,
  listSenders,
  type DomainRow,
  type SenderRow,
} from "../api/client";
import { useAuth } from "../auth/useAuth";
import { useTenantContext } from "../tenant/useTenantContext";

export function SendersPage() {
  const { apiKey } = useAuth();
  const { selectedTenantId, refreshTenants } = useTenantContext();
  const [senders, setSenders] = useState<SenderRow[]>([]);
  const [domains, setDomains] = useState<DomainRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<string | null>(null);
  const [domainId, setDomainId] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");

  async function refresh() {
    if (!apiKey || !selectedTenantId) return;
    setLoading(true);
    try {
      const [s, d] = await Promise.all([
        listSenders(apiKey, selectedTenantId),
        listDomains(apiKey, selectedTenantId),
      ]);
      setSenders(s);
      setDomains(d);
    } catch (e) {
      setBanner(e instanceof ApiError ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [apiKey, selectedTenantId]);

  const verified = domains.filter((x) => x.verification_status === "verified");
  const selectedDomain = domains.find((d) => d.id === domainId);
  const canSubmit =
    verified.some((d) => d.id === domainId) &&
    email.trim() &&
    displayName.trim();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!apiKey || !selectedTenantId || !canSubmit) return;
    setBanner(null);
    try {
      await createSender(apiKey, selectedTenantId, {
        domain_id: domainId,
        email: email.trim(),
        display_name: displayName.trim(),
      });
      setEmail("");
      setDisplayName("");
      await refresh();
      void refreshTenants();
    } catch (err) {
      setBanner(err instanceof ApiError ? err.message : "Could not create");
    }
  }

  if (!selectedTenantId) return <p>Select a tenant in the header.</p>;

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Senders</h1>
      {banner ? (
        <p style={{ color: "#b91c1c", marginBottom: 12 }}>{banner}</p>
      ) : null}

      {loading ? <p>Loading…</p> : null}

      {!loading && senders.length === 0 ? (
        <p style={{ color: "#64748b" }}>
          No senders yet. You need a verified domain first.
        </p>
      ) : null}

      {senders.length > 0 ? (
        <ul>
          {senders.map((s) => (
            <li key={s.id}>
              <strong>{s.display_name}</strong> — {s.email}{" "}
              <span style={{ color: "#64748b" }}>({s.state})</span>
            </li>
          ))}
        </ul>
      ) : null}

      <h2>Create sender</h2>
      {verified.length === 0 ? (
        <p style={{ color: "#b45309" }}>
          Register and verify a domain before creating senders.
        </p>
      ) : (
        <form onSubmit={onSubmit} style={{ maxWidth: 420 }}>
          <label style={{ display: "block", fontSize: 13 }}>Domain</label>
          <select
            value={domainId}
            onChange={(e) => setDomainId(e.target.value)}
            required
            style={{ width: "100%", marginBottom: 8 }}
          >
            <option value="">Select verified domain</option>
            {verified.map((d) => (
              <option key={d.id} value={d.id}>
                {d.fqdn}
              </option>
            ))}
          </select>
          {selectedDomain && selectedDomain.verification_status !== "verified" ? (
            <p style={{ color: "#b45309" }}>
              Selected domain is not verified yet.
            </p>
          ) : null}
          <label style={{ display: "block", fontSize: 13 }}>Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", marginBottom: 8 }}
            required
          />
          <label style={{ display: "block", fontSize: 13 }}>Display name</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            style={{ width: "100%", marginBottom: 8 }}
            required
          />
          <button type="submit" disabled={!canSubmit}>
            Create sender
          </button>
        </form>
      )}
    </div>
  );
}
