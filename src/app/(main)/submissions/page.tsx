"use client";

import { useQuery } from "@tanstack/react-query";
import { Download, FileArchive, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import PageHeader from "@/components/pageHeader/PageHeader";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { STAGE_TYPE_LABELS } from "@/config/challenge-constants";
import { canAccessPath } from "@/config/sidebar-nav";
import { useAuth } from "@/contexts/auth-context";
import { getMyParticipations } from "@/lib/challenges-api";
import {
  downloadDailyEntryFile,
  downloadStageSubmissionFile,
  triggerBrowserDownload,
} from "@/lib/submissions-api";
import type { DailyChallengeEntry, StageSubmission } from "@/types/challenge";

function formatBytes(n: number | bigint | string | undefined): string {
  const bytes = typeof n === "bigint" ? Number(n) : Number(n ?? 0);
  if (!Number.isFinite(bytes) || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function dlStage(s: StageSubmission) {
  try {
    const { blob, filename } = await downloadStageSubmissionFile(s.id);
    triggerBrowserDownload(blob, filename);
    toast.success("Download started");
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "Download failed");
  }
}

async function dlDaily(e: DailyChallengeEntry) {
  try {
    const { blob, filename } = await downloadDailyEntryFile(e.id);
    triggerBrowserDownload(blob, filename);
    toast.success("Download started");
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Download failed");
  }
}

export default function SubmissionsPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role && !canAccessPath("/submissions", user.role)) {
      router.replace("/dashboard");
    }
  }, [user?.role, router]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["participations", "submissions-page"],
    queryFn: () => getMyParticipations({ page: 1, limit: 50 }),
    enabled: user?.role === "participant",
  });

  if (user?.role && user.role !== "participant") {
    return (
      <div>
        <PageHeader title="Submissions" description="Participant submissions only." />
        <p className="text-sm text-muted-foreground">Switch to a participant account.</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <PageHeader title="Submissions" description="Your challenge uploads." />
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load"}
        </p>
      </div>
    );
  }

  const rows = data?.data ?? [];

  return (
    <div>
      <PageHeader
        title="Submissions"
        description="Hackathon stage zips and startup daily entries from your enrollments."
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-8 animate-spin text-cs-primary" />
        </div>
      ) : rows.length === 0 ? (
        <GlassCard className="p-8 text-center text-sm text-muted-foreground">
          No enrollments yet.{" "}
          <Link href="/challenges" className="text-cs-primary underline">
            Browse challenges
          </Link>
        </GlassCard>
      ) : (
        <div className="space-y-8">
          {rows.map((p) => (
            <GlassCard key={p.id} className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-cs-heading">
                    {p.challenge?.title ?? "Challenge"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {p.challenge?.challengeType === "hackathon"
                      ? "Hackathon — stage submissions"
                      : "Startup — daily entries"}
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/challenges/${p.challengeId}`}>View challenge</Link>
                </Button>
              </div>

              {p.challenge?.challengeType === "hackathon" ? (
                <ul className="mt-4 space-y-2">
                  {(p.stageSubmissions ?? []).length === 0 ? (
                    <li className="text-sm text-muted-foreground">No stage uploads yet.</li>
                  ) : (
                    (p.stageSubmissions ?? []).map((s) => (
                      <li
                        key={s.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-cs-border/60 bg-card/50 px-3 py-2 text-sm"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileArchive className="size-4 shrink-0 text-cs-primary" />
                          <span className="truncate font-medium">{s.title}</span>
                          <span className="text-muted-foreground">
                            ·{" "}
                            {s.stage
                              ? STAGE_TYPE_LABELS[s.stage.stageType]
                              : "Stage"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {formatBytes(s.fileSize)}
                          {s.averageScore != null && (
                            <span>· Avg {Number(s.averageScore)}</span>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8"
                            onClick={() => void dlStage(s)}
                          >
                            <Download className="size-4" />
                          </Button>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              ) : (
                <ul className="mt-4 space-y-2">
                  {(p.dailyEntries ?? []).length === 0 ? (
                    <li className="text-sm text-muted-foreground">No daily entries yet.</li>
                  ) : (
                    (p.dailyEntries ?? []).map((e) => (
                      <li
                        key={e.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-cs-border/60 bg-card/50 px-3 py-2 text-sm"
                      >
                        <span>
                          Day <strong>{e.dayNumber}</strong>
                        </span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {formatBytes(e.fileSize)}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8"
                            onClick={() => void dlDaily(e)}
                          >
                            <Download className="size-4" />
                          </Button>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
