import { FormEvent, useEffect, useState } from "react";
import {
  ApiError,
  createTemplate,
  createTemplateVersion,
  listTemplateVersions,
  listTemplates,
  publishTemplateVersion,
  type TemplateRow,
  type TemplateVersionRow,
} from "../api/client";
import { useAuth } from "../auth/useAuth";
import { useTenantContext } from "../tenant/useTenantContext";

export function TemplatesPage() {
  const { apiKey } = useAuth();
  const { selectedTenantId, refreshTenants } = useTenantContext();
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [versions, setVersions] = useState<TemplateVersionRow[]>([]);
  const [name, setName] = useState("");
  const [html, setHtml] = useState("<p>Hello {{name}}</p>");
  const [vars, setVars] = useState("name");
  const [banner, setBanner] = useState<string | null>(null);

  async function refreshTemplates() {
    if (!apiKey || !selectedTenantId) return;
    const t = await listTemplates(apiKey, selectedTenantId);
    setTemplates(t);
  }

  useEffect(() => {
    void (async () => {
      try {
        await refreshTemplates();
      } catch (e) {
        setBanner(e instanceof ApiError ? e.message : "Failed to load");
      }
    })();
  }, [apiKey, selectedTenantId]);

  useEffect(() => {
    if (!apiKey || !selectedTenantId || !selectedTemplateId) {
      setVersions([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const v = await listTemplateVersions(
          apiKey,
          selectedTenantId,
          selectedTemplateId,
        );
        if (!cancelled) setVersions(v);
      } catch {
        if (!cancelled) setVersions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiKey, selectedTenantId, selectedTemplateId]);

  async function onCreateTemplate(e: FormEvent) {
    e.preventDefault();
    if (!apiKey || !selectedTenantId) return;
    setBanner(null);
    try {
      const row = await createTemplate(apiKey, selectedTenantId, {
        name: name.trim(),
      });
      setName("");
      await refreshTemplates();
      setSelectedTemplateId(row.id);
      void refreshTenants();
    } catch (err) {
      setBanner(err instanceof ApiError ? err.message : "Could not create");
    }
  }

  async function onCreateVersion(e: FormEvent) {
    e.preventDefault();
    if (!apiKey || !selectedTenantId || !selectedTemplateId) return;
    setBanner(null);
    const variable_names = vars
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      await createTemplateVersion(apiKey, selectedTenantId, selectedTemplateId, {
        body_html: html,
        variable_names,
      });
      const v = await listTemplateVersions(
        apiKey,
        selectedTenantId,
        selectedTemplateId,
      );
      setVersions(v);
      void refreshTenants();
    } catch (err) {
      setBanner(err instanceof ApiError ? err.message : "Could not add version");
    }
  }

  async function onPublish(versionId: string) {
    if (!apiKey || !selectedTenantId || !selectedTemplateId) return;
    setBanner(null);
    try {
      await publishTemplateVersion(
        apiKey,
        selectedTenantId,
        selectedTemplateId,
        versionId,
      );
      await refreshTemplates();
      const v = await listTemplateVersions(
        apiKey,
        selectedTenantId,
        selectedTemplateId,
      );
      setVersions(v);
      void refreshTenants();
    } catch (err) {
      setBanner(err instanceof ApiError ? err.message : "Publish failed");
    }
  }

  if (!selectedTenantId) return <p>Select a tenant in the header.</p>;

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Templates</h1>
      {banner ? (
        <p style={{ color: "#b91c1c", marginBottom: 12 }}>{banner}</p>
      ) : null}

      <h2>New template</h2>
      <form onSubmit={onCreateTemplate} style={{ display: "flex", gap: 8 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Welcome email"
          required
        />
        <button type="submit">Create</button>
      </form>

      <h2 style={{ marginTop: 24 }}>Existing templates</h2>
      <select
        value={selectedTemplateId}
        onChange={(e) => setSelectedTemplateId(e.target.value)}
        style={{ minWidth: 280 }}
      >
        <option value="">Select template</option>
        {templates.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
            {t.active_version_id ? " (published)" : ""}
          </option>
        ))}
      </select>

      {selectedTemplateId ? (
        <div style={{ marginTop: 16 }}>
          <h3>Versions</h3>
          <ul>
            {versions.map((v) => (
              <li key={v.id} style={{ marginBottom: 8 }}>
                v{v.version} {v.is_active ? <strong>(active)</strong> : null}{" "}
                {!v.is_active ? (
                  <button type="button" onClick={() => void onPublish(v.id)}>
                    Publish
                  </button>
                ) : null}
              </li>
            ))}
          </ul>

          <h3>Add version</h3>
          <form onSubmit={onCreateVersion}>
            <label style={{ display: "block", fontSize: 13 }}>Variables (comma)</label>
            <input
              value={vars}
              onChange={(e) => setVars(e.target.value)}
              style={{ width: "100%", marginBottom: 8 }}
            />
            <label style={{ display: "block", fontSize: 13 }}>HTML</label>
            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              rows={8}
              style={{ width: "100%", fontFamily: "monospace", marginBottom: 8 }}
            />
            <button type="submit">Save version</button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
