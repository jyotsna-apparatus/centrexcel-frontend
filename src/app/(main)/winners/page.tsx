"use client";

import { useQuery } from "@tanstack/react-query";
import { Medal, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import PageHeader from "@/components/pageHeader/PageHeader";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { canAccessPath } from "@/config/sidebar-nav";
import { useAuth } from "@/contexts/auth-context";
import {
  getChallengeWinners,
  getMyParticipations,
  listChallenges,
} from "@/lib/challenges-api";
import type { Winner } from "@/types/challenge";

const POSITION_LABELS: Record<number, string> = {
  1: "1st place",
  2: "2nd place",
  3: "3rd place",
};

export default function WinnersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedChallengeId, setSelectedChallengeId] = useState("");
  const isParticipant = user?.role === "participant";
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (user?.role && !canAccessPath("/winners", user.role)) {
      router.replace("/dashboard");
    }
  }, [user?.role, router]);

  const { data: participationsRes, isLoading: pLoad } = useQuery({
    queryKey: ["my-participations", "winners"],
    queryFn: () => getMyParticipations({ page: 1, limit: 200 }),
    enabled: isParticipant,
  });

  const { data: adminChallenges, isLoading: aLoad } = useQuery({
    queryKey: ["challenges", "winners-admin"],
    queryFn: () =>
      listChallenges({
        page: 1,
        limit: 100,
        challengeType: "hackathon",
      }),
    enabled: isAdmin,
  });

  const hackathonsFromParts = useMemo(() => {
    const parts = participationsRes?.data ?? [];
    const map = new Map<string, { id: string; title: string }>();
    for (const p of parts) {
      const ch = p.challenge;
      if (!ch || ch.challengeType !== "hackathon") continue;
      map.set(ch.id, { id: ch.id, title: ch.title });
    }
    return Array.from(map.values());
  }, [participationsRes?.data]);

  const hackathons = isParticipant
    ? hackathonsFromParts
    : (adminChallenges?.data ?? [])
        .filter((c) => c.challengeType === "hackathon")
        .map((c) => ({ id: c.id, title: c.title }));

  const firstId = hackathons[0]?.id ?? "";

  useEffect(() => {
    if (selectedChallengeId === "" && firstId) setSelectedChallengeId(firstId);
  }, [firstId, selectedChallengeId]);

  const {
    data: winners = [],
    isLoading: wLoad,
    isError: wErr,
    error: wMessage,
  } = useQuery({
    queryKey: ["winners", selectedChallengeId],
    queryFn: () => getChallengeWinners(selectedChallengeId),
    enabled: Boolean(selectedChallengeId),
  });

  useEffect(() => {
    if (wErr && wMessage && selectedChallengeId) {
      toast.error(
        wMessage instanceof Error ? wMessage.message : "Failed to load winners",
      );
    }
  }, [wErr, wMessage, selectedChallengeId]);

  const winnersList: Winner[] = Array.isArray(winners) ? winners : [];
  const loadingList =
    (isParticipant && pLoad) || (isAdmin && aLoad) || wLoad;

  return (
    <div>
      <PageHeader
        title="Winnings"
        description="View challenge winners and results."
      />

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <label className="text-sm font-medium text-cs-text">Challenge</label>
        <Select
          value={selectedChallengeId}
          onChange={(e) => setSelectedChallengeId(e.target.value)}
          className="min-w-[240px]"
        >
          <option value="">Select a challenge</option>
          {hackathons.map((h) => (
            <option key={h.id} value={h.id}>
              {h.title}
            </option>
          ))}
        </Select>
      </div>

      {loadingList && hackathons.length === 0 ? (
        <Skeleton className="h-32 w-full rounded-lg" />
      ) : hackathons.length === 0 ? (
        <p className="text-muted-foreground">
          {isParticipant
            ? "You can view winnings for hackathon challenges you joined."
            : "No hackathon challenges found."}
        </p>
      ) : !selectedChallengeId ? (
        <p className="text-muted-foreground">Select a challenge to view winnings.</p>
      ) : wLoad ? (
        <Skeleton className="h-48 w-full rounded-lg" />
      ) : winnersList.length === 0 ? (
        <p className="text-muted-foreground">
          No winners announced yet for this challenge.
        </p>
      ) : (
        <ul className="space-y-4">
          {winnersList
            .slice()
            .sort((a, b) => a.position - b.position)
            .map((w) => (
              <li
                key={w.id}
                className="flex items-start gap-4 rounded-lg border border-cs-border bg-card p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  {w.position === 1 ? (
                    <Trophy className="size-5" />
                  ) : (
                    <Medal className="size-5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-cs-heading">
                    {POSITION_LABELS[w.position] ?? `Position ${w.position}`}
                  </p>
                  <p className="mt-0.5 text-sm text-cs-text">
                    {w.stageSubmission?.title ?? "Submission"}
                  </p>
                  {w.stageSubmission?.team?.name ? (
                    <p className="text-xs text-muted-foreground">
                      Team: {w.stageSubmission.team.name}
                    </p>
                  ) : null}
                  {w.stageSubmission?.averageScore != null ? (
                    <p className="text-xs text-muted-foreground">
                      Average score: {w.stageSubmission.averageScore}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
