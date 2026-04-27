"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { use } from "react";
import { toast } from "sonner";
import {
  AdminUserActivityCard,
  AdminUserProfileFields,
} from "@/components/admin/admin-user-detail-view";
import PageHeader from "@/components/pageHeader/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getUser } from "@/lib/auth-api";
import { listChallenges } from "@/lib/challenges-api";
import type { Challenge } from "@/types/challenge";

export default function ViewSponsorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const {
    data: user,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["sponsor", id],
    queryFn: () => getUser(id),
  });

  const { data: challengesRes, isLoading: chLoad } = useQuery({
    queryKey: ["admin-sponsor-challenges", id],
    queryFn: () => listChallenges({ page: 1, limit: 50, sponsorId: id }),
    enabled: Boolean(user),
  });

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Sponsor" description="View sponsor details." />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (isError || !user) {
    if (isError && error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load sponsor",
      );
    }
    return (
      <div>
        <PageHeader title="Sponsor" description="View sponsor details." />
        <Button variant="outline" asChild className="mt-4">
          <Link href="/users/sponsors">Back to list</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Sponsor" description="View sponsor details.">
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/users/sponsors">Back to list</Link>
          </Button>
          <Button variant="default" asChild>
            <Link href={`/users/sponsors/${id}/edit`}>Edit</Link>
          </Button>
        </div>
      </PageHeader>
      <div className="mx-auto max-w-2xl space-y-6">
        <AdminUserProfileFields user={user} />
        <AdminUserActivityCard title="Challenges">
          {chLoad ? (
            <Skeleton className="h-16 w-full rounded-md" />
          ) : (challengesRes?.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No challenges created under this sponsor account.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {(challengesRes?.data ?? []).map((c: Challenge) => (
                <li key={c.id} className="flex flex-wrap items-center gap-2">
                  <Link
                    className="font-medium text-cs-primary hover:underline"
                    href={`/challenges/${c.id}`}
                  >
                    {c.title}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    ({c.approvalStatus})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </AdminUserActivityCard>
      </div>
    </div>
  );
}
