const TERMINAL = new Set(["bounced", "failed", "spam_complaint"]);

/**
 * Returns the new dispatch status after a delivery event, or null if unchanged / invalid.
 */
export function nextDispatchStatus(
  current: string,
  eventType: string,
): string | null {
  if (TERMINAL.has(current)) return null;
  switch (eventType) {
    case "sent":
      return current === "queued" || current === "sending" ? "sent" : null;
    case "delivered":
      if (
        current === "queued" ||
        current === "sent" ||
        current === "sending"
      ) {
        return "delivered";
      }
      return null;
    case "bounced":
    case "failed":
      if (
        current === "queued" ||
        current === "sent" ||
        current === "sending"
      ) {
        return eventType;
      }
      return null;
    case "spam_complaint":
      if (
        current === "queued" ||
        current === "sent" ||
        current === "sending" ||
        current === "delivered"
      ) {
        return "spam_complaint";
      }
      return null;
    default:
      return null;
  }
}
