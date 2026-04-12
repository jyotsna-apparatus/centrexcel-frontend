"use client";

import type { ReactNode } from "react";
import AppVideoBackground from "@/components/layout/app-video-background";

/**
 * Global stacking: fixed video + scrim (z-0), then all app content (z-10).
 * Use once at the root layout so every route shares the same backdrop.
 */
export function GlobalVideoShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative isolate min-h-dvh">
      <AppVideoBackground />
      <div className="relative z-10 min-h-dvh">{children}</div>
    </div>
  );
}
