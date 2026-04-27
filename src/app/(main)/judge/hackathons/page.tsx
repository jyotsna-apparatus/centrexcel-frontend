"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy URL — use `/judge/challenges` instead. */
export default function JudgeHackathonsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/judge/challenges");
  }, [router]);
  return null;
}
