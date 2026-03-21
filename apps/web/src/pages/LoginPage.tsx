import { FormEvent, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { apiFetch, parseJsonOrThrow } from "../api/client";

export function LoginPage() {
  const { apiKey, signIn } = useAuth();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (apiKey) {
    return <Navigate to="/overview" replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch("/v1/tenants", { apiKey: value.trim() });
      await parseJsonOrThrow(res);
      signIn(value.trim());
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Could not verify API key.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      role="main"
      aria-label="Sign in"
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#0f172a",
        color: "#e2e8f0",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <form
        onSubmit={onSubmit}
        aria-describedby="login-hint"
        style={{
          width: "min(400px, 92vw)",
          padding: "1.75rem",
          borderRadius: 12,
          background: "#1e293b",
          border: "1px solid #334155",
        }}
      >
        <h1 style={{ marginTop: 0, fontSize: "1.35rem" }}>Bruma dashboard</h1>
        <p id="login-hint" style={{ color: "#94a3b8", fontSize: 14 }}>
          Sign in with your admin API key (same value as{" "}
          <code style={{ color: "#cbd5e1" }}>ADMIN_API_KEY</code> on the API).
        </p>
        <label
          htmlFor="api-key-input"
          style={{ display: "block", fontSize: 13, marginBottom: 6, marginTop: 12 }}
        >
          API key
        </label>
        <input
          id="api-key-input"
          type="password"
          name="api-key"
          autoComplete="off"
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? "login-error" : undefined}
          value={value}
          onChange={(ev) => setValue(ev.target.value)}
          style={{
            width: "100%",
            padding: "0.6rem 0.65rem",
            borderRadius: 8,
            border: "1px solid #475569",
            background: "#0f172a",
            color: "#f8fafc",
            boxSizing: "border-box",
          }}
        />
        {error ? (
          <p
            id="login-error"
            role="alert"
            style={{ color: "#fca5a5", fontSize: 14, marginTop: "0.75rem" }}
          >
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading || !value.trim()}
          style={{
            marginTop: "1rem",
            width: "100%",
            padding: "0.65rem",
            borderRadius: 8,
            border: "none",
            background: "#38bdf8",
            color: "#0f172a",
            fontWeight: 700,
            cursor: loading ? "wait" : "pointer",
          }}
        >
          {loading ? "Checking…" : "Continue"}
        </button>
      </form>
    </div>
  );
}
