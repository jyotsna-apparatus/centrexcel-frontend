"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { use } from "react";
import {
  AdminUserActivityCard,
  AdminUserProfileFields,
} from "@/components/admin/admin-user-detail-view";
import PageHeader from "@/components/pageHeader/PageHeader";
import { Button } from "@/components/ui/button";
import { getUser } from "@/lib/auth-api";

export default function ViewParticipantPage({
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
    queryKey: ["participant", id],
    queryFn: () => getUser(id),
  });

  if (isLoading) {
    return (
      <div>
        <PageHeader
          title="Participant"
          description="View participant details."
        />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div>
        <PageHeader
          title="Participant"
          description="View participant details."
        />
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm !text-red-500">
          {error instanceof Error
            ? error.message
            : "Failed to load participant"}
        </div>
        <Button variant="outline" asChild className="mt-4">
          <Link href="/users/participants">Back to list</Link>
        </Button>
      </div>
    );
  }

  const joinedDate = user.createdAt
    ? (() => {
        try {
          return new Date(user.createdAt).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
        } catch {
          return user.createdAt;
        }
      })()
    : "—";

  return (
    <div>
      <PageHeader title="Participant" description="View participant details.">
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/users/participants">Back to list</Link>
          </Button>
          <Button variant="default" asChild>
            <Link href={`/users/participants/${id}/edit`}>Edit</Link>
          </Button>
        </div>
      </PageHeader>
      <div className="mx-auto max-w-2xl space-y-6">
        <AdminUserProfileFields user={user} />
        <AdminUserActivityCard title="Activity">
          <p className="text-sm text-muted-foreground">
            Member since <span className="font-medium">{joinedDate}</span>.
            Challenge enrollments and submissions are visible on the
            participant&apos;s challenge pages.
          </p>
        </AdminUserActivityCard>
      </div>
    </div>
  );
}
