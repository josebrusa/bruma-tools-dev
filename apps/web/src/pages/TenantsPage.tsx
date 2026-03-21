import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  ApiError,
  createTenant,
  listTenants,
  updateTenant,
  type Tenant,
} from "../api/client";
import { useAuth } from "../auth/useAuth";
import { useTenantContext } from "../tenant/useTenantContext";

export function TenantsPage() {
  const { apiKey } = useAuth();
  const { refreshTenants } = useTenantContext();
  const [tenants, setTenants] = useState<Tenant[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");

  const [edit, setEdit] = useState<Tenant | null>(null);
  const [editName, setEditName] = useState("");
  const [editContact, setEditContact] = useState("");
  const [editTz, setEditTz] = useState("");

  const refresh = useCallback(async () => {
    if (!apiKey) return;
    setLoading(true);
    try {
      const data = await listTenants(apiKey);
      setTenants(data);
    } catch (e) {
      const text =
        e instanceof ApiError ? e.message : "Could not load tenants.";
      setBanner({ type: "err", text });
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!apiKey) return;
    setBanner(null);
    try {
      const row = await createTenant(apiKey, {
        slug: slug.trim(),
        name: name.trim(),
        contact: contact.trim() || undefined,
      });
      setTenants((prev) => (prev ? [...prev, row].sort((a, b) => a.slug.localeCompare(b.slug)) : [row]));
      setCreateOpen(false);
      setSlug("");
      setName("");
      setContact("");
      setBanner({ type: "ok", text: "Tenant created." });
      void refreshTenants();
    } catch (err) {
      const text =
        err instanceof ApiError ? err.message : "Could not create tenant.";
      setBanner({ type: "err", text });
    }
  }

  async function toggleActive(t: Tenant, next: boolean) {
    if (!apiKey) return;
    const label = next ? "activate" : "deactivate";
    if (
      !next &&
      !window.confirm(
        `Deactivate tenant "${t.name}"? Operators may lose access until reactivated.`,
      )
    ) {
      return;
    }
    setBanner(null);
    try {
      const row = await updateTenant(apiKey, t.id, { is_active: next });
      setTenants((prev) =>
        prev ? prev.map((x) => (x.id === row.id ? row : x)) : prev,
      );
      setBanner({ type: "ok", text: `Tenant ${label}d.` });
      void refreshTenants();
    } catch (err) {
      const text =
        err instanceof ApiError ? err.message : `Could not ${label} tenant.`;
      setBanner({ type: "err", text });
    }
  }

  async function saveEdit(e: FormEvent) {
    e.preventDefault();
    if (!apiKey || !edit) return;
    setBanner(null);
    try {
      const row = await updateTenant(apiKey, edit.id, {
        name: editName.trim(),
        contact: editContact.trim() || null,
        timezone: editTz.trim() || null,
      });
      setTenants((prev) =>
        prev ? prev.map((x) => (x.id === row.id ? row : x)) : prev,
      );
      setEdit(null);
      setBanner({ type: "ok", text: "Tenant updated." });
      void refreshTenants();
    } catch (err) {
      const text =
        err instanceof ApiError ? err.message : "Could not update tenant.";
      setBanner({ type: "err", text });
    }
  }

  if (!apiKey) return null;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0, flex: 1 }}>Tenants</h1>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          style={{
            padding: "0.45rem 0.85rem",
            borderRadius: 8,
            border: "none",
            background: "#0ea5e9",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          New tenant
        </button>
      </div>

      {banner ? (
        <div
          style={{
            marginTop: 12,
            padding: "0.65rem 0.85rem",
            borderRadius: 8,
            background: banner.type === "ok" ? "#dcfce7" : "#fee2e2",
            color: banner.type === "ok" ? "#14532d" : "#7f1d1d",
          }}
        >
          {banner.text}
        </div>
      ) : null}

      {loading ? <p>Loading…</p> : null}

      {!loading && tenants && tenants.length === 0 ? (
        <div
          style={{
            marginTop: 24,
            padding: "2rem",
            borderRadius: 12,
            border: "1px dashed #cbd5e1",
            background: "#fff",
            textAlign: "center",
          }}
        >
          <h2 style={{ marginTop: 0 }}>No tenants yet</h2>
          <p style={{ color: "#64748b" }}>
            Create your first tenant to start configuring domains and dispatch.
          </p>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            style={{
              marginTop: 8,
              padding: "0.55rem 1rem",
              borderRadius: 8,
              border: "none",
              background: "#0f172a",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Create tenant
          </button>
        </div>
      ) : null}

      {!loading && tenants && tenants.length > 0 ? (
        <div
          style={{
            marginTop: 16,
            overflow: "auto",
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            background: "#fff",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", background: "#f1f5f9" }}>
                <th style={{ padding: "0.65rem" }}>Name</th>
                <th style={{ padding: "0.65rem" }}>Slug</th>
                <th style={{ padding: "0.65rem" }}>Status</th>
                <th style={{ padding: "0.65rem" }} />
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id} style={{ borderTop: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "0.65rem" }}>{t.name}</td>
                  <td style={{ padding: "0.65rem", fontFamily: "monospace" }}>
                    {t.slug}
                  </td>
                  <td style={{ padding: "0.65rem" }}>
                    <span
                      style={{
                        padding: "0.15rem 0.45rem",
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 600,
                        background: t.is_active ? "#dcfce7" : "#fee2e2",
                        color: t.is_active ? "#14532d" : "#991b1b",
                      }}
                    >
                      {t.is_active ? "active" : "inactive"}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "0.65rem",
                      display: "flex",
                      gap: 8,
                      justifyContent: "flex-end",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setEdit(t);
                        setEditName(t.name);
                        setEditContact(t.contact ?? "");
                        setEditTz(t.timezone ?? "");
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void toggleActive(t, !t.is_active)}
                      style={{ cursor: "pointer" }}
                    >
                      {t.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {createOpen ? (
        <dialog open style={{ borderRadius: 12, border: "1px solid #cbd5e1" }}>
          <form onSubmit={onCreate} style={{ minWidth: 320 }}>
            <h3 style={{ marginTop: 0 }}>New tenant</h3>
            <label style={{ display: "block", fontSize: 13 }}>Slug</label>
            <input
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              style={{ width: "100%", marginBottom: 8 }}
            />
            <label style={{ display: "block", fontSize: 13 }}>Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: "100%", marginBottom: 8 }}
            />
            <label style={{ display: "block", fontSize: 13 }}>Contact</label>
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              style={{ width: "100%", marginBottom: 8 }}
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setCreateOpen(false)}>
                Cancel
              </button>
              <button type="submit">Create</button>
            </div>
          </form>
        </dialog>
      ) : null}

      {edit ? (
        <dialog open style={{ borderRadius: 12, border: "1px solid #cbd5e1" }}>
          <form onSubmit={saveEdit} style={{ minWidth: 320 }}>
            <h3 style={{ marginTop: 0 }}>Edit tenant</h3>
            <p style={{ fontSize: 13, color: "#64748b" }}>
              Slug: <code>{edit.slug}</code>
            </p>
            <label style={{ display: "block", fontSize: 13 }}>Name</label>
            <input
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              style={{ width: "100%", marginBottom: 8 }}
            />
            <label style={{ display: "block", fontSize: 13 }}>Contact</label>
            <input
              value={editContact}
              onChange={(e) => setEditContact(e.target.value)}
              style={{ width: "100%", marginBottom: 8 }}
            />
            <label style={{ display: "block", fontSize: 13 }}>Timezone</label>
            <input
              value={editTz}
              onChange={(e) => setEditTz(e.target.value)}
              style={{ width: "100%", marginBottom: 8 }}
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setEdit(null)}>
                Cancel
              </button>
              <button type="submit">Save</button>
            </div>
          </form>
        </dialog>
      ) : null}
    </div>
  );
}
