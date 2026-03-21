import { describe, expect, it } from "vitest";
import { nextDispatchStatus } from "./dispatch-status.js";

describe("nextDispatchStatus", () => {
  it("does not change terminal states", () => {
    expect(nextDispatchStatus("bounced", "delivered")).toBeNull();
    expect(nextDispatchStatus("failed", "delivered")).toBeNull();
  });

  it("queued to sent", () => {
    expect(nextDispatchStatus("queued", "sent")).toBe("sent");
  });

  it("sending to delivered", () => {
    expect(nextDispatchStatus("sending", "delivered")).toBe("delivered");
  });

  it("sent to bounced", () => {
    expect(nextDispatchStatus("sent", "bounced")).toBe("bounced");
  });

  it("delivered to spam_complaint", () => {
    expect(nextDispatchStatus("delivered", "spam_complaint")).toBe(
      "spam_complaint",
    );
  });
});
