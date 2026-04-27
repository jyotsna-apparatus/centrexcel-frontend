"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Gavel, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/pageHeader/PageHeader";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { CHALLENGE_TYPE_LABELS } from "@/config/challenge-constants";
import { useAuth } from "@/contexts/auth-context";
import { listChallenges } from "@/lib/challenges-api";

export default function JudgeChallengesPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user && user.role !== "judge") router.replace("/dashboard");
  }, [user, router]);

  const { data, isLoading } = useQuery({
    queryKey: ["judge-challenges"],
    queryFn: () => listChallenges({ page: 1, limit: 50, mine: true }),
    enabled: user?.role === "judge",
  });

  if (user && user.role !== "judge") return null;

  const rows = data?.data ?? [];

  return (
    <div>
      <PageHeader
        title="Assigned challenges"
        description="Open a challenge to review submissions by stage."
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-8 animate-spin text-cs-primary" />
        </div>
      ) : rows.length === 0 ? (
        <GlassCard className="p-8 text-center text-sm text-muted-foreground">
          No challenges assigned to you yet.
        </GlassCard>
      ) : (
        <ul className="space-y-3">
          {rows.map((c) => (
            <li key={c.id}>
              <GlassCard className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  <Gavel className="size-5 text-cs-primary" />
                  <div>
                    <p className="font-medium text-cs-heading">{c.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {CHALLENGE_TYPE_LABELS[c.challengeType]} · {c.status}
                    </p>
                  </div>
                </div>
                <Button size="sm" asChild>
                  <Link href={`/judge/challenges/${c.id}`}>
                    Submissions
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
              </GlassCard>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
