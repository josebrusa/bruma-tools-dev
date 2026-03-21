import { html } from "@codemirror/lang-html";
import { oneDark } from "@codemirror/theme-one-dark";
import CodeMirror from "@uiw/react-codemirror";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ApiError,
  createTemplate,
  createTemplateVersion,
  listTemplateVersions,
  listTemplates,
  previewTemplateVersion,
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
  const [bodyHtml, setBodyHtml] = useState("<p>Hello {{name}}</p>");
  const [vars, setVars] = useState("name");
  const [banner, setBanner] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewTarget, setPreviewTarget] = useState<{
    versionId: string;
    label: string;
  } | null>(null);

  const sampleVariables = useMemo(() => {
    const keys = vars
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const o: Record<string, string> = {};
    for (const k of keys) {
      o[k] = `Sample ${k}`;
    }
    if (!("name" in o)) o.name = "Alex";
    return o;
  }, [vars]);

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
        body_html: bodyHtml,
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

  async function openPreview(versionId: string, label: string) {
    if (!apiKey || !selectedTenantId || !selectedTemplateId) return;
    setPreviewTarget({ versionId, label });
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewHtml(null);
    try {
      const { html: h } = await previewTemplateVersion(
        apiKey,
        selectedTenantId,
        selectedTemplateId,
        versionId,
        sampleVariables,
      );
      setPreviewHtml(h);
    } catch (err) {
      setPreviewHtml(
        `<p style="color:#b91c1c">${err instanceof ApiError ? err.message : "Preview failed"}</p>`,
      );
    } finally {
      setPreviewLoading(false);
    }
  }

  async function onPublish(versionId: string) {
    if (!apiKey || !selectedTenantId || !selectedTemplateId) return;
    const ok = window.confirm(
      "Publish this version? It becomes the active template used for dispatch.",
    );
    if (!ok) return;
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

  const selectedTpl = templates.find((t) => t.id === selectedTemplateId);

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Templates</h1>
      {banner ? (
        <p style={{ color: "#b91c1c", marginBottom: 12 }}>{banner}</p>
      ) : null}

      <h2>New template</h2>
      <form onSubmit={onCreateTemplate} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Welcome email"
          required
        />
        <button type="submit">Create</button>
      </form>

      <h2 style={{ marginTop: 24 }}>Existing templates</h2>
      {templates.length === 0 ? (
        <p style={{ color: "#64748b" }}>
          No templates yet. Create one to start editing HTML and variables.
        </p>
      ) : null}
      <select
        value={selectedTemplateId}
        onChange={(e) => setSelectedTemplateId(e.target.value)}
        style={{ minWidth: 320 }}
      >
        <option value="">Select template</option>
        {templates.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
            {t.active_version_id ? " · published" : " · no published version"}
          </option>
        ))}
      </select>

      {selectedTemplateId ? (
        <div style={{ marginTop: 16 }}>
          <p style={{ color: "#64748b", fontSize: 14 }}>
            {selectedTpl?.active_version_id
              ? "This template has a published (active) version for dispatch."
              : "Publish a version before event mappings can send this template."}
          </p>
          <h3>Versions</h3>
          {versions.length === 0 ? (
            <p style={{ color: "#64748b" }}>No versions yet — add one below.</p>
          ) : (
            <ul>
              {versions.map((v) => (
                <li key={v.id} style={{ marginBottom: 8 }}>
                  v{v.version} {v.is_active ? <strong>(active)</strong> : null}{" "}
                  <button type="button" onClick={() => void openPreview(v.id, `v${v.version}`)}>
                    Preview
                  </button>{" "}
                  {!v.is_active ? (
                    <button type="button" onClick={() => void onPublish(v.id)}>
                      Publish
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}

          <h3>Documented variables</h3>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 0 }}>
            Comma-separated names (used for Handlebars strict mode in preview and send).
          </p>
          <input
            value={vars}
            onChange={(e) => setVars(e.target.value)}
            style={{ width: "100%", maxWidth: 480, marginBottom: 12 }}
          />

          <h3>HTML body</h3>
          <div style={{ maxWidth: 720, marginBottom: 12 }}>
            <CodeMirror
              value={bodyHtml}
              height="220px"
              theme={oneDark}
              extensions={[html()]}
              onChange={(v) => setBodyHtml(v)}
            />
          </div>
          <form onSubmit={onCreateVersion}>
            <button type="submit">Save new version</button>
          </form>
        </div>
      ) : null}

      {previewOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Template preview"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#fff",
              maxWidth: 720,
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
              borderRadius: 12,
              padding: 16,
              boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <h2 style={{ marginTop: 0 }}>
                Preview {previewTarget?.label ?? ""}
              </h2>
              <button type="button" onClick={() => setPreviewOpen(false)}>
                Close
              </button>
            </div>
            {previewLoading ? (
              <p>Rendering…</p>
            ) : previewHtml ? (
              <iframe
                title="email-preview"
                srcDoc={previewHtml}
                style={{ width: "100%", minHeight: 360, border: "1px solid #e2e8f0" }}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
