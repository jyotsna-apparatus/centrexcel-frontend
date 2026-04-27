"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Calendar, FileUp, Plus, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { getMyParticipations } from "@/lib/challenges-api";
import { STAGE_TYPE_LABELS } from "@/config/challenge-constants";
import type { ChallengeParticipation, HackathonStage } from "@/types/challenge";

type StatCardProps = {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  href?: string;
  className?: string;
};

function StatCard({ title, value, icon, href, className = "" }: StatCardProps) {
  const content = (
    <div className={`app-glass-surface rounded-lg p-7 ${className}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
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

function nextDeadlineForParticipation(p: ChallengeParticipation): string | null {
  const ch = p.challenge;
  if (!ch || ch.challengeType !== "hackathon") return null;
  const stages = (ch.stages ?? [])
    .slice()
    .sort((a, b) => a.stageOrder - b.stageOrder);
  const active = stages.find((s) => s.status === "active") as HackathonStage | undefined;
  if (!active) return null;
  return active.submissionDeadline;
}

export default function ParticipantDashboard() {
  const { user } = useAuth();

  const { data: partsData } = useQuery({
    queryKey: ["participations", "dashboard"],
    queryFn: () => getMyParticipations({ page: 1, limit: 20 }),
  });

  const parts = partsData?.data ?? [];
  const stageCount = parts.reduce((n, p) => n + (p.stageSubmissions?.length ?? 0), 0);
  const dailyCount = parts.reduce((n, p) => n + (p.dailyEntries?.length ?? 0), 0);
  const submissionishCount = stageCount + dailyCount;

  const upcoming = parts
    .map((p) => ({ p, d: nextDeadlineForParticipation(p) }))
    .filter((x): x is { p: ChallengeParticipation; d: string } => Boolean(x.d))
    .sort((a, b) => new Date(a.d).getTime() - new Date(b.d).getTime())[0];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="h2 text-cs-heading">Participant Dashboard</h1>
        <p className="p1 mt-2 text-cs-text leading-relaxed">
          Welcome back, {user?.email}. Track enrollments, uploads, and deadlines.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <StatCard
          title="My enrollments"
          value={parts.length}
          icon={<Users className="size-6" />}
          href="/participations"
        />
        <StatCard
          title="Uploads (stages + daily)"
          value={submissionishCount}
          icon={<FileUp className="size-6" />}
          href="/submissions"
        />
      </div>

      <div className="app-glass-surface rounded-lg p-7">
        <h2 className="mb-6 text-lg font-semibold">Quick actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Button variant="outline" className="justify-start" asChild>
            <Link href="/challenges">
              <Trophy className="mr-2 size-4 text-cs-primary" />
              Browse challenges
            </Link>
          </Button>
          <Button variant="outline" className="justify-start" asChild>
            <Link href="/participations">
              <Users className="mr-2 size-4 text-cs-primary" />
              My participations
            </Link>
          </Button>
          <Button variant="outline" className="justify-start" asChild>
            <Link href="/submissions">
              <FileUp className="mr-2 size-4 text-cs-primary" />
              My uploads
            </Link>
          </Button>
          <Button variant="outline" className="justify-start" asChild>
            <Link href="/teams">
              <Users className="mr-2 size-4 text-cs-primary" />
              Manage team
            </Link>
          </Button>
        </div>
      </div>

      {upcoming ? (
        <div className="app-glass-surface rounded-lg p-7">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
            <Calendar className="size-5 text-cs-primary" />
            Next submission deadline
          </h2>
          <p className="text-sm text-muted-foreground">
            {upcoming.p.challenge?.title ?? "Challenge"} ·{" "}
            {new Date(upcoming.d).toLocaleString()}
          </p>
          <Button className="mt-4" asChild variant="outline" size="sm">
            <Link href={`/challenges/${upcoming.p.challengeId}`}>
              Open challenge
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="app-glass-surface rounded-lg p-7">
          <div className="mb-6 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Recent enrollments</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/participations">
                View all
                <ArrowRight className="ml-2 size-4 text-cs-primary" />
              </Link>
            </Button>
          </div>
          {parts.length > 0 ? (
            <div className="space-y-4">
              {parts.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  className="app-glass-surface flex items-center justify-between gap-4 rounded-md p-4"
                >
                  <div>
                    <p className="font-medium leading-snug">
                      {p.challenge?.title ?? "Challenge"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(p.stageSubmissions?.length ?? 0) +
                        (p.dailyEntries?.length ?? 0)}{" "}
                      uploads
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/challenges/${p.challengeId}`}>Open</Link>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3 py-4 text-center">
              <p className="text-muted-foreground text-sm">No enrollments yet</p>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/challenges">
                  <Plus className="mr-2 size-4 text-cs-primary" />
                  Join a challenge
                </Link>
              </Button>
            </div>
          )}
        </div>

        <div className="app-glass-surface rounded-lg p-7">
          <h2 className="mb-6 text-lg font-semibold">Active stages</h2>
          {parts.some((p) => p.challenge?.challengeType === "hackathon") ? (
            <ul className="space-y-3 text-sm">
              {parts.flatMap((p) =>
                (p.challenge?.stages ?? [])
                  .filter((s) => s.status === "active")
                  .map((s) => (
                    <li
                      key={`${p.id}-${s.id}`}
                      className="flex items-center justify-between rounded-md border border-cs-border/50 px-3 py-2"
                    >
                      <span>
                        {p.challenge?.title} — {STAGE_TYPE_LABELS[s.stageType]}
                      </span>
                      <Button size="sm" variant="outline" asChild>
                        <Link
                          href={`/challenges/${p.challengeId}/stages/${s.id}/submit`}
                        >
                          Submit
                        </Link>
                      </Button>
                    </li>
                  )),
              )}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No active hackathon stages.</p>
          )}
        </div>
      </div>
    </div>
  );
}
