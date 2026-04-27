"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/** Legacy URL — use `/judge/challenges/[id]` instead. */
export default function JudgeHackathonSubmissionsRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  useEffect(() => {
    if (id) router.replace(`/judge/challenges/${id}`);
    else router.replace("/judge/challenges");
  }, [router, id]);
  return null;
}
