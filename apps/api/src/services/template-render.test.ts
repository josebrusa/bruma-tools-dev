import { describe, expect, it } from "vitest";
import {
  renderHandlebars,
  renderWithOptionalBranding,
  wrapWithBranding,
} from "./template-render.js";

describe("template-render", () => {
  it("renders handlebars with strict variables", () => {
    expect(renderHandlebars("<p>{{name}}</p>", { name: "Ada" })).toBe(
      "<p>Ada</p>",
    );
  });

  it("throws on missing variables in strict mode", () => {
    expect(() => renderHandlebars("<p>{{name}}</p>", {})).toThrow();
  });

  it("wraps branding", () => {
    const html = wrapWithBranding("<b>hi</b>", {
      logoUrl: "https://example.com/l.png",
      primaryColor: "#112233",
    });
    expect(html).toContain("--bruma-primary:#112233");
    expect(html).toContain("<b>hi</b>");
  });

  it("applies branding in renderWithOptionalBranding", () => {
    const { html } = renderWithOptionalBranding(
      "{{x}}",
      { x: "ok" },
      { logoUrl: "https://example.com/l.png", primaryColor: "#000000" },
    );
    expect(html).toContain("ok");
    expect(html).toContain("bruma-brand-wrapper");
  });
});
