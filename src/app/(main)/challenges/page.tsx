"use client";

import {
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChallengeCard } from "@/components/challenge-card";
import PageHeader from "@/components/pageHeader/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  CHALLENGE_STATUS_LABELS,
  CHALLENGE_TYPE_LABELS,
} from "@/config/challenge-constants";
import { useAuth } from "@/contexts/auth-context";
import { useChallengesPage } from "@/hooks/use-challenges";
import { getMyParticipations } from "@/lib/challenges-api";
import type {
  ChallengeStatus,
  ChallengeType,
} from "@/types/challenge";

const DEBOUNCE_MS = 300;
const PAGE_SIZE_OPTIONS = [12, 24, 48] as const;
const DEFAULT_PAGE_SIZE = 12;

function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

export default function ChallengesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isSponsor = user?.role === "sponsor";
  const isParticipant = user?.role === "participant";

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const debouncedSearch = useDebounced(searchInput.trim(), DEBOUNCE_MS);

  const { data, isLoading, isFetching, isError, error } = useChallengesPage({
    page: pageIndex,
    pageSize,
    search: debouncedSearch || undefined,
    status: (statusFilter || undefined) as ChallengeStatus | undefined,
    challengeType: (typeFilter || undefined) as ChallengeType | undefined,
  });

  const myParticipationsQuery = useQuery({
    queryKey: ["my-participation-ids", user?.id],
    queryFn: () => getMyParticipations({ page: 1, limit: 200 }),
    enabled: isParticipant,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (isError && error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load challenges",
      );
    }
  }, [isError, error]);

  const challenges = data?.data ?? [];
  const participatedChallengeIds = new Set(
    (myParticipationsQuery.data?.data ?? []).map((p) => p.challengeId),
  );
  const pagination = data?.pagination;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const totalCount = pagination?.total ?? 0;
  const startItem = totalCount === 0 ? 0 : pageIndex * pageSize + 1;
  const endItem = Math.min((pageIndex + 1) * pageSize, totalCount);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchInput(e.target.value);
      setPageIndex(0);
    },
    [],
  );

  return (
    <div>
      <PageHeader
        title="Challenges"
        description="Hackathon and startup challenges you can join or manage."
      >
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <Button variant="outline" asChild>
              <Link href="/challenges/approvals">
                <ClipboardCheck className="mr-2 size-4 text-cs-primary" />
                Approvals
              </Link>
            </Button>
          )}
          {(isAdmin || isSponsor) && (
            <Button variant="default" asChild>
              <Link href="/challenges/new">
                <Plus className="size-4" color="black" />
                {isSponsor && !isAdmin ? "Submit challenge" : "Create challenge"}
              </Link>
            </Button>
          )}
        </div>
      </PageHeader>

      <div className="mb-8 flex flex-wrap items-center gap-4 md:gap-5 bg-gradient-to-r from-cs-primary to-cs-secondary  outline outline-white/50 w-full p-4 rounded-lg">
        <Input
          type="search"
          placeholder="Search by title or description..."
          value={searchInput}
          onChange={handleSearchChange}
          className="max-w-xs"
          aria-label="Search challenges"
        />
        <Select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPageIndex(0);
          }}
          className="w-[180px]"
        >
          <option value="">All statuses</option>
          {Object.entries(CHALLENGE_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPageIndex(0);
          }}
          className="w-[240px]"
        >
          <option value="">All challenge types</option>
          <option value="hackathon">{CHALLENGE_TYPE_LABELS.hackathon}</option>
          <option value="startup">{CHALLENGE_TYPE_LABELS.startup}</option>
        </Select>
        <Select
          value={String(pageSize)}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setPageIndex(0);
          }}
          className="w-[120px]"
          aria-label="Items per page"
        >
          {PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n} per page
            </option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-72 animate-pulse rounded-lg border border-cs-border bg-card"
            />
          ))}
        </div>
      ) : challenges.length === 0 ? (
        <div className="rounded-xl border border-cs-border/80 bg-card px-4 py-16 text-center">
          <p className="text-muted-foreground mb-4">
            {isFetching && debouncedSearch
              ? "Searching..."
              : "No challenges found."}
          </p>
          {(isAdmin || isSponsor) && !isFetching && !debouncedSearch && (
            <Button asChild>
              <Link href="/challenges/new">
                <Plus className="mr-2 size-4" />
                {isSponsor && !isAdmin ? "Submit challenge" : "Create challenge"}
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid w-full gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {challenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                showApprovalBadge={isAdmin || isSponsor}
                showParticipate={isParticipant}
                alreadyParticipated={participatedChallengeIds.has(challenge.id)}
              />
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-cs-border/50 pt-8">
            <p className="text-sm text-muted-foreground">
              {totalCount === 0
                ? "No challenges"
                : `Showing ${startItem}–${endItem} of ${totalCount}`}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                disabled={pageIndex === 0 || isFetching}
                aria-label="Previous page"
              >
                <ChevronLeft className="size-4" />
                Previous
              </Button>
              <span className="px-2 text-sm text-muted-foreground">
                Page {pageIndex + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPageIndex((p) => Math.min(totalPages - 1, p + 1))
                }
                disabled={pageIndex >= totalPages - 1 || isFetching}
                aria-label="Next page"
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
