/**
 * Client-side sanitization for rich HTML (TipTap) before dangerouslySetInnerHTML.
 */
export function sanitizeRichHtml(html: string): string {
  if (!html || typeof document === "undefined") return stripScriptsBasic(html);
  const template = document.createElement("template");
  template.innerHTML = html;
  template.content
    .querySelectorAll("script, style, iframe, object, embed, form, link, meta")
    .forEach((el) => el.remove());
  template.content.querySelectorAll("*").forEach((el) => {
    for (const attr of [...el.attributes]) {
      const n = attr.name.toLowerCase();
      const v = attr.value.trim().toLowerCase();
      if (n.startsWith("on") || v.startsWith("javascript:") || v.startsWith("data:text/html")) {
        el.removeAttribute(attr.name);
      }
    }
  });
  return template.innerHTML;
}

function stripScriptsBasic(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, "");
}
