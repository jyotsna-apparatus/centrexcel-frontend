"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, ClipboardCheck, Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { HackathonCard } from "@/components/hackathon-card";
import PageHeader from "@/components/pageHeader/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { HACKATHON_STATUS_LABELS } from "@/config/hackathon-constants";
import { useAuth } from "@/contexts/auth-context";
import { useHackathons } from "@/hooks/use-hackathons";
import { useTeams } from "@/hooks/use-teams";
import { getMyParticipations } from "@/lib/auth-api";

const DEBOUNCE_MS = 300;
const PAGE_SIZE_OPTIONS = [12, 24, 48] as const;
const DEFAULT_PAGE_SIZE = 12;

function useDebouncedSearch(initialValue: string, delayMs: number) {
  const [value, setValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return [value, debouncedValue, setValue] as const;
}

export default function HackathonsPage() {
  const { user } = useAuth();
  const isParticipant = user?.role === "participant";
  const isAdmin = user?.role === "admin";
  const isSponsor = user?.role === "sponsor";

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [searchInput, debouncedSearch, setSearchInput] = useDebouncedSearch(
    "",
    DEBOUNCE_MS,
  );
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data, isLoading, isError, error, isFetching } = useHackathons({
    page: pageIndex,
    pageSize,
    search: debouncedSearch.trim() || undefined,
    status: statusFilter || undefined,
  });

  const { data: myTeamsData } = useTeams({
    page: 0,
    pageSize: 100,
    search: "",
    hackathonId: undefined,
  });
  const allTeams = myTeamsData?.data ?? [];
  const myTeams = allTeams.filter((t) =>
    t.members?.some((m) => m.userId === user?.id),
  );
  const teamByHackathonId = useMemo(() => {
    const map: Record<string, { id: string }> = {};
    for (const team of myTeams) {
      for (const p of team.participations ?? []) {
        if (p.hackathon?.id && !map[p.hackathon.id]) {
          map[p.hackathon.id] = { id: team.id };
        }
      }
    }
    return map;
  }, [myTeams]);

  const { data: myParticipationsData } = useQuery({
    queryKey: ["hackathons-page", "my-participations"],
    queryFn: () => getMyParticipations({ page: 1, limit: 500 }),
    enabled: isParticipant,
  });

  const participatedHackathonIds = useMemo(() => {
    return new Set(
      (myParticipationsData?.data ?? []).map((p) => p.hackathonId),
    );
  }, [myParticipationsData?.data]);

  const hackathonsRaw = data?.data;
  const hackathons = Array.isArray(hackathonsRaw) ? hackathonsRaw : [];
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
    [setSearchInput],
  );

  useEffect(() => {
    if (isError && error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load challenges",
      );
    }
  }, [isError, error]);

  return (
    <div>
      <PageHeader
        title="Challenges"
        description="Browse and manage challenge events."
      >
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <Button variant="outline" asChild>
              <Link href="/hackathons/approvals">
                <ClipboardCheck className="mr-2 size-4 text-cs-primary" />
                Approvals
              </Link>
            </Button>
          )}
          {(isAdmin || isSponsor) && (
            <Button variant="default" asChild>
              <Link href="/hackathons/new">
                <Plus className="size-4" color="black" />
                {isSponsor && !isAdmin
                  ? "Submit challenge"
                  : "Create challenge"}
              </Link>
            </Button>
          )}
        </div>
      </PageHeader>

      <div className="mb-8 flex flex-wrap items-center gap-4 md:gap-5">
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
          {Object.entries(HACKATHON_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
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
              className="h-56 animate-pulse rounded-lg border border-cs-border bg-card"
            />
          ))}
        </div>
      ) : hackathons.length === 0 ? (
        <div className="rounded-xl border border-cs-border/80 bg-card px-4 py-16 text-center">
          <p className="text-muted-foreground mb-4">
            {isFetching && debouncedSearch
              ? "Searching..."
              : "No challenges found."}
          </p>
          {(isAdmin || isSponsor) && !isFetching && !debouncedSearch && (
            <p className="text-muted-foreground text-sm mb-4">
              {isSponsor && !isAdmin
                ? "Submit a challenge for admin approval to list it here once approved."
                : "Create your first challenge to get started."}
            </p>
          )}
          {(isAdmin || isSponsor) && !isFetching && (
            <Button asChild>
              <Link href="/hackathons/new">
                <Plus className="mr-2 size-4" />
                {isSponsor && !isAdmin
                  ? "Submit challenge"
                  : "Create challenge"}
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          <div
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 400px))",
            }}
          >
            {hackathons.map((hackathon) => (
              <HackathonCard
                key={hackathon.id}
                hackathon={hackathon}
                variant="list"
                isAdmin={isAdmin}
                showApprovalBadge={isAdmin || isSponsor}
                isSponsor={isSponsor}
                isParticipant={isParticipant}
                hasParticipated={
                  isParticipant
                    ? participatedHackathonIds.has(hackathon.id)
                    : false
                }
                userTeamForHackathon={
                  isParticipant
                    ? (teamByHackathonId[hackathon.id] ?? null)
                    : null
                }
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
              <span className="text-sm text-muted-foreground px-2">
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
