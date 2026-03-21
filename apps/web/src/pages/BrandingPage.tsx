import { FormEvent, useState } from "react";
import { ApiError, upsertBranding } from "../api/client";
import { useAuth } from "../auth/useAuth";
import { useTenantContext } from "../tenant/useTenantContext";

export function BrandingPage() {
  const { apiKey } = useAuth();
  const { selectedTenantId, refreshTenants } = useTenantContext();
  const [logoUrl, setLogoUrl] = useState("https://example.com/logo.png");
  const [color, setColor] = useState("#0EA5E9");
  const [banner, setBanner] = useState<string | null>(null);

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

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Branding</h1>
      <form onSubmit={onSubmit} style={{ maxWidth: 420 }}>
        <label style={{ display: "block", fontSize: 13 }}>Logo URL</label>
        <input
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          style={{ width: "100%", marginBottom: 8 }}
          required
        />
        <label style={{ display: "block", fontSize: 13 }}>Primary color</label>
        <input
          value={color}
          onChange={(e) => setColor(e.target.value)}
          style={{ width: "100%", marginBottom: 8 }}
          placeholder="#RRGGBB"
          required
        />
        <button type="submit">Save branding</button>
      </form>
      {banner ? (
        <p style={{ marginTop: 12, color: banner.startsWith("Saved") ? "#15803d" : "#b91c1c" }}>
          {banner}
        </p>
      ) : null}
    </div>
  );
}
