"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, FileUp, Gavel, Trophy } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { listChallenges } from "@/lib/challenges-api";

type StatCardProps = {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  href?: string;
  className?: string;
};

function StatCard({ title, value, icon, href, className = "" }: StatCardProps) {
  const content = (
    <div className={`app-glass-surface rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm font-medium">{title}</p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
        </div>
        <div className="rounded-full bg-primary/10 p-3 text-primary">{icon}</div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

export default function JudgeDashboard() {
  const { user } = useAuth();

  const { data: challengesData } = useQuery({
    queryKey: ["dashboard", "judge-challenges"],
    queryFn: () => listChallenges({ page: 1, limit: 20, mine: true }),
  });

  const challenges = challengesData?.data ?? [];
  const openChallenges = challenges.filter((c) => c.status === "open");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="h2 text-cs-heading">Judge Dashboard</h1>
        <p className="p1 mt-1 text-cs-text">
          Welcome back, {user?.email}. Review and score assigned challenges.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <StatCard
          title="Open challenges"
          value={openChallenges.length}
          icon={<Gavel className="size-6" />}
          href="/judge/challenges"
        />
        <StatCard
          title="Assigned total"
          value={challenges.length}
          icon={<CheckCircle2 className="size-6" />}
          href="/judge/challenges"
        />
      </div>

      <div className="app-glass-surface rounded-lg p-6">
        <h2 className="mb-4 text-lg font-semibold">Quick actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Button variant="outline" className="justify-start" asChild>
            <Link href="/judge/challenges">
              <Trophy className="mr-2 size-4" />
              Assigned challenges
            </Link>
          </Button>
          <Button variant="outline" className="justify-start" asChild>
            <Link href="/judge/challenges">
              <FileUp className="mr-2 size-4" />
              Score submissions
            </Link>
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-cs-border bg-blue-500/10 p-6">
        <div className="flex items-start gap-3">
          <Gavel className="mt-0.5 size-5 text-blue-500" />
          <div>
            <h3 className="font-semibold text-blue-500">Judging</h3>
            <p className="text-muted-foreground mt-2 text-sm">
              Scoring is available on the <strong>project</strong> stage only.
              Open a challenge, pick the Project tab, then download and score each
              submission.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
