"use client";

import { useMemo } from "react";
import { sanitizeRichHtml } from "@/lib/sanitize-html";
import { cn } from "@/lib/utils";

export function SafeHtmlContent({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  const clean = useMemo(() => sanitizeRichHtml(html || ""), [html]);
  return (
    <div
      className={cn(
        "prose prose-sm max-w-none text-muted-foreground prose-headings:text-cs-heading prose-p:leading-relaxed prose-li:leading-relaxed",
        className,
      )}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
