import Handlebars from "handlebars";

export type BrandingForRender = {
  logoUrl: string;
  primaryColor: string;
};

export function renderHandlebars(
  bodyHtml: string,
  variables: Record<string, unknown>,
): string {
  const tpl = Handlebars.compile(bodyHtml, { strict: true });
  return tpl(variables);
}

export function wrapWithBranding(
  innerHtml: string,
  branding: BrandingForRender,
): string {
  const safeColor = branding.primaryColor.replace(/[<>"']/g, "");
  return `<div class="bruma-brand-wrapper" style="--bruma-primary:${safeColor}">
  <div class="bruma-brand-header" style="margin-bottom:12px">
    <img src="${Handlebars.Utils.escapeExpression(branding.logoUrl)}" alt="logo" style="max-height:48px" />
  </div>
  <div class="bruma-brand-body">${innerHtml}</div>
</div>`;
}

export function renderWithOptionalBranding(
  bodyHtml: string,
  variables: Record<string, unknown>,
  branding: BrandingForRender | null,
): { html: string } {
  const inner = renderHandlebars(bodyHtml, variables);
  if (!branding) return { html: inner };
  return { html: wrapWithBranding(inner, branding) };
}
