"use client";

import { usePathname } from "next/navigation";
import { APP_BACKGROUND_VIDEO_SRC } from "@/config/app-background";

/** Full-viewport looping video + dark scrim (lighter scrim on `/` only). */
export default function AppVideoBackground() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
      <div className="relative h-full w-full">
        <video
          src={APP_BACKGROUND_VIDEO_SRC}
          autoPlay
          muted
          loop
          playsInline
          className="h-full w-full object-cover"
        />
        <div
          className={
            isHome
              ? "absolute inset-0 bg-black/32"
              : "absolute inset-0 bg-black/55"
          }
        />
      </div>
    </div>
  );
}
