import { FormEvent, useEffect, useState } from "react";
import { ApiError, getBranding, upsertBranding } from "../api/client";
import { useAuth } from "../auth/useAuth";
import { useTenantContext } from "../tenant/useTenantContext";

export function BrandingPage() {
  const { apiKey } = useAuth();
  const { selectedTenantId, refreshTenants } = useTenantContext();
  const [logoUrl, setLogoUrl] = useState("");
  const [color, setColor] = useState("#0EA5E9");
  const [banner, setBanner] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoPreviewError, setLogoPreviewError] = useState(false);

  useEffect(() => {
    if (!apiKey || !selectedTenantId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setBanner(null);
      try {
        const row = await getBranding(apiKey, selectedTenantId);
        if (cancelled) return;
        setLogoPreviewError(false);
        if (row) {
          setLogoUrl(row.logo_url);
          setColor(row.color_primario);
        } else {
          setLogoUrl("https://example.com/logo.png");
          setColor("#0EA5E9");
        }
      } catch (e) {
        if (!cancelled) {
          setBanner(
            e instanceof ApiError ? e.message : "Could not load branding",
          );
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
    setBanner(null);
    try {
      await upsertBranding(apiKey, selectedTenantId, {
        logo_url: logoUrl.trim(),
        color_primario: color.trim(),
      });
      setBanner("Saved branding.");
      void refreshTenants();
    } catch (err) {
      setBanner(err instanceof ApiError ? err.message : "Could not save");
    }
  }

  if (!selectedTenantId) return <p>Select a tenant in the header.</p>;
  if (loading) return <p>Loading branding…</p>;

  let previewOk = false;
  try {
    previewOk = Boolean(logoUrl.trim() && new URL(logoUrl.trim()).href);
  } catch {
    previewOk = false;
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Branding</h1>
      <p style={{ color: "#64748b", maxWidth: 520 }}>
        Logo and primary color are applied to template previews and outbound
        email when configured.
      </p>
      <form onSubmit={onSubmit} style={{ maxWidth: 420 }}>
        <label style={{ display: "block", fontSize: 13 }}>Logo URL</label>
        <input
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          style={{ width: "100%", marginBottom: 8 }}
          required
        />
        {previewOk ? (
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: "#64748b" }}>Preview</span>
            <div
              style={{
                marginTop: 4,
                padding: 12,
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                background: "#f8fafc",
              }}
            >
              <img
                src={logoUrl.trim()}
                alt="Logo preview"
                style={{ maxHeight: 56, maxWidth: "100%", objectFit: "contain" }}
                onLoad={() => setLogoPreviewError(false)}
                onError={() => setLogoPreviewError(true)}
              />
              {logoPreviewError ? (
                <p style={{ margin: "8px 0 0", fontSize: 12, color: "#b91c1c" }}>
                  Could not load image from this URL.
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
        <label style={{ display: "block", fontSize: 13 }}>Primary color</label>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="color"
            value={color.length === 7 ? color : "#0EA5E9"}
            onChange={(e) => setColor(e.target.value)}
            style={{ width: 48, height: 32, padding: 0, border: "none" }}
            aria-label="Pick primary color"
          />
          <input
            value={color}
            onChange={(e) => setColor(e.target.value)}
            style={{ flex: 1 }}
            placeholder="#RRGGBB"
            required
          />
        </div>
        <button type="submit" style={{ marginTop: 12 }}>
          Save branding
        </button>
      </form>
      {banner ? (
        <p
          style={{
            marginTop: 12,
            color: banner.startsWith("Saved") ? "#15803d" : "#b91c1c",
          }}
        >
          {banner}
        </p>
      ) : null}
    </div>
  );
}
