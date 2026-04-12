import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

/** Same glass as sidebar — uses global `.app-glass-surface` tokens in globals.css */
export const glassSurfaceClass = "app-glass-surface rounded-lg";

export function GlassCard({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return <div className={cn(glassSurfaceClass, className)} {...props} />;
}
