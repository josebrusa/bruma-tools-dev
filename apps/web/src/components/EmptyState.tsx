import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div
      style={{
        border: "1px dashed #cbd5e1",
        borderRadius: 8,
        padding: "1.25rem",
        background: "#fff",
        maxWidth: 520,
      }}
    >
      <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>{title}</h2>
      <p style={{ margin: "0 0 0.75rem", color: "#64748b", lineHeight: 1.5 }}>
        {description}
      </p>
      {action ? <div style={{ marginTop: 8 }}>{action}</div> : null}
    </div>
  );
}
