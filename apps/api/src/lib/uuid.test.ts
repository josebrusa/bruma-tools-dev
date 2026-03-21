import { describe, expect, it } from "vitest";
import { isUuid } from "./uuid.js";

describe("isUuid", () => {
  it("accepts RFC4122-style uuids", () => {
    expect(isUuid("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
  });

  it("rejects non-uuids", () => {
    expect(isUuid("not-a-uuid")).toBe(false);
    expect(isUuid("")).toBe(false);
  });
});
